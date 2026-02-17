
import React from 'react';
import { MapPin, Sparkles, Zap, History, User } from 'lucide-react';
import { ViewState } from '../types';

interface NavigationBarProps {
  view: ViewState;
  setView: (view: ViewState) => void;
  hasActiveSession: boolean;
  showNotification: (msg: string) => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ view, setView, hasActiveSession, showNotification }) => (
  <div className="px-4 py-4 flex justify-between items-center pb-safe w-full bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
    <button 
      onClick={() => setView('home')} 
      className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 px-3 py-1 rounded-xl ${view === 'home' || view === 'booking' ? 'text-emerald-600' : 'text-gray-400'}`}
    >
      <MapPin size={22} strokeWidth={view === 'home' ? 3 : 2} />
      <span className="text-[8px] font-black uppercase tracking-wider">Hubs</span>
    </button>

    <button 
      onClick={() => setView('history')} 
      className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 px-3 py-1 rounded-xl ${view === 'history' ? 'text-emerald-600' : 'text-gray-400'}`}
    >
      <History size={22} strokeWidth={view === 'history' ? 3 : 2} />
      <span className="text-[8px] font-black uppercase tracking-wider">History</span>
    </button>

    <div className="relative -top-8 px-2">
      <button 
        onClick={() => setView('assistant')}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border-4 border-white transition-all active:scale-90 ${
          view === 'assistant' 
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white' 
          : 'bg-gradient-to-br from-gray-800 to-black text-white'
        }`}
      >
        <Sparkles size={24} className={view === 'assistant' ? '' : 'animate-pulse text-emerald-400'}/>
      </button>
    </div>

    <button 
      onClick={() => hasActiveSession ? setView('charging') : showNotification("No active session")}
      className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 px-4 py-2 rounded-2xl relative group ${
        view === 'charging' 
        ? 'text-emerald-600 bg-emerald-50' 
        : hasActiveSession 
          ? 'text-emerald-600 bg-emerald-100/50 ring-4 ring-emerald-500/20' 
          : 'text-gray-400'
      }`}
    >
      {hasActiveSession && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white animate-ping"></span>
      )}
      <Zap 
        size={22} 
        strokeWidth={(view === 'charging' || hasActiveSession) ? 3 : 2} 
        className={hasActiveSession ? "animate-pulse drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" : ""} 
      />
      <span className={`text-[8px] font-black uppercase tracking-wider ${hasActiveSession ? "text-emerald-700" : ""}`}>
        {hasActiveSession ? "Charging" : "Charge"}
      </span>
    </button>

    <button 
      onClick={() => setView('profile')} 
      className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 px-3 py-1 rounded-xl ${view === 'profile' ? 'text-emerald-600' : 'text-gray-400'}`}
    >
      <User size={22} strokeWidth={view === 'profile' ? 3 : 2} />
      <span className="text-[8px] font-black uppercase tracking-wider">Profile</span>
    </button>
  </div>
);
