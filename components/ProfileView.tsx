
import React, { useState } from 'react';
import { User, Wallet, ShieldCheck, Bluetooth, Loader2, ChevronRight, Zap, QrCode, Lock, Unlock, AlertCircle, Info } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'wallet' | 'hub' | 'about'>('wallet');
  
  const isBluetoothSupported = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;

  const tabs = [
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'hub', label: 'Hub Connection', icon: Bluetooth },
    { id: 'about', label: 'About', icon: Info },
  ] as const;

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

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 p-1.5 rounded-[2rem] gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                isActive 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'wallet' && (
          <div className="animate-fade-in-down space-y-6">
            <div className="bg-gray-900 rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute right-0 top-0 p-8 opacity-10">
                <Wallet size={80} />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4 tracking-widest">CURRENT BALANCE</h3>
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
                <div className="mt-8 bg-white rounded-[3rem] p-2 text-center animate-fade-in-down shadow-2xl overflow-hidden relative border border-pink-50 max-w-[280px] mx-auto">
                  <div className="border-[2px] border-[#ED008C] rounded-[2.5rem] p-3 bg-white">
                    <div className="aspect-square flex items-center justify-center overflow-hidden">
                      <img 
                        src="https://lh3.googleusercontent.com/d/1usUmakfqoX6yrVG_BQucVdmQx4jDpxoO" 
                        alt="DuitNow QR" 
                        className="w-full h-full object-contain" 
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes("drive.google.com")) {
                            target.src = "https://drive.google.com/uc?id=1usUmakfqoX6yrVG_BQucVdmQx4jDpxoO";
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="py-4 space-y-1">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="h-px w-6 bg-pink-100"></div>
                      <p className="text-gray-900 font-black text-[9px] uppercase tracking-[0.2em]">Top Up Wallet</p>
                      <div className="h-px w-6 bg-pink-100"></div>
                    </div>
                    <p className="text-[#ED008C] text-[8px] uppercase font-black tracking-widest px-4">ILHAMMENCEZ BIN MOHD RASYIDI</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'hub' && (
          <div className="animate-fade-in-down space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Hardware Link & Testing</h3>
              </div>
              
              {!isBluetoothSupported && (
                <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] flex items-center gap-4 text-rose-700 mb-4">
                  <AlertCircle className="shrink-0" size={24} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Browser Not Supported</p>
                    <p className="text-[9px] font-bold mt-1 leading-tight uppercase">iPhone users must use <span className="underline">Bluefy</span> app.</p>
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
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">TEST LOCK</span>
                    </button>
                    <button 
                      onClick={() => onTestCommand('UNLOCK')}
                      className="bg-emerald-600 text-white py-5 rounded-2xl flex flex-col items-center justify-center gap-2 active:scale-95 transition-all shadow-xl hover:bg-emerald-700 group"
                    >
                      <Unlock size={22} className="group-active:scale-110 transition-transform" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">TEST UNLOCK</span>
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="animate-fade-in-down space-y-6">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] px-2">Project Information</h3>
              <div className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="font-black text-gray-900 uppercase tracking-tight">Solar Synergy</p>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">ETP GROUP 17</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Origin</p>
                    <p className="text-[11px] font-medium text-gray-600 leading-relaxed uppercase tracking-wide">
                      We are from <span className="font-black text-gray-900">ETP Group 17 Universiti Teknologi Petronas</span>.
                    </p>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Mission</p>
                    <p className="text-[11px] font-medium text-gray-600 leading-relaxed uppercase tracking-wide">
                      Solar Synergy is a sustainable micro-mobility charging platform designed for the UTP campus. 
                      Our project leverages solar energy to provide eco-friendly charging for electric scooters 
                      and bicycles, promoting a greener and smarter campus environment through innovative 
                      hardware integration and real-time synergy assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-8 pb-12 space-y-2 opacity-50">
        <p className="text-[8px] text-center text-gray-400 font-black uppercase tracking-[0.2em]">ETP Group 17 • Solar Synergy v1.8</p>
        <p className="text-[7px] text-center text-gray-400 font-black uppercase tracking-[0.3em]">Created by Ilhammencez Bin Mohd Rasyidi</p>
      </div>
    </div>
  );
};
