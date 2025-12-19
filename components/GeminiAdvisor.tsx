
import React, { useEffect, useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { CalculationResult } from '../types';
import { Bot, Sparkles, AlertCircle, Cpu, ChevronRight, BrainCircuit } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!results.steel || !results.pv || !results.car) return;

      setLoading(true);
      setError(null);

      try {
        // Correct initialization of GoogleGenAI using the environment variable API_KEY
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const prompt = `
          作为全球贸易专家，请分析以下数据。中国卖家(Seller)与国外买家(Buyer)的博弈优化：
          数据概览：
          1. 钢铁：最优数 ${results.steel.quantity}, 联合利润 $${results.steel.jointTotalProfitUSD.toFixed(0)}, 货柜利用率 ${results.steel.containerUtilization.toFixed(1)}%。
          2. 光伏：最优数 ${results.pv.quantity}, 联合利润 $${results.pv.jointTotalProfitUSD.toFixed(0)}, 货柜利用率 ${results.pv.containerUtilization.toFixed(1)}%。
          3. 汽车：最优数 ${results.car.quantity}, 联合利润 $${results.car.jointTotalProfitUSD.toFixed(0)}, 货柜利用率 ${results.car.containerUtilization.toFixed(1)}%。
          
          请直接给出资金分配建议和核心风险提示。不超过200字，使用 Markdown 列表。
        `;

        // Generate context-aware trading insights using Gemini 3 Flash
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });

        // Use the .text property to access the generated text content from the response
        setAdvice(response.text);
      } catch (err: any) {
        console.error("Gemini API Error:", err);
        setError("AI 服务暂时不可用，请稍后再试。");
      } finally {
        setLoading(false);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [results.steel, results.pv, results.car]);

  return (
    <div className="relative group p-[2px] rounded-[32px] bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 shadow-2xl overflow-hidden transition-all hover:scale-[1.01]">
      <div className="bg-slate-900 rounded-[30px] p-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl animate-pulse"></div>
        
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
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Neural Link Active</span>
          </div>
        </div>

        <div className="relative z-10 min-h-[160px] flex flex-col">
          {loading ? (
            <div className="flex-grow flex flex-col items-center justify-center gap-4 py-8">
               <div className="relative">
                  <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                  <Cpu className="w-6 h-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
               </div>
               <p className="text-indigo-200 text-sm font-medium animate-pulse">正在生成深度分析报告...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-4 text-rose-300">
               <AlertCircle className="w-8 h-8 flex-shrink-0" />
               <p className="text-sm font-bold">{error}</p>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm shadow-inner group-hover:bg-white/10 transition-all duration-500">
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed space-y-2">
                 {advice ? advice.split('\n').map((line, i) => (
                    <p key={i} className="flex items-start gap-3">
                       {line.trim().startsWith('*') || line.trim().startsWith('-') ? <ChevronRight className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" /> : null}
                       <span className={line.trim().startsWith('*') || line.trim().startsWith('-') ? '' : 'font-medium'}>
                         {line.replace(/^[*-\s]+/, '')}
                       </span>
                    </p>
                 )) : <span className="text-slate-500 italic">待系统运行一段时间以获取足够分析数据...</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiAdvisor;
