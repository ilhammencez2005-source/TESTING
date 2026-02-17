
import React, { useState } from 'react';
import { ArrowLeft, Plug, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { Station, ChargingMode } from '../types';

interface BookingViewProps {
  selectedStation: Station;
  onBack: () => void;
  onStartCharging: (mode: ChargingMode, slotId: string, duration: number | 'full', preAuth: number) => void;
  isPrebook?: boolean;
}

type BookingStep = 'mode' | 'slot';

export const BookingView: React.FC<BookingViewProps> = ({ selectedStation, onBack, onStartCharging, isPrebook }) => {
  const [step, setStep] = useState<BookingStep>('mode');
  const [selectedMode, setSelectedMode] = useState<ChargingMode | null>(null);

  const slots = Array.from({ length: selectedStation.totalSlots }, (_, i) => ({
    id: String.fromCharCode(65 + i),
    status: i < selectedStation.slots ? 'Available' : 'Occupied'
  }));

  const handleModeSelect = (mode: ChargingMode) => {
    setSelectedMode(mode);
    setStep('slot');
  };

  const handleSlotSelect = (slotId: string) => {
    if (!selectedMode) return;
    // Removed duration limit - default to 'full' for maximum synergy
    const preAuth = selectedMode === 'fast' ? 50.00 : 0;
    onStartCharging(selectedMode, slotId, 'full', preAuth);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-white shadow-sm z-20 border-b border-gray-200 shrink-0">
         <div className="max-w-4xl mx-auto px-6 py-5 flex items-center gap-4">
            <button onClick={step === 'mode' ? onBack : () => setStep('mode')} className="p-2 hover:bg-gray-100 rounded-full">
               <ArrowLeft size={24} />
            </button>
            <div>
               <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedStation.name}</h2>
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{isPrebook ? "PREBOOKING FLOW" : "INSTANT CHARGE"}</p>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
         {step === 'mode' && (
           <div className="space-y-4 animate-slide-up">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Select Mode</h3>
              <div className="grid grid-cols-1 gap-4">
                 <button onClick={() => handleModeSelect('normal')} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left flex items-center justify-between active:scale-95 transition-all">
                    <div>
                       <p className="text-lg font-black text-gray-900">Eco Charge</p>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Free Solar Synergy</p>
                    </div>
                    <div className="bg-emerald-100 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">FREE</div>
                 </button>
                 <button onClick={() => handleModeSelect('fast')} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm text-left flex items-center justify-between active:scale-95 transition-all">
                    <div>
                       <p className="text-lg font-black text-gray-900">Turbo Charge</p>
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Fast DC Charging</p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">PAID</div>
                 </button>
              </div>
           </div>
         )}

         {step === 'slot' && (
           <div className="space-y-4 animate-slide-up">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-2">Choose Connector</h3>
              <div className="grid grid-cols-2 gap-4">
                 {slots.map(slot => (
                   <button 
                     key={slot.id}
                     disabled={slot.status === 'Occupied'}
                     onClick={() => handleSlotSelect(slot.id)}
                     className={`p-10 rounded-[3rem] border-2 flex flex-col items-center gap-4 transition-all ${slot.status === 'Occupied' ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-white border-gray-100 active:border-emerald-600 active:bg-emerald-50'}`}
                   >
                     <Plug size={40} className={slot.status === 'Occupied' ? 'text-gray-300' : 'text-emerald-600'} />
                     <span className="font-black text-xl text-gray-900">Slot {slot.id}</span>
                   </button>
                 ))}
              </div>
           </div>
         )}
      </div>
    </div>
  );
};
