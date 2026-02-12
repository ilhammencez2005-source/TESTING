
import React, { useState, useEffect } from 'react';
import { User, X, CheckCircle2, Cpu, Link, Code, Copy, Wifi, Radio, Bluetooth, Globe, Battery, Layers, Monitor, Server, AlertTriangle, BookOpen, Settings, Info, ArrowRight, Zap as ZapIcon, Terminal, Smartphone } from 'lucide-react';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './components/HomeView';
import { BookingView } from './components/BookingView';
import { ChargingSessionView } from './components/ChargingSessionView';
import { GeminiAssistant } from './components/GeminiAssistant';
import { STATIONS } from './constants';
import { Station, Session, UserLocation, ViewState, ChargingMode, Receipt } from './types';

// FIXED C++ SKETCH FOR ILHAMMENCEZ (GROUP 17)
const NODEMCU_SKETCH = (url: string, id: string) => `// ======================================================
// SOLAR SYNERGY: ESP-12E (NodeMCU 1.0) SMART LOCK
// ETP GROUP 17 - PRODUCTION SKETCH v2.7
// ======================================================
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <Servo.h>

// 1. NETWORK CREDENTIALS (SAMSUNG J7)
const char* ssid = "Samsung_J7"; 
const char* pass = "Ilham2005";
const char* serverUrl = "${url}?id=${id}";

Servo myServo;
const int servoPin = 2; // Pin D4 on NodeMCU (GPIO 2)

void setup() {
  Serial.begin(115200);
  delay(10);
  
  // Wi-Fi Connection
  Serial.println("");
  Serial.println("--- SOLAR SYNERGY: STARTING ---");
  WiFi.begin(ssid, pass);
  
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  }
  
  // FIXED STRING CONCATENATION
  Serial.print("\nCONNECTED! IP: ");
  Serial.println(WiFi.localIP());
  
  // Servo Initialization
  myServo.attach(servoPin);
  myServo.write(0); // Defaults to LOCKED
  Serial.println("System Ready: DOCK_LOCKED");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    
    if (http.begin(client, serverUrl)) {
      int httpCode = http.GET();
      if (httpCode > 0) {
        String payload = http.getString();
        Serial.println("Cloud Sync: " + payload);
        
        if (payload.indexOf("UNLOCK") >= 0) {
           Serial.println(">> COMMAND: UNLOCKING");
           myServo.write(90); 
        } else {
           Serial.println(">> COMMAND: LOCKING");
           myServo.write(0);  
        }
      }
      http.end();
    }
  } else {
    Serial.println("WiFi Lost. Reconnecting...");
    WiFi.begin(ssid, pass);
  }
  delay(1500); // Polling interval
}`;

export default function App() {
  const [view, setView] = useState<ViewState>('home'); 
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [walletBalance, setWalletBalance] = useState(50.00);
  const [notification, setNotification] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null); 
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showSketchModal, setShowSketchModal] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  
  const [hardwareMode, setHardwareMode] = useState<'serial' | 'nodemcu'>('nodemcu');
  const [serialPort, setSerialPort] = useState<any>(null);
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);
  const [stationId, setStationId] = useState('ETP_G17_DOCK');
  const [serverUrl, setServerUrl] = useState('https://solar-synergy-api.vercel.app/status');
  const [comboTab, setComboTab] = useState<'guide' | 'code'>('guide');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const connectSerial = async () => {
    try {
      if (!("serial" in navigator)) return showNotification("Web Serial not supported!");
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialPort(port);
      setIsHardwareConnected(true);
      showNotification("Wired Bridge Active 🔌");
    } catch (err) { showNotification("Wired connection failed."); }
  };

  const sendCommand = async (command: 'U' | 'L') => {
    // If using USB Wired mode
    if (hardwareMode === 'serial' && serialPort?.writable) {
      const writer = serialPort.writable.getWriter();
      await writer.write(new TextEncoder().encode(command));
      writer.releaseLock();
    } 
    // If using Cloud Bridge (NodeMCU)
    else {
      showNotification(`Cloud Bridge: Requesting ${command === 'U' ? 'UNLOCK' : 'LOCK'}...`);
      // In a real production app, this would hit: 
      // fetch(`${serverUrl}?id=${stationId}&cmd=${command === 'U' ? 'UNLOCK' : 'LOCK'}`)
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
    sendCommand('L');
    setView('charging');
  };

  const toggleLock = async () => {
    if (!activeSession) return;
    const next = !activeSession.isLocked;
    await sendCommand(next ? 'L' : 'U');
    setActiveSession(prev => prev ? ({ ...prev, isLocked: next }) : null);
  };

  const endSession = (cur = activeSession) => {
    if (!cur) return;
    sendCommand('U');
    setWalletBalance(p => p + (cur.preAuthAmount - cur.cost));
    setReceipt({ stationName: cur.station.name, date: new Date().toLocaleString(), duration: "Session ended", totalEnergy: "2.1kWh", mode: cur.mode, cost: cur.cost, paid: cur.preAuthAmount, refund: cur.preAuthAmount - cur.cost });
    setActiveSession(null);
    setSelectedStation(null);
    setView('home');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
        {notification && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[150] bg-gray-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl text-xs font-black animate-fade-in-down backdrop-blur-sm max-w-sm w-full mx-4 border border-gray-700">
            {notification}
          </div>
        )}
        
        {view !== 'charging' && view !== 'assistant' && (
          <div className="shrink-0 w-full max-w-4xl mx-auto bg-white shadow-sm border-b border-gray-200">
             <Header walletBalance={walletBalance} onProfileClick={() => setView('profile')} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative w-full">
          {view === 'home' && (
            <HomeView userLocation={userLocation} handleLocateMe={() => {}} stations={STATIONS} onBookStation={(s) => { setSelectedStation(s); setView('booking'); }} onPrebook={(s) => { setSelectedStation(s); setView('booking'); }} />
          )}
          
          {view === 'booking' && selectedStation && (
            <BookingView selectedStation={selectedStation} onBack={() => { setView('home'); setSelectedStation(null); }} onStartCharging={startCharging} />
          )}

          {view === 'charging' && (
            <ChargingSessionView activeSession={activeSession} toggleLock={toggleLock} endSession={() => endSession()} isHardwareConnected={hardwareMode === 'nodemcu' || isHardwareConnected} />
          )}
          
          {view === 'profile' && (
            <div className="p-8 flex flex-col items-center max-w-md mx-auto animate-slide-up pb-20">
              <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mt-4">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-100 p-6 rounded-full mb-4 border-4 border-emerald-50"><User size={48} className="text-emerald-600"/></div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Ilhammencez</h2>
                  <p className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-wider">ID: 22003814 • ETP G17</p>
                  
                  <div className="w-full my-6 bg-slate-900 p-6 rounded-[2.5rem] text-white border border-slate-800 shadow-2xl overflow-hidden text-left relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Cpu size={80} />
                    </div>
                    
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="flex items-center gap-2">
                        <Radio size={16} className="text-emerald-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Smart Link Mode</h3>
                      </div>
                      <div className="flex bg-slate-800 p-1 rounded-xl">
                        <button onClick={() => setHardwareMode('serial')} className={`p-2 rounded-lg transition-all ${hardwareMode === 'serial' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}><Link size={14} /></button>
                        <button onClick={() => setHardwareMode('nodemcu')} className={`p-2 rounded-lg transition-all ${hardwareMode === 'nodemcu' ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-500'}`}><Monitor size={14} /></button>
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                      {hardwareMode === 'serial' ? (
                        <button onClick={connectSerial} className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">
                           <Cpu size={14} /> {isHardwareConnected ? 'USB READY' : 'CONNECT VIA USB'}
                        </button>
                      ) : (
                        <div className="space-y-3">
                           <div className="bg-slate-800/50 rounded-2xl p-3 border border-slate-700">
                              <label className="text-[7px] font-black text-slate-500 uppercase block mb-1">Station Network ID</label>
                              <input value={stationId} onChange={e => setStationId(e.target.value.toUpperCase())} className="bg-transparent border-none w-full text-[11px] font-black p-0 focus:ring-0 text-white" />
                           </div>
                           <div className="p-4 bg-cyan-900/20 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]"></div>
                                 <span className="text-[9px] font-black uppercase tracking-tighter text-cyan-400">Synced: Samsung_J7</span>
                              </div>
                              <Globe size={14} className="text-cyan-400 animate-[spin_5s_linear_infinite]" />
                           </div>
                        </div>
                      )}
                      <button onClick={() => setShowSketchModal(true)} className="w-full bg-white/5 text-white py-4 rounded-2xl font-black text-[10px] flex items-center justify-center gap-2 border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-widest">
                        <Terminal size={14} /> Master Implementation Guide
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-gray-50 rounded-[2rem] p-6 border border-gray-100 mb-6 text-left">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Balance</p>
                    <span className="text-4xl font-black text-emerald-600 tracking-tighter tabular-nums">RM {walletBalance.toFixed(2)}</span>
                  </div>

                  <button onClick={() => setShowTopUpModal(true)} className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all">Top Up Wallet</button>
                </div>
              </div>
            </div>
          )}
          {view === 'assistant' && <GeminiAssistant onClose={() => setView('home')} contextData={{ walletBalance, selectedStation }} />}
        </main>

        <NavigationBar view={view} setView={setView} hasActiveSession={!!activeSession} showNotification={showNotification} />

        {showSketchModal && (
          <div className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6" onClick={() => setShowSketchModal(false)}>
            <div className="bg-slate-900 text-white w-full max-w-xl rounded-[3rem] p-8 shadow-2xl relative border border-white/10 flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
               
               <div className="flex justify-between items-start mb-8 shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-2xl"><Cpu size={28} className="text-cyan-400" /></div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tighter">ESP-12E Production Sync</h3>
                      <p className="text-[9px] font-black text-slate-500 tracking-[0.3em] uppercase">ETP 2024 • Ilhammencez G17</p>
                    </div>
                  </div>
                  <button onClick={() => setShowSketchModal(false)} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><X size={24} /></button>
               </div>
               
               <div className="flex mb-8 bg-slate-800/30 p-2 rounded-[2rem] shrink-0 gap-2 border border-white/5">
                  <button onClick={() => setComboTab('guide')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-[1.5rem] transition-all flex items-center justify-center gap-2 ${comboTab === 'guide' ? 'bg-orange-500 text-white shadow-xl shadow-orange-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                    <BookOpen size={16} /> 1. Hardware Guide
                  </button>
                  <button onClick={() => setComboTab('code')} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-[1.5rem] transition-all flex items-center justify-center gap-2 ${comboTab === 'code' ? 'bg-cyan-500 text-white shadow-xl shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Code size={16} /> 2. Corrected Code
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto scrollbar-hide">
                  {comboTab === 'code' ? (
                    <div className="space-y-6">
                      <div className="p-5 bg-cyan-900/10 rounded-[2rem] border border-cyan-500/20">
                         <h4 className="text-[10px] font-black text-cyan-400 uppercase mb-3 flex items-center gap-2"><Smartphone size={14}/> Compilation Fix</h4>
                         <p className="text-[9px] text-slate-400 font-bold uppercase mb-3 leading-tight">I have fixed the "missing terminating character" error. The string is now on one line as required by C++.</p>
                         <ul className="space-y-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> Hotspot: <span className="text-white">Samsung_J7</span></li>
                            <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> Board: <span className="text-white">NodeMCU 1.0 (ESP-12E)</span></li>
                         </ul>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-2">
                           <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">ESP-12E Corrected Sketch</span>
                           <button onClick={() => { 
                              const txt = NODEMCU_SKETCH(serverUrl, stationId);
                              navigator.clipboard.writeText(txt); 
                              showNotification("Fixed Code Copied!"); 
                            }} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 rounded-xl text-white text-[10px] font-black hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-500/20">
                              <Copy size={14} /> COPY SKETCH
                            </button>
                        </div>
                        <div className="bg-black/60 p-6 rounded-[2.5rem] border border-white/5 relative group">
                           <pre className="text-[10px] font-mono leading-relaxed text-emerald-100/70 overflow-x-auto whitespace-pre">
                              {NODEMCU_SKETCH(serverUrl, stationId)}
                           </pre>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-10 pb-8">
                       <div className="bg-slate-950/50 rounded-[2.5rem] p-8 border border-white/5 flex flex-col items-center">
                          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                             <Layers size={16} className="text-orange-400"/> G17 Connection Diagram
                          </p>
                          <svg width="260" height="150" viewBox="0 0 240 140" className="drop-shadow-2xl">
                             <rect x="10" y="10" width="220" height="120" rx="15" fill="#f8fafc" />
                             <line x1="10" y1="70" x2="230" y2="70" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="6" />
                             <rect x="50" y="40" width="140" height="60" rx="8" fill="#1e293b" />
                             <text x="120" y="75" fontSize="11" fill="white" fontWeight="900" textAnchor="middle" opacity="0.9">ESP-12E</text>
                             <circle cx="170" cy="90" r="4" fill="#0ea5e9" className="animate-pulse" /> 
                             <text x="175" y="104" fontSize="10" fill="#0ea5e9" fontWeight="900">D4</text>
                             <circle cx="60" cy="50" r="4" fill="#f43f5e" />
                             <text x="50" y="40" fontSize="10" fill="#f43f5e" fontWeight="900">Vin</text>
                             <circle cx="85" cy="50" r="4" fill="#64748b" />
                             <text x="85" y="40" fontSize="10" fill="#64748b" fontWeight="900">GND</text>
                             <path d="M 170 90 L 170 125 L 210 125" stroke="#f59e0b" strokeWidth="3" fill="none" strokeLinecap="round" />
                             <path d="M 60 50 L 60 25 L 210 25" stroke="#ef4444" strokeWidth="3" fill="none" strokeLinecap="round" />
                             <path d="M 85 50 L 85 35 L 210 35" stroke="#451a03" strokeWidth="3" fill="none" strokeLinecap="round" />
                             <rect x="210" y="20" width="25" height="110" rx="5" fill="#2563eb" />
                             <text x="223" y="75" fontSize="8" fill="white" fontWeight="900" transform="rotate(90, 223, 75)" textAnchor="middle">SERVO</text>
                          </svg>
                          <div className="grid grid-cols-3 gap-4 mt-10 w-full">
                             <div className="bg-white/5 p-3 rounded-2xl flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 mb-2"></div>
                                <span className="text-[8px] font-black uppercase text-slate-400">RED: Vin</span>
                             </div>
                             <div className="bg-white/5 p-3 rounded-2xl flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-amber-900 mb-2"></div>
                                <span className="text-[8px] font-black uppercase text-slate-400">BRN: GND</span>
                             </div>
                             <div className="bg-white/5 p-3 rounded-2xl flex flex-col items-center">
                                <div className="w-3 h-3 rounded-full bg-yellow-400 mb-2"></div>
                                <span className="text-[8px] font-black uppercase text-slate-400">YEL: D4</span>
                             </div>
                          </div>
                       </div>
                       <div className="space-y-8">
                          <h4 className="text-orange-400 font-black text-xs uppercase tracking-[0.2em] flex items-center gap-3">
                             <Terminal size={18}/> 4 Steps to Control
                          </h4>
                          <div className="space-y-6">
                             {[
                               { t: "Wire the Servo", d: "Connect signal to D4 (GPIO 2), Red to Vin (5V), and Brown to GND." },
                               { t: "Upload Fixed Code", d: "Copy the corrected code from Tab 2. It fixes the string error you saw." },
                               { t: "Start Hotspot", d: "Ensure your Samsung_J7 hotspot is active. Watch the Serial Monitor for 'CONNECTED!'." },
                               { t: "Push the Button", d: "Go to the 'Charge' tab in this app and press Unlock. The ESP will receive it in ~1.5 seconds." }
                             ].map((step, i) => (
                               <div key={i} className="flex gap-5">
                                  <div className="w-8 h-8 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-orange-400 shrink-0">{i+1}</div>
                                  <div>
                                     <p className="text-[11px] font-black text-white uppercase mb-1">{step.t}</p>
                                     <p className="text-[10px] leading-relaxed text-slate-400">{step.d}</p>
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        )}
        
        {showTopUpModal && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8" onClick={() => setShowTopUpModal(false)}>
             <div className="bg-white rounded-[3.5rem] p-12 w-full max-w-[360px] text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="bg-emerald-600 p-8 rounded-[3rem] mb-8 shadow-2xl flex items-center justify-center">
                  <div className="bg-white p-3 rounded-3xl relative z-10">
                    <img src="https://lh3.googleusercontent.com/d/1usUmakfqoX6yrVG_BQucVdmQx4jDpxoO" alt="QR" className="w-full aspect-square object-contain" />
                  </div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">Terminal Sync</h3>
             </div>
          </div>
        )}

        {receipt && (
          <div className="fixed inset-0 z-[110] bg-black/70 backdrop-blur-2xl flex items-center justify-center p-6">
             <div className="bg-white w-full max-w-sm rounded-[3.5rem] shadow-2xl p-12 text-center animate-fade-in-down border border-gray-100">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 text-emerald-600"><CheckCircle2 size={48} /></div>
                <h2 className="text-3xl font-black text-gray-900 uppercase mb-2">Success</h2>
                <div className="my-10 bg-gray-50/50 py-8 rounded-[2.5rem] border border-gray-100">
                   <p className="text-6xl font-black text-emerald-600 tracking-tighter">RM {receipt.cost.toFixed(2)}</p>
                </div>
                <button onClick={() => setReceipt(null)} className="w-full bg-gray-900 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all">Hub Dashboard</button>
             </div>
          </div>
        )}
    </div>
  );
}
