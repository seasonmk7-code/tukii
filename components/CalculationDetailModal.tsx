
import React from 'react';
import { CalculationResult, Inputs, ProductType } from '../types';
import { X, Calculator, ArrowRight, TrendingUp, Anchor, DollarSign, Package, Shield } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  result: CalculationResult | null;
  inputs: Inputs;
  type: ProductType;
}

const CalculationDetailModal: React.FC<Props> = ({ isOpen, onClose, result, inputs, type }) => {
  if (!isOpen || !result) return null;

  const fmtUSD = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtRMB = (n: number) => `¥${n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const colorTheme = type === ProductType.CAR 
    ? { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', icon: 'bg-rose-100' }
    : type === ProductType.PV 
      ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'bg-amber-100' }
      : { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', icon: 'bg-cyan-100' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className={`px-6 py-4 border-b ${colorTheme.border} ${colorTheme.bg} flex justify-between items-center`}>
           <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${colorTheme.icon}`}>
                  <Calculator className={`w-5 h-5 ${colorTheme.text}`} />
              </div>
              <div>
                  <h3 className={`text-lg font-bold ${colorTheme.text}`}>贸易税费与利润穿透详解</h3>
                  <p className="text-xs text-slate-500">Tax & Duty Inclusive Profit Analysis</p>
              </div>
           </div>
           <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 text-slate-400 hover:text-slate-600 transition">
              <X className="w-6 h-6" />
           </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
            <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-slate-300 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                    1. 采购与出口关税 (Purchase & Export Tax)
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg text-xs space-y-2 border border-slate-100">
                    <div className="flex justify-between">
                        <span className="text-slate-500">实际单价 x (含折扣):</span>
                        <span className="font-mono font-bold text-slate-800">{fmtRMB(result.unitPriceRMB)}</span>
                    </div>
                    <div className="flex justify-between text-rose-500">
                        <span className="font-medium">出口关税 (Export Duty):</span>
                        <span className="font-mono">+{(result.exportDutyRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-slate-200 pt-1 font-bold">
                        <span className="text-slate-700">含税成本 (Taxed Cost):</span>
                        <span className="font-mono">{fmtRMB(result.unitPriceRMB * (1 + result.exportDutyRate))}</span>
                    </div>
                </div>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-indigo-400 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-3 h-3"/> 2. FOB 报价转换 (FOB Calculation)
                </h4>
                <div className="bg-indigo-50/50 p-4 rounded-lg text-xs space-y-3 border border-indigo-100">
                     <p className="text-slate-600 font-medium">报价公式: FOB = (单价 + 杂费) × (1 + 利润率 + 出口税率) ÷ 汇率</p>
                     <div className="flex items-center gap-2 flex-wrap font-mono text-indigo-800 bg-white/60 p-3 rounded border border-indigo-100">
                        <span>({fmtRMB(result.unitPriceRMB + result.avgMiscRMB)}</span>
                        <span>×</span>
                        <span className="font-bold">{(1 + inputs.margin + result.exportDutyRate).toFixed(2)}</span>
                        <span>)</span>
                        <span>÷</span>
                        <span>{inputs.exchangeRate}</span>
                        <ArrowRight className="w-3 h-3 mx-1"/>
                        <span className="font-bold text-base">{fmtUSD(result.FOB_USD)}</span>
                     </div>
                </div>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-400 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-2">
                    <Shield className="w-3 h-3"/> 3. 进口关税与落地 (Import & Landed)
                </h4>
                <div className="bg-blue-50/50 p-4 rounded-lg text-xs space-y-2 border border-blue-100">
                    <div className="flex justify-between">
                        <span className="text-slate-500">进口关税 (Import Duty):</span>
                        <span className="font-mono font-bold text-blue-600">+{(result.importDutyRate * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">港口杂费与清关 (Handling):</span>
                        <span className="font-mono">+5% (Fixed)</span>
                    </div>
                    <div className="flex justify-between border-t border-dashed border-blue-200 pt-1 font-bold">
                        <span className="text-slate-700">总落地成本 (Total Landed):</span>
                        <span className="font-mono text-blue-800">{fmtUSD(result.foreignActualCostUSD)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">Formula: (FOB × 1.{(result.importDutyRate + 0.05).toFixed(2).split('.')[1]}) + Insurance + Freight</p>
                </div>
            </div>

            <div className="relative pl-6 border-l-2 border-slate-200">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                <h4 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3"/> 4. 净利润对比 (Net Profit)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <span className="text-[10px] font-bold text-emerald-800 opacity-60 uppercase">SELLER NET (CN)</span>
                        <p className="text-xl font-black text-emerald-700 mt-1">{fmtUSD(result.domesticTotalProfitUSD)}</p>
                        <p className="text-[10px] text-emerald-600 mt-1">含出口税负抵扣</p>
                    </div>
                    <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <span className="text-[10px] font-bold text-indigo-800 opacity-60 uppercase">BUYER NET (US)</span>
                        <p className="text-xl font-black text-indigo-700 mt-1">{fmtUSD(result.foreignTotalProfitUSD)}</p>
                        <p className="text-[10px] text-indigo-600 mt-1">扣除关税及落地成本</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
            <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-xl hover:bg-slate-900 transition shadow-lg">
                确定
            </button>
        </div>
      </div>
    </div>
  );
};

export default CalculationDetailModal;
