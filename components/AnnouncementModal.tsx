
import React from 'react';
import { X, Landmark, Globe, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, Target, TrendingUp, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const AnnouncementModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const domesticRules = [
    { text: "打开软件后先填写经济报表。", icon: <Landmark className="w-4 h-4" /> },
    { text: "检查各个数据是否正确（尤其是关税和运费）。", icon: <CheckCircle2 className="w-4 h-4" /> },
    { text: "开局借长贷（结束前一定要还款）。", icon: <ShieldCheck className="w-4 h-4" /> },
    { text: "第一单一定要用民间贷款（贷款时间60天，最多做三单一定要还，长贷和民间贷可以同时）。", icon: <AlertTriangle className="w-4 h-4" /> },
    { text: "国内利润一定要比国外高（参考推荐利润率，推荐非最好报价，可以更大胆一点）。", icon: <TrendingUp className="w-4 h-4" /> },
    { text: "报价前一定要再确认数量自己是否买得起。", icon: <Target className="w-4 h-4" /> },
  ];

  const foreignRules = [
    { text: "协助国内看关税（有变化第一时间通知，国外相对悠闲）。", icon: <Globe className="w-4 h-4" /> },
    { text: "实时更新价格（非常重要）。", icon: <TrendingUp className="w-4 h-4" /> },
    { text: "国外主要稳住不要接亏钱的单，有得赚最好（不亏你就赢了）。", icon: <ShieldCheck className="w-4 h-4" /> },
    { text: "国外运费确认前一定要看清楚。", icon: <AlertTriangle className="w-4 h-4" /> },
    { text: "信用证开完就要去申请解冻资金（可同时多接几单）。", icon: <Landmark className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-indigo-600 px-8 py-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/20 rounded-xl">
                <Info className="w-6 h-6" />
             </div>
             <div>
                <h2 className="text-xl font-black tracking-tight">Tuki大王 贸易实操公告栏</h2>
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">Operational Strategy & Guidelines</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-grow overflow-y-auto p-8 space-y-10">
          
          {/* Domestic Section */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-indigo-600 border-b border-indigo-100 pb-2">
                <Landmark className="w-5 h-5" />
                <h3 className="font-black uppercase tracking-widest text-sm">国内公司公告栏 (Domestic Seller)</h3>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {domesticRules.map((rule, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                     <div className="shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:border-indigo-200 shadow-sm transition-all">
                        {rule.icon}
                     </div>
                     <p className="text-sm font-bold text-slate-700 leading-relaxed pt-0.5">
                       <span className="text-indigo-500 mr-2">{idx + 1}.</span>
                       {rule.text}
                     </p>
                  </div>
                ))}
             </div>
          </section>

          {/* Special Center Banner */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-600 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <div className="relative flex flex-col items-center justify-center py-6 px-8 bg-white border border-amber-100 rounded-3xl text-center">
               <Sparkles className="w-8 h-8 text-amber-500 mb-2 animate-pulse" />
               <p className="text-xl font-black bg-gradient-to-r from-amber-600 to-rose-600 bg-clip-text text-transparent">
                 祝学弟学妹们取得好成绩！！！
               </p>
            </div>
          </div>

          {/* Foreign Section */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-slate-800 border-b border-slate-200 pb-2">
                <Globe className="w-5 h-5" />
                <h3 className="font-black uppercase tracking-widest text-sm">国外公司公告栏 (Foreign Buyer)</h3>
             </div>
             <div className="grid grid-cols-1 gap-3">
                {foreignRules.map((rule, idx) => (
                  <div key={idx} className="flex gap-4 p-4 bg-slate-900 rounded-2xl border border-slate-800 group hover:bg-slate-800 transition-all">
                     <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 group-hover:text-indigo-400 transition-all">
                        {rule.icon}
                     </div>
                     <p className="text-sm font-bold text-slate-300 leading-relaxed pt-0.5">
                       <span className="text-indigo-400 mr-2">{idx + 1}.</span>
                       {rule.text}
                     </p>
                  </div>
                ))}
             </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 shrink-0">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            我已阅读并知晓实操规则
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
