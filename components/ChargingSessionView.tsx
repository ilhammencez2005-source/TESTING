
import React, { useState } from 'react';
import { Zap, CheckCircle2, Lock, Unlock, Power, Loader2, Cpu } from 'lucide-react';
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
    // Simulate slight delay to match hardware response time
    setTimeout(() => {
      toggleLock();
      setIsLocking(false);
    }, 800);
  };

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col justify-between p-6 animate-fade-in-down pb-8">
      
      {/* Header */}
      <div className="flex justify-center items-center py-2 relative">
         <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-sm font-bold text-gray-700 uppercase tracking-wider">
               {isCompleted ? "Session Complete" : "Live Session"}
            </span>
         </div>
         
         {/* Hardware Status Tag */}
         <div className={`absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${isHardwareConnected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-gray-100 text-gray-400'}`}>
            <Cpu size={12} className={isHardwareConnected ? 'animate-pulse' : ''} />
            {isHardwareConnected ? 'Synced' : 'Offline'}
         </div>
      </div>

      {/* Main Circular Progress */}
      <div className="flex-1 flex flex-col items-center justify-center relative my-4">
         <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            {/* Background Ring */}
            <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
               <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-gray-100" />
               <circle 
                  cx="50%" cy="50%" r="45%" 
                  stroke="currentColor" 
                  strokeWidth="16" 
                  fill="transparent" 
                  strokeDasharray={2 * Math.PI * 130} 
                  strokeDashoffset={2 * Math.PI * 130 * ((100 - percentage) / 100)} 
                  className={`${isCompleted ? "text-green-500" : activeSession.mode === 'fast' ? "text-yellow-500" : "text-emerald-500"} transition-all duration-700 ease-out`} 
                  strokeLinecap="round" 
                  style={{ strokeDasharray: '283%', strokeDashoffset: `${283 - (283 * percentage) / 100}%` }} 
               />
            </svg>
            
            {/* Center Content */}
            <div className="absolute flex flex-col items-center justify-center">
               {isCompleted ? (
                  <CheckCircle2 size={48} className="text-green-500 mb-2 animate-bounce" />
               ) : (
                  <Zap size={48} className={`mb-2 ${activeSession.mode === 'fast' ? "text-yellow-500" : "text-emerald-500"} animate-pulse`} fill="currentColor" />
               )}
               <div className="text-6xl font-black text-gray-800 tracking-tighter tabular-nums">
                  {percentage}<span className="text-3xl align-top ml-1">%</span>
               </div>
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  {activeSession.mode === 'fast' ? "Turbo" : "Eco"} Charging
               </span>
            </div>
         </div>
      </div>

      {/* Stats & Actions */}
      <div className="space-y-4 w-full">
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
               <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">Time</span>
               <span className="text-2xl font-mono font-bold text-gray-700">
               {Math.floor(activeSession.timeElapsed / 60)}:{(activeSession.timeElapsed % 60).toString().padStart(2, '0')}
               </span>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
               <span className="text-gray-400 text-[10px] font-bold uppercase mb-1">Cost</span>
               <span className="text-2xl font-mono font-bold text-gray-800">
                  RM {activeSession.cost.toFixed(2)}
               </span>
            </div>
         </div>

         {/* Lock Toggle */}
         {!isCompleted && (
            <button 
               onClick={handleLockClick}
               disabled={isLocking}
               className={`w-full py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden ${
                  activeSession.isLocked 
                  ? 'bg-slate-900 text-white hover:bg-black' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-inner'
               } ${isLocking ? 'cursor-wait scale-[0.98]' : 'active:scale-95'}`}
            >
               {isLocking && (
                   <span className="absolute inset-0 bg-white/10 animate-pulse"></span>
               )}
               
               <div className={`transition-transform duration-300 ${isLocking ? 'scale-110' : ''} flex items-center gap-2`}>
                   {isLocking ? (
                     <Loader2 size={18} className="animate-spin" />
                   ) : (
                     activeSession.isLocked ? <Lock size={18} className="text-red-400" /> : <Unlock size={18} className="text-emerald-500" />
                   )}
                   {isLocking 
                     ? (activeSession.isLocked ? "Unlocking Dock..." : "Locking Dock...") 
                     : (activeSession.isLocked ? "Unlock Dock (Servo)" : "Lock Dock (Servo)")
                   }
               </div>
            </button>
         )}

         {/* Stop Button Area */}
         <div className="pt-2">
             {isCompleted ? (
                <button 
                  onClick={endSession} 
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={24} />
                  FINISH SESSION
                </button>
             ) : (
               <button 
                  onClick={endSession}
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-3"
               >
                  <Power size={24} />
                  STOP CHARGING
               </button>
             )}
         </div>
      </div>
    </div>
  );
};
