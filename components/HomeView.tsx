
import React, { useState, useMemo } from 'react';
import { MapPin, Crosshair, CalendarClock, Zap, ArrowRight, Sun, Leaf, X, Star, Clock, Info } from 'lucide-react';
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

  // Accurate Distance Calculation using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, stationCoords: string) => {
    const [lat2, lon2] = stationCoords.split(',').map(Number);
    const R = 6371; // radius of Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    
    if (d < 1) return `${(d * 1000).toFixed(0)}m`;
    if (d > 1000) return `>1000km`; 
    return `${d.toFixed(1)}km`;
  };

  const mapSrc = useMemo(() => {
    return userLocation
      ? `https://maps.google.com/maps?q=${userLocation.lat},${userLocation.lng}&hl=en&z=15&output=embed&iwloc=near`
      : `https://maps.google.com/maps?q=4.3835,100.9638&hl=en&z=17&output=embed&iwloc=near`;
  }, [userLocation?.lat, userLocation?.lng]);

  return (
    <div className="bg-gray-50 min-h-full flex flex-col pb-40">
       {/* Map View */}
       <div className="h-[32vh] min-h-[240px] bg-slate-200 w-full relative overflow-hidden shadow-inner">
          <iframe 
             key={userLocation ? `${userLocation.lat}-${userLocation.lng}-${userLocation.timestamp}` : 'default-map'}
             width="100%" 
             height="100%" 
             frameBorder="0" 
             src={mapSrc}
             className="absolute inset-0 w-full h-full opacity-90 grayscale-[10%]"
             title="Map"
          ></iframe>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50/80 to-transparent pointer-events-none h-20 bottom-0" />
          <button 
             onClick={handleLocateMe}
             className="absolute bottom-6 right-6 bg-white p-3.5 rounded-2xl shadow-2xl text-gray-700 z-10 active:scale-95 transition-all hover:bg-gray-50 border border-gray-100"
          >
             <Crosshair size={22} className={userLocation ? 'text-emerald-600' : 'text-gray-700'} />
          </button>
       </div>

       {/* List of Hubs */}
       <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 relative z-10 space-y-8">
          <div className="space-y-5">
             <div className="flex items-center justify-between px-2">
               <div>
                  <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Nearby Synergy Hubs</h2>
                  <p className="text-xs font-bold text-gray-500 mt-0.5">Available stations for UTP campus</p>
               </div>
               {!userLocation && (
                 <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Locating...</span>
                 </div>
               )}
             </div>
             
             {stations.map(station => {
                const displayDistance = userLocation 
                  ? calculateDistance(userLocation.lat, userLocation.lng, station.coordinates)
                  : "Locating..."; 

                const isActive = station.status === 'Active';

                return (
                  <div key={station.id} className="bg-white rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 group">
                    <div className="p-8">
                        {/* Hub Identity & Slots */}
                        <div className="flex justify-between items-start mb-8">
                          <div className="space-y-2">
                              <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none group-hover:text-emerald-700 transition-colors">
                                {station.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                                    {station.status}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                                    <MapPin size={10} className="text-emerald-500" />
                                    {displayDistance}
                                </div>
                              </div>
                          </div>
                          
                          <div className="flex flex-col items-center justify-center bg-gray-50 w-16 h-16 rounded-[1.5rem] border border-gray-100 shadow-inner group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors">
                              <span className="text-2xl font-black text-gray-900 leading-none group-hover:text-emerald-700">{station.slots}</span>
                              <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mt-1">Ready</span>
                          </div>
                        </div>
                        
                        {/* Primary Actions */}
                        <div className="flex flex-col gap-3">
                           <div className="grid grid-cols-2 gap-3">
                             <button 
                                 onClick={() => onPrebook(station)}
                                 className="bg-gray-50 border border-gray-100 text-gray-900 text-[10px] font-black py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-gray-100 active:scale-95"
                             >
                                 <CalendarClock size={16} />
                                 Reserve
                             </button>
                             <button 
                                 onClick={() => onBookStation(station)}
                                 className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-[10px] font-black py-4 rounded-[1.5rem] transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200/50 hover:shadow-emerald-300/60 active:scale-95 uppercase tracking-widest"
                             >
                                 <Zap size={16} fill="currentColor" />
                                 Charge Now
                             </button>
                           </div>

                           <button 
                               onClick={() => setDetailStation(station)}
                               className="w-full flex items-center justify-between px-6 py-3.5 bg-gray-50/50 rounded-2xl hover:bg-emerald-50 transition-colors group/link"
                           >
                               <div className="flex items-center gap-3">
                                  <Info size={14} className="text-gray-400 group-hover/link:text-emerald-500" />
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover/link:text-emerald-700">Detailed View & Pricing</span>
                               </div>
                               <ArrowRight size={14} className="text-gray-300 group-hover/link:text-emerald-500 group-hover/link:translate-x-1 transition-all" />
                           </button>
                        </div>
                    </div>
                  </div>
                );
             })}
          </div>
       </div>

       {/* Detailed Hub Modal */}
       {detailStation && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end justify-center animate-fade-in-down" onClick={() => setDetailStation(null)}>
            <div className="bg-white w-full max-w-lg rounded-t-[3rem] shadow-2xl h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="p-10 flex-1 overflow-y-auto space-y-10 scrollbar-hide">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black tracking-tighter text-gray-900">{detailStation.name}</h2>
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{detailStation.address}</span>
                      </div>
                    </div>
                    <button onClick={() => setDetailStation(null)} className="p-3 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full text-gray-500">
                      <X size={24} />
                    </button>
                  </div>
                  
                  {/* Pricing Modes */}
                  <div className="space-y-5">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Charging Synergy</h3>
                    <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 space-y-8">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-white">
                                <Sun size={24} />
                             </div>
                             <div>
                                <p className="font-black text-gray-900">Eco Charge</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Free Solar Synergy</p>
                             </div>
                          </div>
                          <span className="bg-emerald-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-200">FREE</span>
                       </div>

                       <div className="flex justify-between items-center border-t border-gray-200 pt-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-600 shadow-sm border border-white">
                                <Zap size={24} fill="currentColor" />
                             </div>
                             <div>
                                <p className="font-black text-gray-900">Turbo Charge</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">RM 1.20 Per kWh</p>
                             </div>
                          </div>
                          <span className="bg-yellow-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-yellow-200">PAID</span>
                       </div>
                    </div>
                  </div>

                  {/* Status & Hours */}
                  <div className="px-2">
                    <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-[2.5rem] p-8 flex items-center gap-6 shadow-sm">
                       <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-50">
                          <Clock size={28} strokeWidth={2.5} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-1">Live Status</p>
                          <div className="flex items-baseline gap-2">
                             <p className="text-2xl font-black text-gray-900 tracking-tighter uppercase">OPERATING: {detailStation.operatingHours}</p>
                             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mb-1"></div>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="space-y-5 pb-10">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Campus Feedback</h3>
                    <div className="space-y-4">
                      {detailStation.reviews.map((review) => (
                        <div key={review.id} className="bg-white border border-gray-100 rounded-[2.2rem] p-7 shadow-sm hover:shadow-md transition-shadow">
                           <div className="flex justify-between items-start mb-3">
                             <div className="flex items-center gap-3">
                               <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-[10px] font-black">
                                 {review.user.charAt(0)}
                               </div>
                               <div>
                                 <p className="font-black text-gray-900 text-xs uppercase tracking-tight">{review.user}</p>
                                 <div className="flex items-center gap-0.5 mt-0.5">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} size={10} className={i < review.rating ? "text-yellow-400" : "text-gray-200"} fill={i < review.rating ? "currentColor" : "none"} />
                                   ))}
                                 </div>
                               </div>
                             </div>
                             <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">{review.date}</span>
                           </div>
                           <p className="text-[11px] text-gray-600 font-bold leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>
               
               {/* Fixed Modal CTA */}
               <div className="p-10 border-t border-gray-100 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
                  <button 
                     onClick={() => { setDetailStation(null); onBookStation(detailStation); }}
                     className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-base shadow-2xl shadow-emerald-200 active:scale-[0.98] transition-all uppercase tracking-[0.25em]"
                  >
                     Secure This Hub
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
