
import React, { useState } from 'react';
import { MapPin, Crosshair, CalendarClock, Zap, ArrowRight, Sun, Leaf, X } from 'lucide-react';
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

       {/* List of Hubs - Distances are now static in constants for instant UI */}
       <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 relative z-10 space-y-6">
          <div className="space-y-4">
             <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Nearby Charging Hubs</h2>
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
                            <span className="text-[8px] font-black text-gray-400 uppercase">Slots</span>
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

       {detailStation && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in-down" onClick={() => setDetailStation(null)}>
            <div className="bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="p-10 flex-1 overflow-y-auto space-y-10">
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-black tracking-tight">{detailStation.name}</h2>
                    <button onClick={() => setDetailStation(null)} className="p-2 bg-gray-100 rounded-full"><X size={24} /></button>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 space-y-8">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <Sun size={24} className="text-emerald-500" />
                           <div>
                              <p className="font-black text-gray-800">Eco Charge</p>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Free Solar Synergy</p>
                           </div>
                        </div>
                        <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">FREE</span>
                     </div>
                  </div>
               </div>
               <div className="p-10 border-t border-gray-100">
                  <button 
                     onClick={() => { setDetailStation(null); onBookStation(detailStation); }}
                     className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-2xl active:scale-95 transition-all"
                  >
                     BOOK HUB
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
