
import React, { useState } from 'react';
import { MapPin, Crosshair, CalendarClock, Zap, ArrowRight, Sun, Leaf } from 'lucide-react';
import { Station, UserLocation } from '../types';
import { PRICING } from '../constants';

interface HomeViewProps {
  userLocation: UserLocation | null;
  handleLocateMe: () => void;
  stations: Station[];
  onBookStation: (station: Station) => void;
  onPrebook: (station: Station) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ userLocation, handleLocateMe, stations, onBookStation, onPrebook }) => {
  const [detailStation, setDetailStation] = useState<Station | null>(null);

  const mapSrc = userLocation
    ? `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&hl=en&z=15&output=embed&iwloc=near`
    : `https://maps.google.com/maps?q=4.3835,100.9638&hl=en&z=17&output=embed&iwloc=near`;

  return (
    <div className="bg-gray-50 min-h-full flex flex-col pb-40">
       {/* Map View */}
       <div className="h-[35vh] min-h-[250px] bg-slate-200 w-full relative overflow-hidden shadow-inner">
          <iframe 
             key={userLocation ? `${userLocation.lat}-${userLocation.lng}-${userLocation.timestamp}` : 'default-map'}
             width="100%" 
             height="100%" 
             frameBorder="0" 
             scrolling="no" 
             src={mapSrc}
             className="absolute inset-0 w-full h-full opacity-90 grayscale-[10%]"
             title="Map"
          ></iframe>
          <button 
             onClick={handleLocateMe}
             className="absolute bottom-6 right-6 bg-white p-3 rounded-2xl shadow-xl text-gray-700 z-10 active:scale-95 transition-all hover:bg-gray-50 border border-gray-100"
          >
             <Crosshair size={24} className={userLocation ? 'text-emerald-600' : 'text-gray-700'} />
          </button>
       </div>

       {/* Impact Card */}
       <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 relative z-10 space-y-6">
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-[3rem] p-8 shadow-2xl text-white border border-white/10 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 opacity-10">
               <Sun size={140} className="animate-[spin_20s_linear_infinite]" />
            </div>
            
            <div className="flex justify-between items-center relative z-10">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                     <Sun size={14} className="text-yellow-300" />
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Daily Sync</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-3xl font-black tracking-tighter">48.2</h3>
                     <span className="text-sm font-bold opacity-70">kWh</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/60 font-medium tracking-wide">Solar Energy Offset</p>
               </div>

               <div className="h-12 w-px bg-white/10 hidden sm:block"></div>

               <div className="space-y-1 text-right">
                  <div className="flex items-center gap-2 mb-2 justify-end">
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Eco Impact</span>
                     <Leaf size={14} className="text-emerald-300" />
                  </div>
                  <div className="flex items-baseline gap-2 justify-end">
                     <h3 className="text-3xl font-black tracking-tighter text-emerald-300">34.1</h3>
                     <span className="text-sm font-bold opacity-70">kg</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/60 font-medium tracking-wide">CO₂ Saved Overall</p>
               </div>
            </div>
          </div>

          {/* Hub List */}
          <div className="space-y-4">
             <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Nearby Hubs</h2>
             {stations.map(station => (
                <div key={station.id} className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                   <div className="p-8">
                      <div className="flex justify-between items-start mb-6">
                         <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">{station.name}</h3>
                            <div className="flex items-center gap-3 mt-1.5">
                               <span className={`text-[9px] font-black px-3 py-1 rounded-lg ${station.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {station.status.toUpperCase()}
                               </span>
                               <span className="text-[11px] font-bold text-gray-400 flex items-center gap-1.5">
                                   <MapPin size={12} className="text-emerald-500" /> {station.distance}
                               </span>
                            </div>
                         </div>
                         <div className="bg-gray-50 px-4 py-2 rounded-2xl flex flex-col items-center border border-gray-100">
                            <span className="text-lg font-black text-gray-800 leading-none">{station.slots}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase">Free</span>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-6">
                         <button 
                            onClick={() => onPrebook(station)}
                            className="px-4 bg-gray-50 border border-gray-100 text-gray-800 text-[10px] font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest active:scale-95"
                         >
                            <CalendarClock size={16} />
                            PREBOOK
                         </button>
                         <button 
                            onClick={() => onBookStation(station)}
                            className="px-4 bg-emerald-600 text-white text-[10px] font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 active:scale-95 uppercase tracking-widest"
                         >
                            <Zap size={16} fill="currentColor" />
                            CHARGE NOW
                         </button>
                      </div>
                      <button 
                          onClick={() => setDetailStation(station)}
                          className="w-full text-gray-400 text-[9px] font-black py-2 rounded-xl flex items-center justify-center gap-1 uppercase tracking-[0.3em]"
                       >
                          Details & Pricing
                          <ArrowRight size={10} />
                       </button>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Detailed Pricing View */}
       {detailStation && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in-down" onClick={() => setDetailStation(null)}>
            <div className="bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="p-10 flex-1 overflow-y-auto space-y-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black tracking-tight">{detailStation.name}</h2>
                    <button onClick={() => setDetailStation(null)} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                  </div>
                  
                  <div>
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Pricing Plans</h3>
                     <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 space-y-8">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <Sun size={24} className="text-emerald-500" />
                              <div>
                                 <p className="font-black text-gray-800">Eco Charge</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Village Exclusive</p>
                              </div>
                           </div>
                           <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">FREE</span>
                        </div>
                        <div className="h-px bg-gray-200 w-full"></div>
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <Zap size={24} className="text-yellow-500" />
                              <div>
                                 <p className="font-black text-gray-800">Turbo Charge</p>
                                 <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Fast Network</p>
                              </div>
                           </div>
                           <span className="text-gray-900 font-black text-sm">RM {PRICING.fast.toFixed(2)}/kWh</span>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="p-10 border-t border-gray-100">
                  <button 
                     onClick={() => { setDetailStation(null); onBookStation(detailStation); }}
                     className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-emerald-100 active:scale-95 transition-all"
                  >
                     BOOK THIS HUB
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

const X = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
