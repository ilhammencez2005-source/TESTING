
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
    <div className="bg-gray-50 min-h-full flex flex-col pb-20">
       <div className="h-[40vh] min-h-[300px] bg-slate-200 w-full relative overflow-hidden shadow-inner">
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
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-gray-50/80"></div>
          
          <button 
             onClick={handleLocateMe}
             className="absolute bottom-16 right-6 bg-white p-3 rounded-2xl shadow-xl text-gray-700 z-10 active:scale-95 transition-all hover:bg-gray-50 border border-gray-100"
             aria-label="Locate me"
          >
             <Crosshair size={24} className={userLocation ? 'text-emerald-600' : 'text-gray-700'} />
          </button>
       </div>

       <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 -mt-12 relative z-10 space-y-6">
          
          {/* Sustainability Impact Card */}
          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-[2.5rem] p-6 shadow-2xl text-white border border-white/10 overflow-hidden relative">
            <div className="absolute -right-6 -top-6 opacity-10 rotate-12">
               <Sun size={140} className="animate-[spin_20s_linear_infinite]" />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="p-1.5 bg-yellow-400/20 rounded-lg">
                        <Sun size={14} className="text-yellow-300 fill-yellow-300" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Live Sustainability Data</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-3xl font-black tracking-tighter">48.2</h3>
                     <span className="text-sm font-bold opacity-70">kWh Received</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/60 font-medium tracking-wide">Total solar energy generated today</p>
               </div>

               <div className="h-px sm:h-12 w-full sm:w-px bg-white/10"></div>

               <div className="space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="p-1.5 bg-emerald-400/20 rounded-lg">
                        <Leaf size={14} className="text-emerald-300 fill-emerald-300" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100">Carbon Offset</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-3xl font-black tracking-tighter text-emerald-300">34.1</h3>
                     <span className="text-sm font-bold opacity-70">kg Saved</span>
                  </div>
                  <p className="text-[10px] text-emerald-100/60 font-medium tracking-wide">Estimated CO₂ emissions avoided</p>
               </div>
            </div>
          </div>

          <div className="space-y-4">
             <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Nearby Stations</h2>
             {stations.map(station => (
                <div key={station.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                   <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">{station.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                               <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${station.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                  {station.status.toUpperCase()}
                               </span>
                               <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                   <MapPin size={12} /> {station.distance}
                               </span>
                            </div>
                         </div>
                         <div className="bg-gray-50 px-3 py-2 rounded-2xl flex flex-col items-center border border-gray-100">
                            <span className="text-lg font-black text-gray-800 leading-none">{station.slots}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase">Free</span>
                         </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                         <button 
                            onClick={() => onPrebook(station)}
                            className="px-4 bg-gray-50 border border-gray-100 text-gray-700 text-xs font-black py-3.5 rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                         >
                            <CalendarClock size={16} />
                            PREBOOK
                         </button>
                         <button 
                            onClick={() => onBookStation(station)}
                            className="px-4 bg-emerald-600 text-white text-xs font-black py-3.5 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-95"
                         >
                            <Zap size={16} fill="currentColor" />
                            CHARGE NOW
                         </button>
                      </div>
                      <button 
                          onClick={() => setDetailStation(station)}
                          className="w-full text-gray-400 text-[10px] font-black py-2 rounded-xl hover:text-gray-600 transition-colors flex items-center justify-center gap-1 uppercase tracking-widest"
                       >
                          View Details & Reviews
                          <ArrowRight size={12} />
                       </button>
                   </div>
                </div>
             ))}
          </div>
       </div>

       {/* Detail Modal */}
       {detailStation && (
         <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in-down" onClick={() => setDetailStation(null)}>
            <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl h-[85vh] sm:h-auto overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
               
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
                  <button onClick={() => setDetailStation(null)} className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 backdrop-blur-md transition-colors">
                     <X size={20} />
                  </button>
                  <div className="absolute bottom-6 left-8 text-white">
                     <h2 className="text-3xl font-black leading-none mb-1 tracking-tight">{detailStation.name}</h2>
                     <p className="text-xs font-bold opacity-80 flex items-center gap-1 tracking-wide uppercase"><MapPin size={14} /> {detailStation.address}</p>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100 flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600">
                           <Clock size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Hours</p>
                           <p className="text-sm font-bold text-gray-800">{detailStation.operatingHours}</p>
                        </div>
                     </div>
                     <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100 flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 rounded-2xl text-blue-600">
                           <Shield size={20} />
                        </div>
                        <div>
                           <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider">Reliability</p>
                           <p className="text-sm font-bold text-gray-800">99.2% Up</p>
                        </div>
                     </div>
                  </div>

                  <div>
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                           <DollarSign size={14} className="text-emerald-600" />
                           Transparent Pricing
                        </h3>
                     </div>
                     <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 space-y-4">
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <Sun size={20} className="text-emerald-500" />
                              <div>
                                 <p className="font-bold text-gray-800">Eco Charge</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase">Solar Powered</p>
                              </div>
                           </div>
                           <span className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase">FREE</span>
                        </div>
                        <div className="h-px bg-gray-200 w-full"></div>
                        <div className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                              <Zap size={20} className="text-yellow-500" />
                              <div>
                                 <p className="font-bold text-gray-800">Turbo Charge</p>
                                 <p className="text-[10px] text-gray-400 font-bold uppercase">Fast 22kW DC</p>
                              </div>
                           </div>
                           <span className="text-gray-900 font-black text-sm">RM {PRICING.fast.toFixed(2)}/kWh</span>
                        </div>
                     </div>
                  </div>

                  <div>
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Community Feedback</h3>
                     <div className="space-y-4">
                        {detailStation.reviews && detailStation.reviews.length > 0 ? (
                           detailStation.reviews.map(review => (
                              <div key={review.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                                 <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-2">
                                       <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-black">
                                          {review.user[0]}
                                       </div>
                                       <span className="font-bold text-sm text-gray-900">{review.user}</span>
                                    </div>
                                    <div className="flex text-yellow-400">
                                       {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={10} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-200"} />
                                       ))}
                                    </div>
                                 </div>
                                 <p className="text-sm text-gray-600 leading-relaxed font-medium italic">"{review.comment}"</p>
                              </div>
                           ))
                        ) : (
                           <div className="text-center py-6 text-gray-400 text-xs font-bold uppercase tracking-widest bg-gray-50 rounded-3xl">
                              No feedback yet
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               <div className="p-6 border-t border-gray-100 bg-white shrink-0">
                  <button 
                     onClick={() => {
                        setDetailStation(null);
                        onBookStation(detailStation);
                     }}
                     className="w-full bg-emerald-600 text-white py-4 rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                  >
                     BOOK THIS STATION
                  </button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
