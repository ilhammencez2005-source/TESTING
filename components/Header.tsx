
import React from 'react';
import { User } from 'lucide-react';

interface HeaderProps {
  walletBalance: number;
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ walletBalance, onProfileClick }) => (
  <div className="flex justify-between items-center px-4 py-3 bg-white shadow-sm shrink-0 border-b border-gray-200 z-10">
    <div className="flex items-center gap-3">
      <div className="h-10 w-12 flex items-center justify-center relative">
         <img 
           src="https://lh3.googleusercontent.com/d/1JB1msv8nSU3u--ywu_bAhKEhKar-94Vb" 
           alt="UTP" 
           className="h-full w-full object-contain"
         />
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-none">Solar Synergy</h1>
        <p className="text-[10px] text-emerald-600 font-bold tracking-wider">UTP MICROMOBILITY</p>
        <p className="text-[9px] text-gray-400 font-bold tracking-wider mt-0.5">ETP GROUP 17</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
       <div className="bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 flex flex-col items-end">
         <span className="text-[10px] text-gray-500 uppercase font-bold">Wallet</span>
         <span className="text-sm font-bold text-emerald-700 leading-none">RM {walletBalance.toFixed(2)}</span>
       </div>
       <button 
         onClick={onProfileClick}
         className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
       >
         <User size={18} />
       </button>
    </div>
  </div>
);
