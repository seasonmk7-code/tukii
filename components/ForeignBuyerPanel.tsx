
import React, { useState, useEffect } from 'react';
import { Inputs, ProductType, CalculationResult, Destination } from '../types';
import { calculateForeignMetrics, calculateTargetFOB, calculateDomesticProfitAtFOB } from '../utils/calculations';
import { Briefcase, ArrowRight, Target, RefreshCw, Calculator, Container, Anchor, ShieldCheck, Wallet, AlertTriangle, CheckCircle2, Search, Truck, Coins } from 'lucide-react';
import CalculationDetailModal from './CalculationDetailModal';

interface BuyerCardProps {
    type: ProductType;
    label: string;
    colorClass: string;
    sellPrice: number;
    inputs: Inputs;
    localState: { fob: number; qty: number; desiredMargin: number };
    updateState: (type: ProductType, field: 'fob' | 'qty' | 'desiredMargin', value: number) => void;
    handleSync: (type: ProductType) => void;
    setModalType: (type: ProductType) => void;
}

const BuyerCard: React.FC<BuyerCardProps> = ({ type, label, colorClass, sellPrice, inputs, localState, updateState, handleSync, setModalType }) => {
    const { fob, qty, desiredMargin } = localState;
    const metrics = calculateForeignMetrics(fob, qty, type, inputs);
    const targetFOB = calculateTargetFOB(desiredMargin, sellPrice, metrics.F_USD);
    
    // 计算建议价格下的预览数据
    const previewMetrics = calculateForeignMetrics(targetFOB, qty, type, inputs);

    const totalLandedCost = metrics.totalLandedCost;
    const isAffordable = totalLandedCost <= inputs.foreignBalance;
    const budgetDelta = inputs.foreignBalance - totalLandedCost;

    const fmtUSD = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const fmtCompact = (n: number) => `$${(n/1000).toFixed(1)}k`;

    return (
        <div className="bg-slate-800 rounded-[2rem] p-6 border border-slate-700 shadow-lg relative overflow-hidden group flex flex-col h-full transition-all text-slate-100">
            <div className={`absolute top-0 right-0 w-40 h-40 ${colorClass} opacity-[0.08] rounded-bl-[100px] pointer-events-none transition-opacity`}></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 relative z-10">
                <h3 className="font-bold text-white text-lg tracking-wide">{label}</h3>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">国外零售价 (r)</p>
                    <p className="text-sm font-black text-white">${sellPrice}</p>
                </div>
            </div>

            <div className="space-y-6 relative z-10 flex-grow">
                {/* Simulation Inputs */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                            <Calculator className="w-3.5 h-3.5" /> 模拟交易参数
                        </h4>
                        <button onClick={() => handleSync(type)} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                            <RefreshCw className="w-3 h-3" /> 同步国内最优
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl">
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">FOB 报价 ($)</label>
                            <input 
                                type="number" 
                                value={fob}
                                onChange={(e) => updateState(type, 'fob', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-white font-black text-sm outline-none"
                            />
                        </div>
                        <div className="p-3 bg-slate-900 border border-slate-700 rounded-2xl">
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">采购数量</label>
                            <input 
                                type="number" 
                                value={qty}
                                onChange={(e) => updateState(type, 'qty', parseFloat(e.target.value) || 0)}
                                className="w-full bg-transparent text-white font-black text-sm outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Logistics Summary */}
                <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <Container className="w-4 h-4 text-slate-500" />
                        <div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">货柜数量</p>
                            <p className="text-xs font-black text-white">{metrics.containerCount} 个</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">总计运费</p>
                            <p className="text-xs font-black text-white">{fmtUSD(metrics.totalFreightUSD)}</p>
                        </div>
                    </div>
                </div>

                {/* Financial Results (Landed Cost) */}
                <div className={`rounded-[2rem] p-5 border ${isAffordable ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-rose-950/20 border-rose-800/50'} relative`}>
                    <button onClick={() => setModalType(type)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors p-1.5 bg-slate-900/50 rounded-lg">
                        <Search className="w-3.5 h-3.5"/>
                    </button>
                    
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">单件落地成本 (Unit Landed)</p>
                            <p className="text-lg font-black text-white">{fmtUSD(metrics.unitCost)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">落地总成本 (Total Landed)</p>
                            <div className="flex items-baseline justify-between">
                                <span className={`font-black text-2xl ${isAffordable ? 'text-white' : 'text-rose-400'}`}>{fmtUSD(totalLandedCost)}</span>
                                {isAffordable ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/> : <AlertTriangle className="w-5 h-5 text-rose-500"/>}
                            </div>
                            <p className={`text-[10px] mt-1 font-bold ${isAffordable ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>
                                {isAffordable ? '预算盈余' : '超出预算'}: {fmtCompact(Math.abs(budgetDelta))}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profit Split Comparison */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">🇨🇳 卖家总利润</p>
                        <p className="text-lg font-black text-white">{fmtUSD(metrics.sellerProfit)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">🌍 买家总利润</p>
                        <p className="text-lg font-black text-white">{fmtUSD(metrics.totalProfit)}</p>
                    </div>
                </div>
            </div>

            {/* Suggested FOB Section with Preview */}
            <div className="bg-indigo-950/30 rounded-[2rem] p-5 border border-indigo-500/20 mt-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">目标利润率预设</span>
                    </div>
                    <div className="flex items-center gap-2">
                         <input 
                            type="number" 
                            value={(desiredMargin * 100).toFixed(0)} 
                            onChange={(e) => updateState(type, 'desiredMargin', parseFloat(e.target.value) / 100)}
                            className="w-12 bg-slate-900 text-white text-xs font-black rounded p-1 text-center border border-indigo-500/30"
                        />
                        <span className="text-indigo-400 text-xs font-black">%</span>
                    </div>
                </div>

                {/* Detailed Preview Stats */}
                <div className="mb-4 grid grid-cols-3 gap-2 px-1 text-[9px] font-bold">
                    <div className="flex flex-col">
                        <span className="text-slate-400 uppercase opacity-60 mb-0.5">建议单价</span>
                        <span className="text-indigo-300 text-xs">{fmtUSD(targetFOB)}</span>
                    </div>
                    <div className="flex flex-col text-center">
                        <span className="text-slate-400 uppercase opacity-60 mb-0.5">卖家利润预览</span>
                        <span className="text-emerald-400 text-xs">{fmtUSD(previewMetrics.sellerProfit)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-slate-400 uppercase opacity-60 mb-0.5">买家利润预览</span>
                        <span className="text-indigo-400 text-xs">{fmtUSD(previewMetrics.totalProfit)}</span>
                    </div>
                </div>

                <button 
                    onClick={() => updateState(type, 'fob', parseFloat(targetFOB.toFixed(2)))}
                    className="w-full flex items-center justify-between bg-indigo-600 hover:bg-indigo-500 rounded-2xl px-5 py-3 transition-all group/btn shadow-xl shadow-indigo-900/20"
                >
                    <span className="text-white text-xs font-black uppercase tracking-widest">采纳建议价格</span>
                    <ArrowRight className="w-5 h-5 text-white transition-transform group-hover/btn:translate-x-1" />
                </button>
            </div>
        </div>
    );
};

interface Props {
  inputs: Inputs;
  setInputs: React.Dispatch<React.SetStateAction<Inputs>>;
  results: {
    steel: CalculationResult | null;
    pv: CalculationResult | null;
    car: CalculationResult | null;
  };
}

const ForeignBuyerPanel: React.FC<Props> = ({ inputs, setInputs, results }) => {
  const [localState, setLocalState] = useState<Record<ProductType, { fob: number; qty: number; desiredMargin: number }>>({
    [ProductType.STEEL]: { fob: 0, qty: 0, desiredMargin: 0.15 },
    [ProductType.PV]: { fob: 0, qty: 0, desiredMargin: 0.20 },
    [ProductType.CAR]: { fob: 0, qty: 0, desiredMargin: 0.10 },
  });
  
  const [modalType, setModalType] = useState<ProductType | null>(null);

  useEffect(() => {
    const sync = (type: ProductType, res: CalculationResult | null) => {
      if (!res) return;
      setLocalState(prev => {
        if (prev[type].fob === 0 && prev[type].qty === 0) {
           return {
             ...prev,
             [type]: { fob: parseFloat(res.FOB_USD.toFixed(2)), qty: res.quantity, desiredMargin: 0.15 }
           };
        }
        return prev;
      });
    };
    sync(ProductType.STEEL, results.steel);
    sync(ProductType.PV, results.pv);
    sync(ProductType.CAR, results.car);
  }, [results.steel, results.pv, results.car]);

  const updateState = (type: ProductType, field: 'fob' | 'qty' | 'desiredMargin', value: number) => {
    setLocalState(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleSync = (type: ProductType) => {
    const res = type === ProductType.STEEL ? results.steel : type === ProductType.PV ? results.pv : results.car;
    if (res) {
        updateState(type, 'fob', parseFloat(res.FOB_USD.toFixed(2)));
        updateState(type, 'qty', res.quantity);
    }
  };

  const getTempResultForModal = (type: ProductType): CalculationResult | null => {
      const { fob, qty } = localState[type];
      const metrics = calculateForeignMetrics(fob, qty, type, inputs);
      const domesticProfit = calculateDomesticProfitAtFOB(fob, qty, type, inputs);
      const avgMiscRMB = inputs.miscFee / qty;
      const x = (fob * inputs.exchangeRate) / (1 + inputs.margin) - avgMiscRMB; 
      
      return {
          quantity: qty, unitPriceRMB: x > 0 ? x : 0, containerCount: metrics.containerCount, containerType: inputs.destination === Destination.MIA_SEA ? '40ft' : '20ft', 
          containerUtilization: 0, spareCapacity: 0, totalFreightUSD: metrics.totalFreightUSD, avgMiscRMB: avgMiscRMB,
          N_USD: ((x + avgMiscRMB) / inputs.exchangeRate), FOB_USD: fob, CFR_USD: fob + metrics.unitFreightUSD,
          CIF_USD: fob + metrics.unitFreightUSD + metrics.insuranceUSD, I_USD: metrics.insuranceUSD, F_USD: metrics.unitFreightUSD,
          foreignActualCostUSD: metrics.unitCost, domesticUnitProfitUSD: (domesticProfit / qty), domesticTotalProfitUSD: domesticProfit,
          foreignUnitProfitUSD: metrics.unitProfit, foreignTotalProfitUSD: metrics.totalProfit, jointTotalProfitUSD: domesticProfit + metrics.totalProfit,
          domesticTotalCostRMB: 0
      } as CalculationResult;
  };

  return (
    <div className="bg-slate-900 rounded-[3rem] shadow-2xl border border-slate-800 overflow-hidden mt-12 mb-12 relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-900 to-slate-900 pointer-events-none"></div>

      <div className="relative p-10 border-b border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-8 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-5 text-white">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-xl">
                <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
                <h2 className="text-3xl font-black tracking-tight">国外买家模拟器 (Forward Simulation)</h2>
                <p className="text-slate-400 text-sm mt-1">深度模拟国外买家采购决策，实时验证落地成本与利润空间。</p>
            </div>
        </div>
        
        <div className="flex items-center gap-5 bg-black/40 p-4 rounded-2xl border border-slate-700/50 shadow-inner">
             <div className="flex items-center gap-2 text-indigo-400">
                 <Wallet className="w-5 h-5" />
                 <span className="text-xs font-black uppercase tracking-widest">国外采购预算限额</span>
             </div>
             <div className="flex items-center">
                 <span className="text-white font-black text-xl mr-1">$</span>
                 <input 
                     type="number"
                     value={inputs.foreignBalance / 10000}
                     onChange={(e) => setInputs(prev => ({ ...prev, foreignBalance: (parseFloat(e.target.value) || 0) * 10000 }))}
                     className="w-24 bg-transparent text-white font-black text-xl border-b-2 border-slate-600 focus:border-indigo-500 outline-none text-right transition-colors"
                 />
                 <span className="text-white font-black text-xl ml-1">万</span>
             </div>
        </div>
      </div>

      <div className="relative p-10 grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-900/30">
        <BuyerCard type={ProductType.STEEL} label="工业钢铁 (Steel)" colorClass="bg-cyan-500" sellPrice={inputs.sellPriceSteelUSD} inputs={inputs} localState={localState[ProductType.STEEL]} updateState={updateState} handleSync={handleSync} setModalType={setModalType} />
        <BuyerCard type={ProductType.PV} label="高效光伏 (PV)" colorClass="bg-amber-500" sellPrice={inputs.sellPricePVUSD} inputs={inputs} localState={localState[ProductType.PV]} updateState={updateState} handleSync={handleSync} setModalType={setModalType} />
        <BuyerCard type={ProductType.CAR} label="豪华汽车 (Car)" colorClass="bg-rose-500" sellPrice={inputs.sellPriceCarUSD} inputs={inputs} localState={localState[ProductType.CAR]} updateState={updateState} handleSync={handleSync} setModalType={setModalType} />
      </div>

      {modalType && (
        <CalculationDetailModal isOpen={!!modalType} onClose={() => setModalType(null)} result={getTempResultForModal(modalType)} inputs={inputs} type={modalType} />
      )}
    </div>
  );
};

export default ForeignBuyerPanel;
