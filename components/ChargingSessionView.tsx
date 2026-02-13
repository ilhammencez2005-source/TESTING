
import React, { useState } from 'react';
import { Zap, CheckCircle2, Lock, Unlock, Power, Loader2, Cpu, ShieldCheck } from 'lucide-react';
import { Session } from '../types';

interface ChargingSessionViewProps {
  activeSession: Session | null;
  toggleLock: () => void;
  endSession: () => void;
  isHardwareConnected: boolean;
}

export const ChargingSessionView: React.FC<ChargingSessionViewProps> = ({ activeSession, toggleLock, endSession, isHardwareConnected }) => {
  const [isLocking, setIsLocking] = useState(false);

  if (!activeSession) return <div className="p-10 text-center text-gray-500">No active session found.</div>;
  const percentage = Math.round(activeSession.chargeLevel);
  const isCompleted = activeSession.status === 'completed';

  const handleLockClick = () => {
    setIsLocking(true);
    setTimeout(() => {
      toggleLock();
      setIsLocking(false);
    }, 1200);
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col justify-between p-8 animate-fade-in-down pb-40">
      
      {/* Dynamic Status Header */}
      <div className="flex justify-between items-center py-2 relative">
         <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">
               {isCompleted ? "Session Done" : "Charging Active"}
            </span>
         </div>
         
         <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${isHardwareConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>
            <ShieldCheck size={14} className={isHardwareConnected ? 'text-emerald-500' : ''} />
            {isHardwareConnected ? 'Bridge Active' : 'Offline'}
         </div>
      </div>

      {/* Progress Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-8">
         <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
               <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-100" />
               <circle 
                  cx="50%" cy="50%" r="45%" 
                  stroke="currentColor" 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray="283%" 
                  strokeDashoffset={`${283 - (283 * percentage) / 100}%`} 
                  className={`${isCompleted ? "text-green-500" : activeSession.mode === 'fast' ? "text-yellow-500" : "text-emerald-500"} transition-all duration-1000 ease-in-out`} 
                  strokeLinecap="round" 
               />
            </svg>
            
            <div className="absolute flex flex-col items-center justify-center text-center">
               {isCompleted ? (
                  <CheckCircle2 size={56} className="text-green-500 mb-2 animate-bounce" />
               ) : (
                  <Zap size={56} className={`mb-2 ${activeSession.mode === 'fast' ? "text-yellow-500" : "text-emerald-500"} animate-pulse`} fill="currentColor" />
               )}
               <div className="text-7xl font-black text-gray-900 tracking-tighter tabular-nums leading-none">
                  {percentage}<span className="text-3xl align-top ml-1 opacity-40">%</span>
               </div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-3">
                  {activeSession.mode === 'fast' ? "Hyper" : "Solar"} Mode
               </span>
            </div>
         </div>
      </div>

      {/* Session Controls */}
      <div className="space-y-4 w-full">
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
               <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Elapsed</span>
               <span className="text-2xl font-black text-gray-800 tracking-tighter">
               {Math.floor(activeSession.timeElapsed / 60)}:{(activeSession.timeElapsed % 60).toString().padStart(2, '0')}
               </span>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
               <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Cost</span>
               <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                  RM {activeSession.cost.toFixed(2)}
               </span>
            </div>
         </div>

         {!isCompleted && (
            <button 
               onClick={handleLockClick}
               disabled={isLocking}
               className={`w-full py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden shadow-xl ${
                  activeSession.isLocked 
                  ? 'bg-slate-900 text-white shadow-slate-200' 
                  : 'bg-emerald-50 text-emerald-600 shadow-emerald-50'
               } ${isLocking ? 'cursor-wait opacity-80' : 'active:scale-95'}`}
            >
               {isLocking ? (
                 <Loader2 size={20} className="animate-spin text-emerald-400" />
               ) : (
                 activeSession.isLocked ? <Lock size={20} className="text-emerald-400" /> : <Unlock size={20} className="text-emerald-500" />
               )}
               <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black">
                     {isLocking ? (activeSession.isLocked ? "Unlocking Hub..." : "Locking Hub...") : (activeSession.isLocked ? "DOCKED & SECURED" : "RELEASE DOCK")}
                  </span>
                  {!isLocking && <span className="text-[7px] font-black opacity-50 mt-1 uppercase tracking-widest">Automation Active</span>}
               </div>
            </button>
         )}

         <div className="pt-2">
             <button 
                onClick={endSession} 
                className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                   isCompleted 
                   ? 'bg-emerald-600 text-white shadow-emerald-100' 
                   : 'bg-rose-500 text-white shadow-rose-100'
                }`}
             >
                {isCompleted ? <CheckCircle2 size={24} /> : <Power size={24} />}
                {isCompleted ? "CLOSE SESSION" : "ABORT CHARGING"}
             </button>
         </div>
         {!isCompleted && <p className="text-center text-[8px] font-black text-gray-400 uppercase tracking-widest">System will Auto-Unlock on completion</p>}
      </div>
    </div>
  );
};
