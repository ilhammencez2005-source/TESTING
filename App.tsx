
import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, Wifi, Search, Activity, RefreshCw, Zap as ZapIcon, Info, Settings2, AlertTriangle, ArrowRight, WifiOff, ShieldAlert, Globe, Link, Copy, ExternalLink, Cpu, Power, BatteryCharging, ShieldCheck, History } from 'lucide-react';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './components/HomeView';
import { BookingView } from './components/BookingView';
import { ChargingSessionView } from './components/ChargingSessionView';
import { GeminiAssistant } from './components/GeminiAssistant';
import { HistoryView } from './components/HistoryView';
import { STATIONS, MOCK_HISTORY } from './constants';
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
  
  // HARDWARE CONFIGURATION
  const [isHardwareOnline, setIsHardwareOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const apiPath = '/api/status';
  const [stationId, setStationId] = useState('ETP-G17-HUB');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of Earth in km
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
        showNotification("Location Updated");
      }, (err) => {
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
    return {
      ...station,
      distance: calculateDistance(userLocation.lat, userLocation.lng, sLat, sLng)
    };
  });

  useEffect(() => {
    localStorage.setItem('synergy_balance', walletBalance.toString());
  }, [walletBalance]);

  const checkHardwareStatus = async () => {
    setSyncing(true);
    try {
      const res = await fetch(apiPath, { cache: 'no-store' });
      const text = await res.text();
      setIsHardwareOnline(!text.trim().startsWith('<!DOCTYPE'));
    } catch (e) {
      setIsHardwareOnline(false);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    checkHardwareStatus();
    const interval = setInterval(checkHardwareStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (command: 'UNLOCK' | 'LOCK', isAuto = true) => {
     try {
       const res = await fetch(apiPath, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ id: stationId, command })
       });
       if (res.ok) {
         showNotification(isAuto ? `SYSTEM: AUTOMATIC ${command}` : `MANUAL: ${command} SENT`);
       }
     } catch (e) {
       showNotification("BRIDGE ERROR: CHECK WIFI");
     }
  };

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
          return { ...prev, chargeLevel: prev.chargeLevel + 0.5, cost: prev.cost + 0.01, timeElapsed: prev.timeElapsed + 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const startCharging = (mode: ChargingMode, slotId: string, duration: number | 'full', preAuth: number) => {
    if (preAuth > walletBalance) return showNotification("INSUFFICIENT CREDITS");
    setWalletBalance(p => p - preAuth);
    setActiveSession({ station: selectedStation!, mode, slotId, startTime: new Date(), status: 'charging', chargeLevel: 20, cost: 0, preAuthAmount: preAuth, durationLimit: duration, timeElapsed: 0, isLocked: true });
    sendCommand('LOCK', true);
    setView('charging');
  };

  const toggleLock = async () => {
    if (!activeSession) return;
    const next = !activeSession.isLocked;
    await sendCommand(next ? 'LOCK' : 'UNLOCK', false);
    setActiveSession(prev => prev ? ({ ...prev, isLocked: next }) : null);
  };

  const endSession = (cur = activeSession) => {
    if (!cur) return;
    sendCommand('UNLOCK', true);
    const refund = cur.preAuthAmount - cur.cost;
    const actualCost = cur.cost;
    const energyConsumed = cur.cost / 1.2;
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
    setReceipt({ stationName: cur.station.name, date: new Date().toLocaleString(), duration: `${Math.floor(cur.timeElapsed / 60)}m ${cur.timeElapsed % 60}s`, totalEnergy: `${energyConsumed.toFixed(2)}kWh`, mode: cur.mode, cost: cur.cost, paid: cur.preAuthAmount, refund: refund });
    setActiveSession(null); setSelectedStation(null); setView('home');
  };

  const clearHistory = () => {
    setChargingHistory([]);
    localStorage.removeItem('synergy_history');
    showNotification("History Cleared");
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
        {notification && (
          <div className="fixed top-12 left-1/2 transform -translate-x-1/2 z-[150] bg-gray-900/95 text-white px-6 py-4 rounded-3xl shadow-2xl text-[10px] font-black animate-fade-in-down backdrop-blur-md max-w-[300px] w-full border border-white/10 text-center uppercase tracking-widest">
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
            <HomeView userLocation={userLocation} handleLocateMe={handleLocateMe} stations={dynamicStations} onBookStation={(s) => { setSelectedStation(s); setView('booking'); }} onPrebook={(s) => { setSelectedStation(s); setView('booking'); }} />
          )}
          {view === 'booking' && selectedStation && <BookingView selectedStation={selectedStation} onBack={() => { setView('home'); setSelectedStation(null); }} onStartCharging={startCharging} />}
          {view === 'charging' && <ChargingSessionView activeSession={activeSession} toggleLock={toggleLock} endSession={() => endSession()} isHardwareConnected={isHardwareOnline} />}
          {view === 'history' && <HistoryView history={chargingHistory} onClearHistory={clearHistory} />}
          {view === 'profile' && (
            <div className="p-6 flex flex-col items-center max-w-md mx-auto animate-slide-up pb-44">
              <div className="w-full bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                        <User size={48} className="text-emerald-600"/>
                    </div>
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter text-gray-900">Ilhammencez</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">UTP Student • Group 17</p>
              </div>
              <div className="w-full mt-4 bg-white rounded-[3rem] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isHardwareOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Smart Dock Hub</h3>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${isHardwareOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {isHardwareOnline ? 'Verified Connection' : 'Scanning Bridge...'}
                    </p>
                  </div>
                </div>
                <div className={`w-3 h-3 rounded-full ${isHardwareOnline ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)] animate-pulse' : 'bg-gray-300'}`}></div>
              </div>
              <div className="w-full bg-white rounded-[3rem] p-8 border border-gray-100 mt-4 shadow-sm">
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synergy Credits</p>
                       <h4 className="text-4xl font-black text-emerald-600 tracking-tighter">RM {walletBalance.toFixed(2)}</h4>
                    </div>
                    <button onClick={() => setShowTopUpModal(true)} className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><ZapIcon size={24} fill="currentColor" /></button>
                 </div>
                 <button onClick={() => setShowTopUpModal(true)} className="w-full bg-gray-900 text-white py-5 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-xl">Top Up Wallet</button>
              </div>
              <div className="w-full mt-4">
                <button onClick={() => setView('history')} className="w-full bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center gap-2 group transition-all active:scale-95">
                  <History className="text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">View Charging History</span>
                </button>
              </div>
            </div>
          )}
          {view === 'assistant' && <GeminiAssistant onClose={() => setView('home')} contextData={{ walletBalance, selectedStation }} />}
        </main>

        <NavigationBar view={view} setView={setView} hasActiveSession={!!activeSession} showNotification={showNotification} />

        {showTopUpModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setShowTopUpModal(false)}>
             <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-[360px] text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-emerald-600 p-8 rounded-[3rem] mb-8 flex items-center justify-center">
                  <div className="bg-white p-3 rounded-3xl relative z-10">
                    <img src="https://lh3.googleusercontent.com/d/1usUmakfqoX6yrVG_BQucVdmQx4jDpxoO" alt="QR" className="w-full aspect-square object-contain" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">Terminal Sync</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">Scan QR at any Village Kiosk<br/>to reload your Synergy Wallet</p>
             </div>
          </div>
        )}

        {receipt && (
          <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-6">
             <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-12 text-center animate-fade-in-down">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600"><CheckCircle2 size={48} /></div>
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
