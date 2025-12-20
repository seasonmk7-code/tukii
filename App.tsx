
import React, { useState, useMemo, ErrorInfo, ReactNode, Component } from 'react';
import { LiveObject } from "@liveblocks/client";
import { LiveblocksProvider, RoomProvider, useStorage, useMutation, useOthers, useStatus } from "@liveblocks/react";
import { Inputs, Destination, ProductType } from './types';
import InputSection from './components/InputSection';
import ResultCard from './components/ResultCard';
import AnalysisChart from './components/AnalysisChart';
import GeminiAdvisor from './components/GeminiAdvisor';
import ExchangeRateChart from './components/ExchangeRateChart';
import ForeignBuyerPanel from './components/ForeignBuyerPanel';
import MultiplayerConnect from './components/MultiplayerConnect';
import { findOptimalQuantity, calculateScenario } from './utils/calculations';
import { Check, AlertTriangle, Layers, Globe, Activity, Loader2 } from 'lucide-react';

interface ErrorBoundaryProps {
  children?: ReactNode;
  onReset: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Fix: Corrected inheritance from React.Component and removed redundant state member declaration to resolve context errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Multiplayer Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-xl p-4">
           <div className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl text-center border border-slate-200">
              <div className="bg-rose-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                 <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">连接异常中断</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                 系统在尝试同步数据时遇到错误。可能是您的 API Key 设置有误或网络受限。
              </p>
              <button 
                onClick={() => { this.setState({ hasError: false, error: null }); this.props.onReset(); }}
                className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                重置并返回单机模式
              </button>
           </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const INITIAL_INPUTS: Inputs = {
  priceSteel: 3500, pricePV: 600, priceCar: 85000,
  exchangeRate: 7.1, freightCostUSD: 5000,
  balance: 500, reserve: 50, margin: 0.2,
  sellPriceSteelUSD: 650, sellPricePVUSD: 110, sellPriceCarUSD: 16000,
  foreignBalance: 2000000, 
  destination: Destination.LA, // Default to LA (20ft)
  miscFee: 9000,
};

const App: React.FC = () => {
  const [connection, setConnection] = useState<{key: string, room: string} | null>(null);
  const [localInputs, setLocalInputs] = useState<Inputs>(INITIAL_INPUTS);
  const [localManualQ, setLocalManualQ] = useState<Record<ProductType, number | null>>({
    [ProductType.STEEL]: null, [ProductType.PV]: null, [ProductType.CAR]: null,
  });

  const handleConnect = (apiKey: string, room: string) => {
    if (!apiKey.trim()) return;
    setConnection({ key: apiKey.trim(), room: room.trim() });
  };

  const handleDisconnect = () => setConnection(null);

  return (
    <div className="min-h-screen relative pb-20 selection:bg-indigo-500 selection:text-white">
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.02] select-none overflow-hidden">
        <div className="transform -rotate-12 text-[20vw] font-black text-slate-900 whitespace-nowrap">TUKI KING</div>
      </div>

      {connection ? (
          <ErrorBoundary onReset={handleDisconnect}>
             <LiveblocksProvider publicApiKey={connection.key}>
                <RoomProvider 
                  id={connection.room} 
                  initialStorage={{
                      // Added as any to bypass index signature missing error in Inputs
                      inputs: new LiveObject(localInputs as any),
                      manualQuantities: new LiveObject({ steel: localManualQ[ProductType.STEEL] ?? -1, pv: localManualQ[ProductType.PV] ?? -1, car: localManualQ[ProductType.CAR] ?? -1 } as any)
                  }}
                >
                   <SyncedApp onDisconnect={handleDisconnect} localFallback={{ inputs: localInputs, manualQ: localManualQ }} />
                </RoomProvider>
             </LiveblocksProvider>
          </ErrorBoundary>
      ) : (
          <StatelessApp inputs={localInputs} setInputs={setLocalInputs} manualQuantities={localManualQ} setManualQuantities={(t, v) => setLocalManualQ(p => ({...p, [t]: v}))} onConnect={handleConnect} isConnected={false} />
      )}
    </div>
  );
};

const SyncedApp: React.FC<{ onDisconnect: () => void, localFallback: any }> = ({ onDisconnect, localFallback }) => {
    const remoteInputs = useStorage((root) => root.inputs);
    const remoteManualQ = useStorage((root) => root.manualQuantities);
    const others = useOthers();
    const status = useStatus();
    
    // Cast storage.get to any to access toObject and update
    const updateInputsRemote = useMutation(({ storage }, updateFnOrVal: any) => {
        const root = storage.get("inputs") as any;
        if (!root) return;
        const next = typeof updateFnOrVal === 'function' ? updateFnOrVal(root.toObject()) : updateFnOrVal;
        root.update(next);
    }, []);

    // Cast storage.get to any to access set method
    const updateManualQRemote = useMutation(({ storage }, { type, val }: { type: ProductType, val: number | null }) => {
        const root = storage.get("manualQuantities") as any;
        if (!root) return;
        const key = type === ProductType.STEEL ? 'steel' : type === ProductType.PV ? 'pv' : 'car';
        root.set(key, val === null ? -1 : val);
    }, []);

    // 重要：如果存储尚未加载，显示加载状态以防止触发未就绪的 Mutation
    if (remoteInputs === null || remoteManualQ === null) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
           <div className="relative">
             <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin"></div>
             <Loader2 className="w-8 h-8 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
           </div>
           <div className="text-center">
             <p className="text-slate-800 font-black text-xl mb-1">正在初始化同步中心</p>
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Trade Engine Data...</p>
           </div>
           <button 
             onClick={onDisconnect}
             className="mt-4 px-6 py-2 text-slate-400 hover:text-rose-500 font-bold text-xs uppercase tracking-widest border border-slate-200 rounded-full hover:border-rose-200 transition-all"
           >
             取消连接
           </button>
        </div>
      );
    }

    const inputs = remoteInputs;
    // Cast remoteManualQ to any to access properties safely
    const manualQRaw = remoteManualQ as any;
    const manualQuantities = {
        [ProductType.STEEL]: manualQRaw.steel === -1 ? null : manualQRaw.steel,
        [ProductType.PV]: manualQRaw.pv === -1 ? null : manualQRaw.pv,
        [ProductType.CAR]: manualQRaw.car === -1 ? null : manualQRaw.car,
    };

    // Correctly cast and access count via length property
    return (
        <StatelessApp 
            inputs={inputs as unknown as Inputs} 
            setInputs={updateInputsRemote as any} 
            manualQuantities={manualQuantities} 
            setManualQuantities={(type, val) => updateManualQRemote({ type, val })} 
            onConnect={() => {}} 
            onDisconnect={onDisconnect} 
            isConnected={true} 
            userCount={others.length + 1} 
        />
    );
}

interface StatelessProps {
    inputs: Inputs; setInputs: React.Dispatch<React.SetStateAction<Inputs>>; manualQuantities: Record<ProductType, number | null>; setManualQuantities: (type: ProductType, val: number | null) => void; onConnect: (key: string, room: string) => void; onDisconnect?: () => void; isConnected: boolean; userCount?: number;
}

const StatelessApp: React.FC<StatelessProps> = ({ inputs, setInputs, manualQuantities, setManualQuantities, onConnect, onDisconnect, isConnected, userCount }) => {
    const [copied, setCopied] = useState(false);

    const optimizationResults = useMemo(() => ({
        steel: findOptimalQuantity(ProductType.STEEL, inputs),
        pv: findOptimalQuantity(ProductType.PV, inputs),
        car: findOptimalQuantity(ProductType.CAR, inputs),
    }), [inputs]);

    const displayedResults = useMemo(() => {
        const getResult = (type: ProductType, opt: any) => {
            const manualQ = manualQuantities[type];
            return (manualQ !== null && manualQ > 0) ? calculateScenario(manualQ, type, inputs) : opt?.optimal || null;
        };
        return { steel: getResult(ProductType.STEEL, optimizationResults.steel), pv: getResult(ProductType.PV, optimizationResults.pv), car: getResult(ProductType.CAR, optimizationResults.car) };
    }, [inputs, optimizationResults, manualQuantities]);

    const handleMarginUpdate = (newK: number) => {
      setInputs((prev: Inputs) => ({ ...prev, margin: parseFloat(newK.toFixed(2)) }));
    };

    return (
      <div className="max-w-[1600px] mx-auto px-6 py-12 relative z-10">
        <header className="mb-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-6 group">
             <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-white shadow-2xl transition-transform group-hover:rotate-12">
                <Layers className="w-8 h-8" />
             </div>
             <div>
                <h1 className="text-5xl font-[900] text-slate-900 tracking-tighter mb-1">Tuki大王 贸易大脑</h1>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Trade Intelligence & Logistics v2.0</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Real-time Optimized
                  </span>
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <MultiplayerConnect isConnected={isConnected} onConnect={onConnect} onDisconnect={onDisconnect || (() => {})} userCount={userCount || 1} />
             <button 
                onClick={() => {
                  navigator.clipboard.writeText("Trade Report Exported").then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
                }}
                className={`group flex items-center gap-3 px-8 py-4 rounded-[20px] font-black text-sm transition-all shadow-xl active:scale-95 ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-800 border border-slate-100'}`}
             >
                {copied ? <Check className="w-5 h-5" /> : <Globe className="w-5 h-5 text-indigo-500" />}
                {copied ? '分析结果已复制' : '全系统快照'}
             </button>
          </div>
        </header>

        <InputSection inputs={inputs} setInputs={setInputs} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
          <ResultCard 
             type={ProductType.STEEL} 
             result={displayedResults.steel} 
             recommendedQuantity={optimizationResults.steel?.optimal?.quantity || 0} 
             onQuantityChange={(v) => setManualQuantities(ProductType.STEEL, v)} 
             onMarginChange={handleMarginUpdate}
             isManual={manualQuantities[ProductType.STEEL] !== null} 
             inputs={inputs} 
          />
          <ResultCard 
             type={ProductType.PV} 
             result={displayedResults.pv} 
             recommendedQuantity={optimizationResults.pv?.optimal?.quantity || 0} 
             onQuantityChange={(v) => setManualQuantities(ProductType.PV, v)} 
             onMarginChange={handleMarginUpdate}
             isManual={manualQuantities[ProductType.PV] !== null} 
             inputs={inputs} 
          />
          <ResultCard 
             type={ProductType.CAR} 
             result={displayedResults.car} 
             recommendedQuantity={optimizationResults.car?.optimal?.quantity || 0} 
             onQuantityChange={(v) => setManualQuantities(ProductType.CAR, v)} 
             onMarginChange={handleMarginUpdate}
             isManual={manualQuantities[ProductType.CAR] !== null} 
             inputs={inputs} 
          />
        </div>

        <ForeignBuyerPanel inputs={inputs} setInputs={setInputs} results={displayedResults} />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
           <div className="xl:col-span-8 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <AnalysisChart data={optimizationResults.steel?.dataPoints || []} label="钢铁利润曲线" />
                 <AnalysisChart data={optimizationResults.pv?.dataPoints || []} label="光伏利润曲线" />
                 <AnalysisChart data={optimizationResults.car?.dataPoints || []} label="汽车利润曲线" />
              </div>
              <ExchangeRateChart inputs={inputs} bestSteelQ={displayedResults.steel?.quantity || 1} bestPvQ={displayedResults.pv?.quantity || 1} bestCarQ={displayedResults.car?.quantity || 1} />
           </div>
           <div className="xl:col-span-4 sticky top-8">
              <GeminiAdvisor results={displayedResults} />
           </div>
        </div>

        <footer className="mt-24 pt-12 border-t border-slate-200 text-center">
           <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-4">Developed by Tuki King &bull; 2025</p>
        </footer>
      </div>
    );
};

export default App;
