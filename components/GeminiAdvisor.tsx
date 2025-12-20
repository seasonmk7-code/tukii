
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CalculationResult } from '../types';
import { Bot, Sparkles, AlertCircle, Cpu, ChevronRight, BrainCircuit, Play, RefreshCw } from 'lucide-react';

interface Props {
  results: {
    steel: CalculationResult | null;
    pv: CalculationResult | null;
    car: CalculationResult | null;
  };
}

const GeminiAdvisor: React.FC<Props> = ({ results }) => {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ message: string; isQuota: boolean } | null>(null);
  const [isStale, setIsStale] = useState<boolean>(true);

  // Track if results have changed since last analysis
  useEffect(() => {
    setIsStale(true);
  }, [results.steel?.quantity, results.pv?.quantity, results.car?.quantity]);

  const generateAnalysis = async () => {
    if (!results.steel || !results.pv || !results.car) return;

    setLoading(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        作为全球贸易专家，请分析以下数据。中国卖家(Seller)与国外买家(Buyer)的博弈优化：
        数据概览：
        1. 钢铁：最优数 ${results.steel.quantity}, 联合利润 $${results.steel.jointTotalProfitUSD.toFixed(0)}, 货柜利用率 ${results.steel.containerUtilization.toFixed(1)}%。
        2. 光伏：最优数 ${results.pv.quantity}, 联合利润 $${results.pv.jointTotalProfitUSD.toFixed(0)}, 货柜利用率 ${results.pv.containerUtilization.toFixed(1)}%。
        3. 汽车：最优数 ${results.car.quantity}, 联合利润 $${results.car.jointTotalProfitUSD.toFixed(0)}, 货柜利用率 ${results.car.containerUtilization.toFixed(1)}%。
        
        请直接给出资金分配建议和核心风险提示。不超过200字，使用 Markdown 列表。
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAdvice(response.text || '');
      setIsStale(false);
    } catch (err: any) {
      console.error("Gemini API Error:", err);
      const isQuota = err.message?.includes('429') || err.message?.includes('QUOTA') || err.message?.includes('RESOURCE_EXHAUSTED');
      setError({
        message: isQuota 
          ? "API 配额已耗尽。请检查 Google AI Studio 的使用限额或稍后再试。" 
          : "分析服务暂时不可用，请检查网络连接。",
        isQuota
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative group p-[2px] rounded-[32px] bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 shadow-2xl overflow-hidden transition-all">
      <div className="bg-slate-900 rounded-[30px] p-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
               <BrainCircuit className="w-6 h-6 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">AI 智能贸易顾问</h3>
              <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-widest">Powered by Gemini 3 Flash</p>
            </div>
          </div>
          {!loading && isStale && advice && (
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin-slow" />
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">数据已更新</span>
            </div>
          )}
        </div>

        <div className="relative z-10 min-h-[160px] flex flex-col">
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-4 py-8">
               <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <Cpu className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
               </div>
               <p className="text-indigo-200 text-sm font-medium animate-pulse">正在穿透海量贸易数据...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl space-y-4">
               <div className="flex items-center gap-4 text-rose-300">
                  <AlertCircle className="w-8 h-8 flex-shrink-0" />
                  <p className="text-sm font-bold">{error.message}</p>
               </div>
               {error.isQuota && (
                 <a 
                   href="https://ai.google.dev/gemini-api/docs/rate-limits" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="block text-center py-2 bg-white/5 hover:bg-white/10 text-xs text-slate-400 rounded-xl transition-colors border border-white/10"
                 >
                   查看配额说明
                 </a>
               )}
               <button 
                 onClick={generateAnalysis}
                 className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-sm transition-all"
               >
                 重试分析
               </button>
            </div>
          ) : advice ? (
            <div className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm shadow-inner group-hover:bg-white/10 transition-all duration-500">
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-2">
                   {advice.split('\n').map((line, i) => (
                      <p key={i} className="flex items-start gap-3">
                         {line.trim().startsWith('*') || line.trim().startsWith('-') ? <ChevronRight className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" /> : null}
                         <span className={line.trim().startsWith('*') || line.trim().startsWith('-') ? '' : 'font-medium'}>
                           {line.replace(/^[*-\s]+/, '')}
                         </span>
                      </p>
                   ))}
                </div>
              </div>
              {isStale && (
                <button 
                  onClick={generateAnalysis}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                >
                  <RefreshCw className="w-5 h-5" />
                  更新策略分析
                </button>
              )}
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center py-12 text-center">
               <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Bot className="w-10 h-10 text-indigo-400" />
               </div>
               <h4 className="text-white font-bold mb-2">准备就绪</h4>
               <p className="text-slate-400 text-xs mb-8 max-w-[240px] mx-auto">点击下方按钮，Gemini 将为您生成基于当前市场数据的深度贸易策略。</p>
               <button 
                onClick={generateAnalysis}
                className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-black text-sm text-white uppercase tracking-widest shadow-2xl hover:shadow-indigo-500/40 transition-all active:scale-95"
               >
                 <span className="relative z-10 flex items-center gap-3">
                   <Play className="w-4 h-4 fill-current" />
                   开启 AI 战略分析
                 </span>
                 <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-2xl"></div>
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiAdvisor;
