
import React, { useState } from 'react';
import { User, Wallet, ShieldCheck, Bluetooth, Loader2, LogOut, ChevronRight, Zap, QrCode, Lock, Unlock, AlertCircle } from 'lucide-react';

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
  onDisconnectBle,
  onTestCommand
}) => {
  const [showQr, setShowQr] = useState(false);
  // Fix: Using type assertion for navigator.bluetooth to satisfy TypeScript
  const isBluetoothSupported = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;

  return (
    <div className="p-6 max-w-2xl mx-auto animate-slide-up pb-44 space-y-8">
      {/* User Header */}
      <div className="flex items-center gap-5 bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 ring-4 ring-emerald-50">
          <User size={40} />
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">Ilhammencez bin Mohd Rasyidi</h2>
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">VERIFIED USER</span>
          </div>
        </div>
      </div>

      {/* Wallet Card with QR */}
      <div className="bg-gray-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute right-0 top-0 p-8 opacity-10">
          <Wallet size={80} />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4 tracking-widest">WALLET</h3>
        <div className="flex items-baseline gap-2 mb-8">
          <span className="text-gray-400 text-lg font-bold">RM</span>
          <span className="text-5xl font-black tracking-tighter tabular-nums">{walletBalance.toFixed(2)}</span>
        </div>
        <button 
           onClick={() => setShowQr(!showQr)}
           className="w-full bg-emerald-600 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-emerald-900/40"
        >
          <QrCode size={16} />
          {showQr ? "HIDE RELOAD DETAILS" : "TOP UP WALLET"}
        </button>

        {showQr && (
           <div className="mt-6 bg-white rounded-3xl p-6 text-center animate-fade-in-down border border-emerald-100 shadow-xl overflow-hidden">
              <div className="mb-4 flex flex-col items-center">
                <div className="bg-pink-600 px-3 py-1 rounded-md mb-2">
                  <span className="text-white font-black text-[10px] uppercase">DuitNow QR</span>
                </div>
                <div className="w-56 h-56 bg-white rounded-2xl mx-auto flex items-center justify-center border-4 border-pink-600 p-2 shadow-inner">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=DuitNow-IlhammencezBinMohdRasyidi&color=db2777`} 
                    alt="DuitNow QR" 
                    className="w-full h-full object-contain" 
                  />
                </div>
              </div>
              <p className="text-gray-900 font-black text-[11px] uppercase tracking-widest">SCAN TO TOP UP</p>
              <p className="text-gray-400 text-[9px] mt-1 uppercase font-bold tracking-wider px-2">ILHAMMENCEZ BIN MOHD RASYIDI</p>
           </div>
        )}
      </div>

      {/* Hardware Pairing & Controls */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Hardware Hub (Pin D4)</h3>
        
        {!isBluetoothSupported && (
          <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] flex items-center gap-4 text-rose-700 mb-4 animate-fade-in-down">
            <AlertCircle className="shrink-0" size={24} />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest">Browser Not Supported</p>
              <p className="text-[9px] font-bold mt-1 leading-tight uppercase">iPhone users must use <span className="underline">Bluefy</span> app. Android users must use Chrome.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${isBleConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                <Bluetooth size={24} className={isBleConnecting ? 'animate-spin' : ''} />
              </div>
              <div>
                <p className="font-black text-gray-900 uppercase tracking-tight">Hub Link</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  {isBleConnected ? `Linked: ${bleDeviceName || "SolarSynergyHub"}` : "Bluetooth Standby"}
                </p>
              </div>
            </div>
          </div>

          {isBleConnected && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => onTestCommand('LOCK')}
                className="bg-gray-900 text-white py-5 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:bg-black group"
              >
                <Lock size={22} className="group-active:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">LOCK HUB</span>
              </button>
              <button 
                onClick={() => onTestCommand('UNLOCK')}
                className="bg-emerald-600 text-white py-5 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:bg-emerald-700 group"
              >
                <Unlock size={22} className="group-active:scale-110 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">UNLOCK HUB</span>
              </button>
            </div>
          )}

          <div className="pt-2">
            {isBleConnected ? (
              <button 
                onClick={onDisconnectBle}
                className="w-full py-5 rounded-[2rem] border-2 border-rose-500 text-rose-600 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
              >
                UNLINK HUB
              </button>
            ) : (
              <div className="space-y-3">
                <button 
                  onClick={onConnectBle}
                  disabled={isBleConnecting || !isBluetoothSupported}
                  className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 shadow-xl transition-all disabled:opacity-30"
                >
                  {isBleConnecting ? <Loader2 size={16} className="animate-spin" /> : <Bluetooth size={16} />}
                  {isBleConnecting ? "LINKING..." : "LINK WITH HUB"}
                </button>
                <p className="text-[8px] text-center text-gray-400 font-black uppercase tracking-[0.2em]">
                  Note: Stay within 10m range of the hardware
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <p className="text-[8px] text-center text-gray-300 font-bold uppercase tracking-[0.2em]">ETP Group 17 • Solar Synergy v1.6</p>
      </div>
    </div>
  );
};
