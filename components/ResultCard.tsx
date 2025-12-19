
import React, { useState, useMemo } from 'react';
import { CalculationResult, ProductType, Inputs } from '../types';
import { TrendingUp, Package, Search, Zap, Box, ArrowRight, ShieldCheck, Truck, Scale, Coins, DollarSign, Target, Sparkles, AlertCircle, RotateCcw } from 'lucide-react';
import CalculationDetailModal from './CalculationDetailModal';
import { findDominantMargin } from '../utils/calculations';

interface Props {
  type: ProductType;
  result: CalculationResult | null;
  recommendedQuantity: number;
  onQuantityChange: (val: number | null) => void;
  onMarginChange?: (val: number) => void;
  isManual: boolean;
  inputs: Inputs;
}

const ResultCard: React.FC<Props> = ({ type, result, recommendedQuantity, onQuantityChange, onMarginChange, isManual, inputs }) => {
  const [showModal, setShowModal] = useState(false);

  const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtRMB = (n: number) => `¥${n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}`;
  
  const theme = {
      [ProductType.CAR]: { gradient: 'from-rose-500 to-rose-600', text: 'text-rose-600', icon: <Zap className="w-5 h-5" />, label: '豪华汽车 (Car)' },
      [ProductType.PV]: { gradient: 'from-amber-500 to-orange-500', text: 'text-amber-600', icon: <Box className="w-5 h-5" />, label: '高效光伏 (PV)' },
      [ProductType.STEEL]: { gradient: 'from-indigo-500 to-blue-600', text: 'text-indigo-600', icon: <Package className="w-5 h-5" />, label: '工业钢铁 (Steel)' }
  }[type];

  const displayQuantity = result ? result.quantity : recommendedQuantity;

  // 利润优势分析
  const dominanceMetrics = useMemo(() => {
    if (!result || result.foreignTotalProfitUSD === 0) return null;
    const ratio = result.domesticTotalProfitUSD / result.foreignTotalProfitUSD;
    const isTargetMet = ratio >= 1.18; // 目标 18%
    
    // 计算满足 18% 优势的建议 k 值
    const recommendation = findDominantMargin(result.quantity, type, inputs);
    
    return { ratio, isTargetMet, recommendation };
  }, [result, type, inputs]);

  return (
    <>
    <div className={`relative rounded-[2.5rem] border border-slate-200 bg-white premium-shadow transition-all duration-300 hover:shadow-2xl overflow-hidden flex flex-col`}>
      {/* Top Status Bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />
      
      <div className="p-8 space-y-6 flex-grow">
        {/* Header: Title & Quantity Control */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${theme.gradient} text-white shadow-lg`}>
                {theme.icon}
              </div>
              <div>
                <h3 className="font-[900] text-2xl text-slate-900 tracking-tight">{theme.label}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Trading Strategy</p>
              </div>
            </div>
            <button onClick={() => setShowModal(true)} className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors border border-slate-100">
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 group focus-within:ring-2 ring-indigo-500/20 transition-all relative">
                <div className="flex justify-between items-center mb-1">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">交易数量</label>
                   {isManual && (
                     <button 
                       onClick={() => onQuantityChange(null)}
                       className="p-1 hover:bg-white rounded-md text-indigo-500 transition-colors"
                       title="恢复推荐数量"
                     >
                       <RotateCcw className="w-3 h-3" />
                     </button>
                   )}
                </div>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    className="bg-transparent font-black text-2xl text-slate-900 focus:outline-none w-full"
                    value={displayQuantity}
                    onChange={(e) => onQuantityChange(parseInt(e.target.value) || 0)}
                  />
                  <span className="text-xs font-bold text-slate-400 shrink-0">UNIT</span>
                </div>
                {isManual && (
                  <div className="absolute -bottom-1 right-4">
                    <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 uppercase tracking-tighter">
                      Manual
                    </span>
                  </div>
                )}
             </div>
             <div className="p-4 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col justify-center">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">预算占用</label>
                <p className="text-xl font-black text-white">{fmtRMB(result?.domesticTotalCostRMB || 0)}</p>
             </div>
          </div>
        </div>

        {/* Domestic Quote Strategy Block */}
        <div className="p-5 rounded-[2rem] bg-slate-50 border border-slate-200 relative overflow-hidden group/quote">
           <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                 <Target className="w-4 h-4 text-indigo-500" />
                 <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">国内报价策略 (Target 18%)</span>
              </div>
              {dominanceMetrics?.isTargetMet ? (
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                   <Sparkles className="w-3 h-3" />
                   <span className="text-[9px] font-black uppercase">优势达标</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                   <AlertCircle className="w-3 h-3" />
                   <span className="text-[9px] font-black uppercase">优势不足</span>
                </div>
              )}
           </div>

           <div className="flex items-end justify-between gap-4">
              <div className="space-y-1">
                 <p className="text-[9px] font-bold text-slate-400 uppercase">当前利润比 (CN / US)</p>
                 <p className={`text-xl font-black ${dominanceMetrics?.isTargetMet ? 'text-slate-900' : 'text-rose-600'}`}>
                    {dominanceMetrics ? `${dominanceMetrics.ratio.toFixed(2)}x` : '--'}
                 </p>
              </div>
              
              <button 
                onClick={() => dominanceMetrics?.recommendation && onMarginChange?.(dominanceMetrics.recommendation.requiredK)}
                className="flex items-center gap-2 bg-white hover:bg-indigo-600 hover:text-white transition-all border border-slate-200 hover:border-indigo-600 rounded-2xl px-4 py-2 shadow-sm active:scale-95 group-hover/quote:border-indigo-200"
              >
                 <div className="text-right">
                    <p className="text-[8px] font-bold opacity-60 uppercase">推荐利润率</p>
                    <p className="text-xs font-black">k = {((dominanceMetrics?.recommendation?.requiredK || 0) * 100).toFixed(0)}%</p>
                 </div>
                 <ArrowRight className="w-4 h-4" />
              </button>
           </div>
        </div>

        {/* Trade Pipeline Details */}
        <div className="space-y-4">
           <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
             <Scale className="w-3 h-3" /> 全流程价值转换 (Trade Pipeline)
           </h4>
           
           <div className="grid grid-cols-1 gap-3">
              {/* RMB Stage */}
              <div className="flex items-center gap-4 group">
                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                    <Coins className="w-4 h-4 text-slate-500" />
                 </div>
                 <div className="flex-grow flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-slate-200">
                    <div>
                       <p className="text-[9px] font-bold text-slate-400 uppercase">国内买入单价 (RMB)</p>
                       <p className="text-sm font-black text-slate-800">{fmtRMB(result?.unitPriceRMB || 0)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-bold text-slate-400 uppercase">杂费分摊</p>
                       <p className="text-xs font-bold text-slate-600">+{fmtRMB(result?.avgMiscRMB || 0)}</p>
                    </div>
                 </div>
              </div>

              {/* USD Cost Stage */}
              <div className="flex items-center gap-4 group">
                 <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                    <ArrowRight className="w-4 h-4 text-indigo-500" />
                 </div>
                 <div className="flex-grow flex justify-between items-center p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100 group-hover:bg-white">
                    <div>
                       <p className="text-[9px] font-bold text-indigo-400 uppercase">出口成本 (N_USD)</p>
                       <p className="text-sm font-black text-indigo-700">{fmtUSD(result?.N_USD || 0)}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-bold text-indigo-400 uppercase">利润期望 (k)</p>
                       <p className="text-xs font-bold text-indigo-600">+{((inputs.margin || 0)*100).toFixed(0)}%</p>
                    </div>
                 </div>
              </div>

              {/* Trade Terms Stage */}
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                 </div>
                 <div className="flex-grow grid grid-cols-2 gap-2">
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                       <p className="text-[9px] font-bold text-emerald-500 uppercase mb-0.5">离岸价 FOB</p>
                       <p className="text-sm font-black text-emerald-700">{fmtUSD(result?.FOB_USD || 0)}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                       <p className="text-[9px] font-bold text-blue-500 uppercase mb-0.5">到岸价 CIF</p>
                       <p className="text-sm font-black text-blue-700">{fmtUSD(result?.CIF_USD || 0)}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Profits Highlight */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
           <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-100">
                 <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">国内利润 (CN)</p>
                 <p className="text-lg font-black text-emerald-700">{fmtUSD(result?.domesticTotalProfitUSD || 0)}</p>
              </div>
              <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100">
                 <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">国外利润 (US)</p>
                 <p className="text-lg font-black text-indigo-700">{fmtUSD(result?.foreignTotalProfitUSD || 0)}</p>
              </div>
           </div>
        </div>
      </div>

      {/* Logistics Footer */}
      <div className="px-8 pb-8 pt-4">
        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <Truck className="w-5 h-5 text-slate-400" />
                 <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">物流规模</p>
                    <p className="text-sm font-black text-slate-700">{result?.containerCount}个 {result?.containerType}柜</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase">满载率</p>
                 <p className="text-sm font-black text-slate-800">{result?.containerUtilization.toFixed(1)}%</p>
              </div>
           </div>
           
           <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600">
                 <DollarSign className="w-4 h-4" />
                 <span className="text-[11px] font-black uppercase tracking-wider">总计物流运费 (Total Freight)</span>
              </div>
              <span className="text-sm font-[900] text-slate-900 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                 {fmtUSD(result?.totalFreightUSD || 0)}
              </span>
           </div>
        </div>
      </div>
    </div>

    <CalculationDetailModal isOpen={showModal} onClose={() => setShowModal(false)} result={result} inputs={inputs} type={type} />
    </>
  );
};

export default ResultCard;
