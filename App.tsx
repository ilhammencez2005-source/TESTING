
import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, Wifi, Search, Activity, RefreshCw, Zap as ZapIcon, Info, Settings2, AlertTriangle, ArrowRight, WifiOff, ShieldAlert, Globe, Link, Copy, ExternalLink, Cpu, Code2, Power, BatteryCharging } from 'lucide-react';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './components/HomeView';
import { BookingView } from './components/BookingView';
import { ChargingSessionView } from './components/ChargingSessionView';
import { GeminiAssistant } from './components/GeminiAssistant';
import { STATIONS } from './constants';
import { Station, Session, UserLocation, ViewState, ChargingMode, Receipt } from './types';

export default function App() {
  const [view, setView] = useState<ViewState>('home'); 
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [walletBalance, setWalletBalance] = useState(50.00);
  const [notification, setNotification] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null); 
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showArduinoCode, setShowArduinoCode] = useState(false);
  
  // HARDWARE CONFIGURATION
  const [isHardwareOnline, setIsHardwareOnline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  
  const apiPath = '/api/status';
  const fullUrl = `${window.location.protocol}//${window.location.host}${apiPath}`;
  const [stationId, setStationId] = useState('ETP-G17-HUB');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const checkHardwareStatus = async () => {
    setSyncing(true);
    setBridgeError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(apiPath, { cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (res.status === 404) throw new Error("Bridge 404");
      const text = await res.text();
      const trimmedText = text.trim().toUpperCase();

      if (trimmedText.startsWith('<!DOCTYPE')) {
        setIsHardwareOnline(false);
      } else {
        setIsHardwareOnline(true);
      }
    } catch (e: any) {
      setIsHardwareOnline(false);
      setBridgeError(e.message || "Offline");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    checkHardwareStatus();
    const interval = setInterval(checkHardwareStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const sendCommand = async (command: 'UNLOCK' | 'LOCK') => {
     try {
       const res = await fetch(apiPath, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ id: stationId, command })
       });
       if (res.ok) {
         showNotification(`Cloud: ${command} Command Sent`);
       }
     } catch (e) {
       showNotification("Cloud Bridge Timeout");
     }
  };

  useEffect(() => {
    let interval: any;
    if (activeSession && activeSession.status === 'charging') {
      interval = setInterval(() => {
        setActiveSession(prev => {
          if (!prev) return null;
          if (prev.chargeLevel >= 100) { endSession(prev); return null; }
          return { ...prev, chargeLevel: prev.chargeLevel + 0.5, cost: prev.cost + 0.01, timeElapsed: prev.timeElapsed + 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const startCharging = (mode: ChargingMode, slotId: string, duration: number | 'full', preAuth: number) => {
    if (preAuth > walletBalance) return showNotification("Insufficient balance.");
    setWalletBalance(p => p - preAuth);
    setActiveSession({ station: selectedStation!, mode, slotId, startTime: new Date(), status: 'charging', chargeLevel: 20, cost: 0, preAuthAmount: preAuth, durationLimit: duration, timeElapsed: 0, isLocked: true });
    sendCommand('LOCK');
    setView('charging');
  };

  const toggleLock = async () => {
    if (!activeSession) return;
    const next = !activeSession.isLocked;
    await sendCommand(next ? 'LOCK' : 'UNLOCK');
    setActiveSession(prev => prev ? ({ ...prev, isLocked: next }) : null);
  };

  const endSession = (cur = activeSession) => {
    if (!cur) return;
    sendCommand('UNLOCK');
    setWalletBalance(p => p + (cur.preAuthAmount - cur.cost));
    setReceipt({ stationName: cur.station.name, date: new Date().toLocaleString(), duration: "Session ended", totalEnergy: "2.1kWh", mode: cur.mode, cost: cur.cost, paid: cur.preAuthAmount, refund: cur.preAuthAmount - cur.cost });
    setActiveSession(null);
    setSelectedStation(null);
    setView('home');
  };

  const arduinoSnippet = `#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Servo.h>

Servo myServo;
void setup() {
  Serial.begin(115200);
  myServo.attach(D4); // Signal to D4
}

void loop() {
  WiFiClientSecure client;
  client.setInsecure(); // REQUIRED for HTTPS
  HTTPClient http;
  
  if (http.begin(client, "${fullUrl}")) {
    int code = http.GET();
    if (code == 200) {
      String payload = http.getString();
      payload.trim();
      
      if (payload.indexOf("UNLOCK") >= 0) {
        myServo.write(180); // Move Servo
      } else if (payload.indexOf("LOCK") >= 0) {
        myServo.write(0);
      }
    }
    http.end();
  }
  delay(3000);
}`;

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
            <HomeView userLocation={userLocation} handleLocateMe={() => {}} stations={STATIONS} onBookStation={(s) => { setSelectedStation(s); setView('booking'); }} onPrebook={(s) => { setSelectedStation(s); setView('booking'); }} />
          )}
          
          {view === 'booking' && selectedStation && (
            <BookingView selectedStation={selectedStation} onBack={() => { setView('home'); setSelectedStation(null); }} onStartCharging={startCharging} />
          )}

          {view === 'charging' && (
            <ChargingSessionView activeSession={activeSession} toggleLock={toggleLock} endSession={() => endSession()} isHardwareConnected={isHardwareOnline} />
          )}
          
          {view === 'profile' && (
            <div className="p-6 flex flex-col items-center max-w-md mx-auto animate-slide-up pb-44">
              <div className="w-full bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                        <User size={48} className="text-emerald-600"/>
                    </div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full flex items-center justify-center text-white shadow-sm">
                        <CheckCircle2 size={14} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter text-gray-900">Ilhammencez</h2>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">UTP Student • Group 17</p>
              </div>

              {/* HARDWARE WORKBENCH */}
              <div className="w-full mt-4 bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Cpu size={16} className="text-emerald-400" />
                      <h3 className="text-white font-black text-xs uppercase tracking-wider">Workbench</h3>
                    </div>
                    <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isHardwareOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                      {isHardwareOnline ? 'Hub Connected' : 'Check Serial'}
                    </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-[8px] font-black text-slate-500 uppercase flex items-center gap-2">
                        <Power size={10} /> Servo Power Check
                      </p>
                      <ShieldAlert size={12} className="text-yellow-500" />
                    </div>
                    <ul className="text-[9px] text-slate-300 font-bold space-y-2">
                       <li className="flex items-start gap-2">
                          <span className="text-emerald-400">1.</span>
                          <span>Move Red Wire to <b>Vin</b> (5V Power).</span>
                       </li>
                       <li className="flex items-start gap-2">
                          <span className="text-emerald-400">2.</span>
                          <span>Check <b>Serial Monitor</b> for "Action: Opening".</span>
                       </li>
                       <li className="flex items-start gap-2">
                          <span className="text-emerald-400">3.</span>
                          <span>Signal Pin: <b>D4 (GPIO 2)</b>.</span>
                       </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => setShowArduinoCode(true)}
                    className="w-full bg-emerald-600/10 text-emerald-400 py-4 rounded-2xl border border-emerald-600/20 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600/20 transition-all"
                  >
                    <Code2 size={16} /> Get Gold-Standard Code
                  </button>
                </div>
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
            </div>
          )}
          {view === 'assistant' && <GeminiAssistant onClose={() => setView('home')} contextData={{ walletBalance, selectedStation }} />}
        </main>

        <NavigationBar view={view} setView={setView} hasActiveSession={!!activeSession} showNotification={showNotification} />

        {showArduinoCode && (
           <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6" onClick={() => setShowArduinoCode(false)}>
              <div className="bg-slate-900 w-full max-w-lg rounded-[3rem] p-8 border border-white/10 overflow-hidden flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-6">
                   <h4 className="text-white font-black text-xs uppercase tracking-[0.2em]">Robust HTTPS Logic</h4>
                   <button onClick={() => setShowArduinoCode(false)} className="text-slate-500 hover:text-white"><ArrowRight size={20} className="rotate-180" /></button>
                 </div>
                 <pre className="flex-1 bg-black/50 p-6 rounded-2xl border border-white/5 overflow-auto text-[10px] text-emerald-300 font-mono leading-relaxed">
                   {arduinoSnippet}
                 </pre>
                 <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <p className="text-[8px] text-yellow-500 font-black uppercase">Troubleshooting Hint</p>
                    <p className="text-[10px] text-slate-300 mt-1">If the Serial prints "UNLOCK" but the motor is still, it's 100% a power issue. Connect Servo VCC to 5V (Vin).</p>
                 </div>
                 <button 
                  onClick={() => { navigator.clipboard.writeText(arduinoSnippet); showNotification("Code Copied!"); }}
                  className="mt-6 w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-900/20"
                 >
                   Copy Code
                 </button>
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
