
import React from 'react';
import { Inputs, Destination } from '../types';
import { Wallet, Landmark, BarChart3, ChevronDown, Settings2 } from 'lucide-react';

interface Props {
  inputs: Inputs;
  setInputs: React.Dispatch<React.SetStateAction<Inputs>>;
}

// Fix: Use React.FC to properly type children and avoid TS errors in JSX where children prop is required but passed via JSX structure
const Group: React.FC<{ title: string; icon: any; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <div className="flex flex-col gap-6 p-7 rounded-[2.5rem] bg-white border border-slate-200 premium-shadow">
     <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
           <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
     </div>
     <div className="grid grid-cols-1 gap-5">
        {children}
     </div>
  </div>
);

const InputField = ({ label, name, value, onChange, step = "1", prefix, suffix }: { label: string, name: string, value: any, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, step?: string, prefix?: string, suffix?: string }) => (
  <div className="group">
     <div className="flex justify-between items-center mb-1.5 px-1">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-indigo-600 transition-colors">{label}</label>
        {suffix && <span className="text-[9px] font-bold text-slate-300 uppercase">{suffix}</span>}
     </div>
     <div className="relative">
        {prefix && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">{prefix}</span>}
        <input 
          type="number" 
          step={step}
          name={name} 
          value={value} 
          onChange={onChange} 
          className={`w-full ${prefix ? 'pl-8' : 'px-4'} py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-black text-slate-800 shadow-sm`} 
        />
     </div>
  </div>
);

const InputSection: React.FC<Props> = ({ inputs, setInputs }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: (name === 'destination') ? value : parseFloat(value) || 0
    }));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
      <Group title="资金与策略" icon={Wallet}>
         <InputField label="预算总额 e" name="balance" value={inputs.balance} onChange={handleChange} prefix="¥" suffix="万" />
         <InputField label="预留款 g" name="reserve" value={inputs.reserve} onChange={handleChange} prefix="¥" suffix="万" />
         <InputField label="预期利润率 k" name="margin" value={inputs.margin} onChange={handleChange} step="0.01" suffix="Ratio" />
      </Group>

      <Group title="市场基础" icon={Settings2}>
         <InputField label="基准汇率 c" name="exchangeRate" value={inputs.exchangeRate} onChange={handleChange} step="0.01" suffix="CNY/USD" />
         
         {/* 目的港选择 */}
         <div className="group">
            <div className="flex justify-between items-center mb-1.5 px-1">
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">目的港 (Arrival)</label>
               <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">柜型联动</span>
            </div>
            <div className="relative">
               <select name="destination" value={inputs.destination} onChange={handleChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all text-sm font-black text-slate-800 shadow-sm appearance-none">
                  <option value={Destination.LA}>洛杉矶 (LA) - 20ft</option>
                  <option value={Destination.NY}>纽约 (NY) - 20ft</option>
                  <option value={Destination.MIAMI}>迈阿密 (Miami) - 40ft</option>
                  <option value={Destination.SEATTLE}>西雅图 (Seattle) - 40ft</option>
               </select>
               <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
         </div>

         <InputField label="交易杂费" name="miscFee" value={inputs.miscFee} onChange={handleChange} prefix="¥" />
         <InputField label="单柜运费 d" name="freightCostUSD" value={inputs.freightCostUSD} onChange={handleChange} prefix="$" />
      </Group>

      <Group title="国内采购" icon={Landmark}>
         <InputField label="钢铁买入价" name="priceSteel" value={inputs.priceSteel} onChange={handleChange} prefix="¥" />
         <InputField label="光伏买入价" name="pricePV" value={inputs.pricePV} onChange={handleChange} prefix="¥" />
         <InputField label="汽车买入价" name="priceCar" value={inputs.priceCar} onChange={handleChange} prefix="¥" />
      </Group>

      <Group title="国际销售" icon={BarChart3}>
         <InputField label="钢铁售价 r" name="sellPriceSteelUSD" value={inputs.sellPriceSteelUSD} onChange={handleChange} prefix="$" />
         <InputField label="光伏售价 r" name="sellPricePVUSD" value={inputs.sellPricePVUSD} onChange={handleChange} prefix="$" />
         <InputField label="汽车售价 r" name="sellPriceCarUSD" value={inputs.sellPriceCarUSD} onChange={handleChange} prefix="$" />
      </Group>
    </div>
  );
};

export default InputSection;
