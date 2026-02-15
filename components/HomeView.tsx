
import React, { useState } from 'react';
import { MapPin, Crosshair, Navigation, CalendarClock, Zap, Star, Clock, Info, X, DollarSign, Shield, ArrowRight, Sun, Wind, BatteryCharging, Leaf } from 'lucide-react';
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
       <div className="h-[35vh] min-h-[250px] bg-slate-200 w-full relative overflow-hidden shadow-inner">
          <iframe 
             key={userLocation ? `${userLocation.lat}-${userLocation.lng}-${userLocation.timestamp}` : 'default-map'}
             width="100%" 
             height="100%" 
             frameBorder="0" 
             scrolling="no" 
             src={mapSrc}
             className="absolute inset-0 w-full h-full opacity-90"
             style={{ filter: 'grayscale(10%) contrast(1.1)' }}
             title="Map"
          ></iframe>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-gray-50/20"></div>
          
          <button 
             onClick={handleLocateMe}
             className="absolute bottom-6 right-6 bg-white p-3 rounded-2xl shadow-xl text-gray-700 z-10 active:scale-95 transition-all hover:bg-gray-50 border border-gray-100"
             aria-label="Locate me"
          >
             <Crosshair size={24} className={userLocation ? 'text-emerald-600' : 'text-gray-700'} />
          </button>
       </div>

       <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 relative z-10 space-y-6">
          
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-[3rem] p-8 shadow-2xl text-white border border-white/10 overflow-hidden relative">
            <div className="absolute -right-6 -top-6 opacity-10 rotate-12">
               <Sun size={140} className="animate-[spin_20s_linear_infinite]" />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="p-1.5 bg-yellow-400/20 rounded-lg">
                        <Sun size={14} className="text-yellow-300 fill-yellow-300" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Live Synergy</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-3xl font-black tracking-tighter">48.2</h3>
                     <span className="text-sm font-bold opacity-70">kWh</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/60 font-medium tracking-wide">Solar energy Today</p>
               </div>

               <div className="h-px sm:h-12 w-full sm:w-px bg-white/10"></div>

               <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="p-1.5 bg-emerald-400/20 rounded-lg">
                        <Leaf size={14} className="text-emerald-300 fill-emerald-300" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Impact</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-3xl font-black tracking-tighter text-emerald-300">34.1</h3>
                     <span className="text-sm font-bold opacity-70">kg</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/60 font-medium tracking-wide">CO₂ emissions saved</p>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Nearby Hubs</h2>
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
                            className="px-4 bg-gray-50 border border-gray-100 text-gray-800 text-[10px] font-black py-4 rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
                         >
                            <CalendarClock size={16} />
                            PREBOOK
                         </button>
                         <button 
                            onClick={() => onBookStation(station)}
                            className="px-4 bg-emerald-600 text-white text-[10px] font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 active:scale-95 uppercase tracking-widest"
                         >
                            <Zap size={16} fill="currentColor" />
                            CHARGE NOW
                         </button>
                      </div>
                      <button 
                          onClick={() => setDetailStation(station)}
                          className="w-full text-gray-400 text-[9px] font-black py-2 rounded-xl hover:text-gray-600 transition-colors flex items-center justify-center gap-1 uppercase tracking-[0.3em]"
                       >
                          Details & Reviews
                          <ArrowRight size={10} />
                       </button>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {detailStation && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-down" onClick={() => setDetailStation(null)}>
            <div className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3.5rem] shadow-2xl h-[85vh] sm:h-auto overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="relative h-48 bg-gray-200 shrink-0">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    src={`https://maps.google.com/maps?q=${detailStation.coordinates}&hl=en&z=17&output=embed&iwloc=near`}
                    className="absolute inset-0 w-full h-full opacity-80"
                    title="Detail Map"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <button onClick={() => setDetailStation(null)} className="absolute top-6 right-6 bg-white/20 text-white p-3 rounded-full hover:bg-white/40 backdrop-blur-md transition-colors">
                     <X size={24} />
                  </button>
                  <div className="absolute bottom-8 left-10 text-white">
                     <h2 className="text-3xl font-black leading-none mb-1 tracking-tight">{detailStation.name}</h2>
                     <p className="text-xs font-bold opacity-80 flex items-center gap-1 tracking-wide uppercase"><MapPin size={14} /> {detailStation.address}</p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-emerald-50 p-5 rounded-[2rem] border border-emerald-100 flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
                           <Clock size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Status</p>
                           <p className="text-sm font-black text-gray-800">{detailStation.operatingHours}</p>
                        </div>
                     </div>
                     <div className="bg-blue-50 p-5 rounded-[2rem] border border-blue-100 flex items-center gap-3">
                        <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                           <Info size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">Info</p>
                           <p className="text-sm font-black text-gray-800">Verified</p>
                        </div>
                     </div>
                  </div>

                  <div>
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Pricing Plans</h3>
                     <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-6 space-y-6">
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
                           <span className="text-gray-900 font-black text-sm tracking-tighter">RM {PRICING.fast.toFixed(2)}/kWh</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="p-10 border-t border-gray-100 bg-white shrink-0">
                  <button 
                     onClick={() => {
                        setDetailStation(null);
                        onBookStation(detailStation);
                     }}
                     className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-lg shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                     CONFIRM BOOKING
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
