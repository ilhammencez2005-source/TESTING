
import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, Zap as ZapIcon, Power, History, Loader2, ShieldCheck, Clock } from 'lucide-react';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './components/HomeView';
import { BookingView } from './components/BookingView';
import { ChargingSessionView } from './components/ChargingSessionView';
import { GeminiAssistant } from './components/GeminiAssistant';
import { HistoryView } from './components/HistoryView';
import { STATIONS } from './constants';
import { Station, Session, UserLocation, ViewState, ChargingMode, Receipt, ChargingHistoryItem } from './types';

export default function App() {
  const [view, setView] = useState<ViewState>('home'); 
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [walletBalance, setWalletBalance] = useState(50.00);
  const [notification, setNotification] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null); 
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [chargingHistory, setChargingHistory] = useState<ChargingHistoryItem[]>([]);
  
  // PREBOOK FLOW STATES
  const [isPrebookFlow, setIsPrebookFlow] = useState(false);
  const [prebookCountdown, setPrebookCountdown] = useState<number | null>(null);
  const [pendingSessionData, setPendingSessionData] = useState<any>(null);

  // BRIDGE CONFIGURATION
  const apiPath = '/api/status';
  const stationId = 'ETP-G17-HUB';

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d < 1 ? `${(d * 1000).toFixed(0)} m away` : `${d.toFixed(1)} km away`;
  };

  const handleLocateMe = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now() });
      }, () => {
        showNotification("Location Access Denied");
      });
    }
  };

  useEffect(() => {
    handleLocateMe();
    const savedHistory = localStorage.getItem('synergy_history');
    if (savedHistory) setChargingHistory(JSON.parse(savedHistory));
    const savedBalance = localStorage.getItem('synergy_balance');
    if (savedBalance) setWalletBalance(parseFloat(savedBalance));
  }, []);

  const dynamicStations = STATIONS.map(station => {
    if (!userLocation) return station;
    const [sLat, sLng] = station.coordinates.split(',').map(Number);
    return { ...station, distance: calculateDistance(userLocation.lat, userLocation.lng, sLat, sLng) };
  });

  const sendCommand = async (command: 'UNLOCK' | 'LOCK') => {
     try {
       await fetch(apiPath, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ id: stationId, command })
       });
     } catch (e) {
       console.error("Bridge Connection Failed");
     }
  };

  // Prebook Countdown Timer Logic
  useEffect(() => {
    let timer: any;
    if (prebookCountdown !== null && prebookCountdown > 0) {
      timer = setTimeout(() => setPrebookCountdown(prebookCountdown - 1), 1000);
    } else if (prebookCountdown === 0) {
      setPrebookCountdown(null);
      executeStartCharging(pendingSessionData.mode, pendingSessionData.slotId, pendingSessionData.duration, pendingSessionData.preAuth);
    }
    return () => clearTimeout(timer);
  }, [prebookCountdown, pendingSessionData]);

  // Charging Session Progress Logic
  useEffect(() => {
    let interval: any;
    if (activeSession && activeSession.status === 'charging') {
      interval = setInterval(() => {
        setActiveSession(prev => {
          if (!prev) return null;
          if (prev.chargeLevel >= 100) { 
            endSession(prev); 
            return null; 
          }
          const costInc = prev.mode === 'fast' ? 0.05 : 0;
          return { ...prev, chargeLevel: prev.chargeLevel + 0.1, cost: prev.cost + costInc, timeElapsed: prev.timeElapsed + 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const startCharging = (mode: ChargingMode, slotId: string, duration: number | 'full', preAuth: number) => {
    if (preAuth > walletBalance) return showNotification("INSUFFICIENT CREDITS");
    
    if (isPrebookFlow) {
      setPendingSessionData({ mode, slotId, duration, preAuth });
      setPrebookCountdown(10);
    } else {
      executeStartCharging(mode, slotId, duration, preAuth);
    }
  };

  const executeStartCharging = (mode: ChargingMode, slotId: string, duration: number | 'full', preAuth: number) => {
    setWalletBalance(p => p - preAuth);
    setActiveSession({ 
      station: selectedStation!, 
      mode, slotId, 
      startTime: new Date(), 
      status: 'charging', 
      chargeLevel: 24, 
      cost: 0, 
      preAuthAmount: preAuth, 
      durationLimit: duration, 
      timeElapsed: 0, 
      isLocked: true 
    });
    sendCommand('LOCK');
    setView('charging');
    setIsPrebookFlow(false);
  };

  const toggleLock = async () => {
    if (!activeSession) return;
    const nextState = !activeSession.isLocked;
    const command = nextState ? 'LOCK' : 'UNLOCK';
    await sendCommand(command);
    setActiveSession(prev => prev ? { ...prev, isLocked: nextState } : null);
    showNotification(`Hub ${command}ed`);
  };

  const endSession = (cur = activeSession) => {
    if (!cur) return;
    sendCommand('UNLOCK');
    const refund = cur.preAuthAmount - cur.cost;
    const actualCost = cur.cost;
    const energyConsumed = cur.cost > 0 ? cur.cost / 1.2 : 4.5; // free mode uses mock energy
    setWalletBalance(p => p + refund);
    
    const historyItem: ChargingHistoryItem = {
      id: Date.now(),
      stationName: cur.station.name,
      date: new Date().toLocaleString('en-MY', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      amount: actualCost,
      energy: energyConsumed,
      status: 'Completed'
    };
    
    const newHistory = [historyItem, ...chargingHistory];
    setChargingHistory(newHistory);
    localStorage.setItem('synergy_history', JSON.stringify(newHistory));
    localStorage.setItem('synergy_balance', (walletBalance + refund).toString());

    setReceipt({ 
      stationName: cur.station.name, 
      date: new Date().toLocaleString(), 
      duration: `${Math.floor(cur.timeElapsed / 60)}m ${cur.timeElapsed % 60}s`, 
      totalEnergy: `${energyConsumed.toFixed(2)}kWh`, 
      mode: cur.mode, 
      cost: cur.cost, 
      paid: cur.preAuthAmount, 
      refund: refund 
    });
    setActiveSession(null); setSelectedStation(null); setView('home');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
        {notification && (
          <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-[150] bg-gray-900/95 text-white px-6 py-4 rounded-3xl shadow-2xl text-[10px] font-black animate-fade-in-down border border-white/10 text-center uppercase tracking-widest">
            {notification}
          </div>
        )}
        
        {view !== 'charging' && view !== 'assistant' && (
          <div className="shrink-0 w-full bg-white shadow-sm border-b border-gray-100 relative z-50">
             <Header walletBalance={walletBalance} onProfileClick={() => setView('profile')} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative w-full scrollbar-hide">
          {view === 'home' && (
            <HomeView 
              userLocation={userLocation} 
              handleLocateMe={handleLocateMe} 
              stations={dynamicStations} 
              onBookStation={(s) => { setSelectedStation(s); setIsPrebookFlow(false); setView('booking'); }} 
              onPrebook={(s) => { setSelectedStation(s); setIsPrebookFlow(true); setView('booking'); }} 
            />
          )}
          
          {view === 'booking' && selectedStation && (
            <BookingView 
              selectedStation={selectedStation} 
              onBack={() => { setView('home'); setSelectedStation(null); }} 
              onStartCharging={startCharging}
              isPrebook={isPrebookFlow}
            />
          )}

          {view === 'charging' && (
            <ChargingSessionView 
              activeSession={activeSession} 
              toggleLock={toggleLock} 
              endSession={() => endSession()} 
              isHardwareConnected={true} 
            />
          )}

          {view === 'history' && <HistoryView history={chargingHistory} onClearHistory={() => setChargingHistory([])} />}
          
          {view === 'profile' && (
            <div className="p-6 flex flex-col items-center max-w-md mx-auto animate-slide-up pb-44">
              <div className="w-full bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <User size={48} className="text-emerald-600"/>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Ilhammencez</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">UTP Student • Group 17</p>
              </div>
              
              <div className="w-full bg-white rounded-[3rem] p-8 border border-gray-100 mt-4 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synergy Credits</p>
                       <h4 className="text-4xl font-black text-emerald-600 tracking-tighter">RM {walletBalance.toFixed(2)}</h4>
                    </div>
                    <button onClick={() => setShowTopUpModal(true)} className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><ZapIcon size={24} fill="currentColor" /></button>
                 </div>
                 <button onClick={() => setShowTopUpModal(true)} className="w-full bg-gray-900 text-white py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest">Top Up Wallet</button>
              </div>

              <div className="w-full mt-4 bg-white rounded-[3rem] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">System Status</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Verified Bridge Online</p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>
          )}
          {view === 'assistant' && <GeminiAssistant onClose={() => setView('home')} contextData={{ walletBalance, selectedStation }} />}
        </main>

        <NavigationBar view={view} setView={setView} hasActiveSession={!!activeSession} showNotification={showNotification} />

        {/* PREBOOK COUNTDOWN OVERLAY */}
        {prebookCountdown !== null && (
          <div className="fixed inset-0 z-[200] bg-white/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center animate-fade-in-down">
            <div className="relative w-56 h-56 flex items-center justify-center mb-8">
               <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle cx="50%" cy="50%" r="45%" stroke="#f1f5f9" strokeWidth="10" fill="transparent" />
                  <circle 
                    cx="50%" cy="50%" r="45%" 
                    stroke="#10b981" 
                    strokeWidth="10" 
                    fill="transparent" 
                    strokeDasharray="283%" 
                    strokeDashoffset={`${283 - (283 * (10 - prebookCountdown)) / 10}%`}
                    className="transition-all duration-1000 ease-linear"
                  />
               </svg>
               <span className="text-7xl font-black text-gray-900 tabular-nums">{prebookCountdown}</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-3">Syncing Hub</h3>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] leading-relaxed max-w-xs">
              Servo will lock and charging will start automatically in {prebookCountdown}s
            </p>
            <div className="mt-16 flex items-center gap-3 text-emerald-600">
               <Loader2 className="animate-spin" size={24} />
               <span className="text-[11px] font-black uppercase tracking-widest">Awaiting Bridge Handshake...</span>
            </div>
          </div>
        )}

        {showTopUpModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setShowTopUpModal(false)}>
             <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-[360px] text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-emerald-600 p-8 rounded-[3rem] mb-8 flex items-center justify-center">
                  <div className="bg-white p-3 rounded-3xl relative z-10">
                    <img src="https://lh3.googleusercontent.com/d/1usUmakfqoX6yrVG_BQucVdmQx4jDpxoO" alt="QR" className="w-full aspect-square object-contain" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">Terminal Sync</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scan QR at any Village Kiosk to reload</p>
             </div>
          </div>
        )}

        {receipt && (
          <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-6">
             <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-12 text-center animate-fade-in-down">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600"><CheckCircle2 size={40} /></div>
                <h2 className="text-3xl font-black text-gray-900 uppercase mb-2">Success</h2>
                <div className="my-10 bg-gray-50/50 py-8 rounded-[2.5rem] border border-gray-100">
                   <p className="text-6xl font-black text-emerald-600 tracking-tighter">RM {receipt.cost.toFixed(2)}</p>
                </div>
                <button onClick={() => setReceipt(null)} className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em]">Done</button>
             </div>
          </div>
        )}
    </div>
  );
}
