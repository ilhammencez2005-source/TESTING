
import React from 'react';
import { Zap, CheckCircle2, ShieldCheck, Power } from 'lucide-react';
import { Session } from '../types';

interface ChargingSessionViewProps {
  activeSession: Session | null;
  toggleLock: () => void;
  endSession: () => void;
  isBleConnected: boolean;
  isBleConnecting: boolean;
  onConnectBle: () => void;
}

export const ChargingSessionView: React.FC<ChargingSessionViewProps> = ({ 
  activeSession, 
  endSession, 
  isBleConnected
}) => {
  if (!activeSession) return <div className="p-10 text-center text-gray-500 font-black uppercase tracking-widest">No active session.</div>;
  const percentage = Math.round(activeSession.chargeLevel);
  const isCompleted = activeSession.status === 'completed';

  return (
    <div className="w-full max-w-md mx-auto h-full flex flex-col justify-between p-8 animate-fade-in-down pb-40">
      
      {/* Status Header */}
      <div className="flex flex-col items-center gap-3 py-2 relative">
         <div className="bg-white/90 backdrop-blur-md px-6 py-2.5 rounded-full border border-gray-100 shadow-sm flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-emerald-500 animate-pulse'}`}></div>
            <span className="text-[10px] font-black text-gray-800 uppercase tracking-[0.2em]">
               {isCompleted ? "Session Done" : "Active Charge"}
            </span>
         </div>
         
         <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-lg border transition-colors ${isBleConnected ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-900 border-white/5'}`}>
            <ShieldCheck size={12} className="text-white" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">
              {isBleConnected ? "HUB SECURED" : "LINK STANDBY"}
            </span>
         </div>
      </div>

      {/* Progress Ring */}
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
                  className={`${isCompleted ? "text-green-500" : "text-emerald-500"} transition-all duration-1000 ease-in-out`} 
                  strokeLinecap="round" 
               />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
               {isCompleted ? (
                  <CheckCircle2 size={56} className="text-green-500 mb-2 animate-bounce" />
               ) : (
                  <Zap size={56} className="mb-2 text-emerald-500 animate-pulse" fill="currentColor" />
               )}
               <div className="text-7xl font-black text-gray-900 tracking-tighter tabular-nums leading-none">
                  {percentage}<span className="text-3xl align-top ml-1 opacity-40">%</span>
               </div>
            </div>
         </div>
      </div>

      {/* Info & Control */}
      <div className="space-y-4 w-full">
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
               <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Elapsed</span>
               <span className="text-2xl font-black text-gray-800 tracking-tighter">
               {Math.floor(activeSession.timeElapsed / 60)}:{(activeSession.timeElapsed % 60).toString().padStart(2, '0')}
               </span>
            </div>
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col items-center">
               <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest mb-1">Total Cost</span>
               <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                  RM {activeSession.cost.toFixed(2)}
               </span>
            </div>
         </div>

         <div className="pt-2">
             <button 
                onClick={endSession} 
                className={`w-full py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-95 flex items-center justify-center gap-3 ${
                   isCompleted ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'
                }`}
             >
                <Power size={24} />
                {isCompleted ? "FINISH SESSION" : "END CHARGING"}
             </button>
             <p className="text-[8px] text-center text-gray-400 font-black uppercase tracking-[0.2em] mt-4">
               HUB WILL AUTO-UNLOCK ON COMPLETION
             </p>
         </div>
      </div>
    </div>
  );
};
