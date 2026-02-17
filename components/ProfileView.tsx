
import React, { useState } from 'react';
import { User, Wallet, ShieldCheck, Bluetooth, Loader2, LogOut, ChevronRight, Zap, QrCode } from 'lucide-react';

interface ProfileViewProps {
  walletBalance: number;
  isBleConnected: boolean;
  isBleConnecting: boolean;
  bleDeviceName?: string;
  onConnectBle: () => void;
  onDisconnectBle: () => void;
  onTestCommand: (cmd: 'LOCK' | 'UNLOCK') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ 
  walletBalance, 
  isBleConnected, 
  isBleConnecting, 
  bleDeviceName, 
  onConnectBle,
  onDisconnectBle
}) => {
  const [showQr, setShowQr] = useState(false);

  return (
    <div className="p-6 max-w-2xl mx-auto animate-slide-up pb-44 space-y-8">
      {/* User Header */}
      <div className="flex items-center gap-5 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 ring-4 ring-emerald-50">
          <User size={40} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Ilhammencez</h2>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">ID: 22010123</span>
          </div>
        </div>
      </div>

      {/* Wallet Card with QR */}
      <div className="bg-gray-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Wallet size={80} />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4">Synergy Credits</h3>
        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-gray-400 text-lg font-bold">RM</span>
          <span className="text-5xl font-black tracking-tighter tabular-nums">{walletBalance.toFixed(2)}</span>
        </div>
        <button 
           onClick={() => setShowQr(!showQr)}
           className="w-full bg-emerald-600 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <QrCode size={16} />
          {showQr ? "HIDE RELOAD DETAILS" : "TOP UP WALLET"}
        </button>

        {showQr && (
           <div className="mt-6 bg-white rounded-3xl p-6 text-center animate-fade-in-down border border-emerald-100 shadow-xl">
              <div className="w-48 h-48 bg-white rounded-2xl mx-auto flex items-center justify-center mb-4 p-2">
                {/* Specific QR Code for User */}
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=SynergyTopUp-Ilhammencez-22010123" 
                  alt="Reload QR" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <p className="text-gray-900 font-black text-[11px] uppercase tracking-widest">Kiosk Ready</p>
              <p className="text-gray-400 text-[9px] mt-1 uppercase font-bold tracking-wider">Ilhammencez • 22010123</p>
           </div>
        )}
      </div>

      {/* Hardware Pairing - Technical text removed */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Smart Hub</h3>
        <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isBleConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                <Bluetooth size={24} className={isBleConnecting ? 'animate-spin' : ''} />
              </div>
              <div>
                <p className="font-black text-gray-900 uppercase tracking-tight">Hub Link</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  {isBleConnected ? `Linked: ${bleDeviceName || "SolarSynergyHub"}` : "Unlinked"}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            {isBleConnected ? (
              <button 
                onClick={onDisconnectBle}
                className="w-full py-5 rounded-[2rem] border-2 border-rose-500 text-rose-600 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
              >
                UNLINK HUB
              </button>
            ) : (
              <button 
                onClick={onConnectBle}
                disabled={isBleConnecting}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl transition-all disabled:opacity-50"
              >
                {isBleConnecting ? <Loader2 size={16} className="animate-spin" /> : <Bluetooth size={16} />}
                {isBleConnecting ? "LINKING..." : "LINK WITH HUB"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <p className="text-[8px] text-center text-gray-300 font-bold uppercase tracking-[0.2em]">ETP Group 17 • Solar Synergy v1.2</p>
      </div>
    </div>
  );
};
