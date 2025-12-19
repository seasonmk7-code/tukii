import React, { useState, useEffect } from 'react';
import { Users, Link, Key, LogOut, Wifi, WifiOff, Globe } from 'lucide-react';

interface Props {
  isConnected: boolean;
  onConnect: (apiKey: string, roomId: string) => void;
  onDisconnect: () => void;
  userCount: number;
}

const MultiplayerConnect: React.FC<Props> = ({ isConnected, onConnect, onDisconnect, userCount }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('pk_dev_8IPnUk9w5igWaS4hVSK9mU3_f_86dhzcTyxzTdRTm5sji8uud5nrrg1bh6AVO7dM');
  const [roomId, setRoomId] = useState('TradeRoom01');

  // Load saved config on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('tuki_lb_key');
    const savedRoom = localStorage.getItem('tuki_lb_room');
    if (savedKey) setApiKey(savedKey);
    if (savedRoom) setRoomId(savedRoom);
  }, []);

  const handleConnect = () => {
    const cleanKey = apiKey.trim();
    const cleanRoom = roomId.trim();

    if (!cleanKey || !cleanRoom) return;
    
    localStorage.setItem('tuki_lb_key', cleanKey);
    localStorage.setItem('tuki_lb_room', cleanRoom);
    onConnect(cleanKey, cleanRoom);
    setIsOpen(false);
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg shadow-sm">
         <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Live Sync Active</span>
         </div>
         <div className="h-4 w-px bg-emerald-200"></div>
         <div className="flex items-center gap-1.5 text-emerald-800" title="Online Users">
            <Users className="w-4 h-4" />
            <span className="text-sm font-bold">{userCount}</span>
         </div>
         <div className="h-4 w-px bg-emerald-200"></div>
         <button 
           onClick={onDisconnect}
           className="text-emerald-600 hover:text-emerald-800 transition-colors"
           title="Disconnect"
         >
            <LogOut className="w-4 h-4" />
         </button>
      </div>
    );
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg border border-slate-700"
      >
        <Globe className="w-4 h-4 text-indigo-300" />
        <span>开启多人同步</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-indigo-600" /> 多人协作设置
                 </h3>
                 <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <div className="p-6 space-y-4">
                 <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-800 leading-relaxed">
                    开启后，您可以与国外同事实时同步所有数据。
                    <br/>请前往 <a href="https://liveblocks.io" target="_blank" className="underline font-bold">liveblocks.io</a> 获取免费的 Public Key。
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Liveblocks Public Key</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                           type="text" 
                           value={apiKey}
                           onChange={(e) => setApiKey(e.target.value)}
                           placeholder="pk_live_..."
                           className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">房间号 (Room ID)</label>
                    <div className="relative">
                        <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                           type="text" 
                           value={roomId}
                           onChange={(e) => setRoomId(e.target.value)}
                           placeholder="e.g. TradingRoom001"
                           className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                        />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">确保所有参与者使用相同的房间号。</p>
                 </div>

                 <button 
                    onClick={handleConnect}
                    disabled={!apiKey.trim() || !roomId.trim()}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-md transition-all mt-2"
                 >
                    连接同步服务器
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default MultiplayerConnect;