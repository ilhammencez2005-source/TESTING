
import React, { useState, useEffect } from 'react';
import { User, X, CheckCircle2, Cpu, Link, Code, Copy, Wifi, Radio, Bluetooth, Globe } from 'lucide-react';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './components/HomeView';
import { BookingView } from './components/BookingView';
import { ChargingSessionView } from './components/ChargingSessionView';
import { GeminiAssistant } from './components/GeminiAssistant';
import { STATIONS } from './constants';
import { Station, Session, UserLocation, ViewState, ChargingMode, Receipt } from './types';

const ARDUINO_SKETCH = `// WIRED VERSION (USB SERIAL)
#include <Servo.h>

Servo myServo;
const int redLed = 4;
const int greenLed = 5;

void setup() {
  Serial.begin(9600);
  myServo.attach(9);
  pinMode(redLed, OUTPUT);
  pinMode(greenLed, OUTPUT);
  
  // Initial State: Locked
  myServo.write(0);
  digitalWrite(redLed, HIGH);
  digitalWrite(greenLed, LOW);
}

void loop() {
  if (Serial.available() > 0) {
    char c = Serial.read();
    if (c == 'U') {
      myServo.write(90);
      digitalWrite(greenLed, HIGH);
      digitalWrite(redLed, LOW);
    } else if (c == 'L') {
      myServo.write(0);
      digitalWrite(redLed, HIGH);
      digitalWrite(greenLed, LOW);
    }
  }
}`;

const BLUETOOTH_SKETCH = `// BLUETOOTH VERSION (HM-10 BLE)
#include <SoftwareSerial.h>
#include <Servo.h>

SoftwareSerial ble(2, 3); // RX, TX
Servo myServo;
const int redLed = 4;
const int greenLed = 5;

void setup() {
  ble.begin(9600);
  myServo.attach(9);
  pinMode(redLed, OUTPUT);
  pinMode(greenLed, OUTPUT);
  
  myServo.write(0);
  digitalWrite(redLed, HIGH);
  digitalWrite(greenLed, LOW);
}

void loop() {
  if (ble.available() > 0) {
    char c = ble.read();
    if (c == 'U') {
      myServo.write(90);
      digitalWrite(greenLed, HIGH);
      digitalWrite(redLed, LOW);
    } else if (c == 'L') {
      myServo.write(0);
      digitalWrite(redLed, HIGH);
      digitalWrite(greenLed, LOW);
    }
  }
}`;

const ESP32_SKETCH = `// WIRELESS VERSION (ESP32 Wi-Fi)
#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>

const char* ssid = "YOUR_WIFI";
const char* pass = "YOUR_PASS";
const char* url = "https://your-api.com/status?id=DOCK_001";

Servo s;
const int redLed = 4;
const int greenLed = 2; // On-board LED usually

void setup() {
  WiFi.begin(ssid, pass);
  s.attach(18);
  pinMode(redLed, OUTPUT);
  pinMode(greenLed, OUTPUT);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(url);
    if (http.GET() > 0) {
      String res = http.getString();
      if (res == "UNLOCK") {
        s.write(90);
        digitalWrite(greenLed, HIGH);
        digitalWrite(redLed, LOW);
      } else {
        s.write(0);
        digitalWrite(redLed, HIGH);
        digitalWrite(greenLed, LOW);
      }
    }
    http.end();
  }
  delay(1000);
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
  
  // Hardware States
  const [hardwareMode, setHardwareMode] = useState<'serial' | 'remote' | 'bluetooth'>('serial');
  const [serialPort, setSerialPort] = useState<any>(null);
  const [bleCharacteristic, setBleCharacteristic] = useState<any>(null);
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);
  const [stationId, setStationId] = useState('DOCK_001');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const connectSerial = async () => {
    try {
      if (!("serial" in navigator)) return showNotification("Web Serial not supported!");
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialPort(port);
      setIsHardwareConnected(true);
      showNotification("Wired Bridge Active 🔌");
    } catch (err) { showNotification("Wired connection failed."); }
  };

  const connectBluetooth = async () => {
    try {
      // @ts-ignore
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
      const char = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');
      setBleCharacteristic(char);
      setIsHardwareConnected(true);
      showNotification("Bluetooth Connected 📲");
    } catch (err) { showNotification("Bluetooth pairing failed."); }
  };

  const sendCommand = async (command: 'U' | 'L') => {
    if (hardwareMode === 'serial' && serialPort?.writable) {
      const writer = serialPort.writable.getWriter();
      await writer.write(new TextEncoder().encode(command));
      writer.releaseLock();
    } else if (hardwareMode === 'bluetooth' && bleCharacteristic) {
      await bleCharacteristic.writeValue(new TextEncoder().encode(command));
    } else if (hardwareMode === 'remote') {
      showNotification(`Cloud Signal: ${command === 'U' ? 'Unlocking' : 'Locking'}...`);
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) return showNotification("GPS not supported");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, timestamp: Date.now() });
        showNotification("Location found!");
      },
      () => showNotification("Unable to find location.")
    );
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

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
    setView('booking');
  };

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
            <HomeView 
              userLocation={userLocation} 
              handleLocateMe={handleLocateMe} 
              stations={STATIONS} 
              onBookStation={handleSelectStation} 
              onPrebook={(s) => { setSelectedStation(s); setView('booking'); }} 
            />
          )}
          
          {view === 'booking' && selectedStation && (
            <BookingView 
              selectedStation={selectedStation} 
              onBack={() => { setView('home'); setSelectedStation(null); }} 
              onStartCharging={startCharging} 
            />
          )}

          {view === 'charging' && (
            <ChargingSessionView 
              activeSession={activeSession} 
              toggleLock={toggleLock} 
              endSession={() => endSession()} 
              isHardwareConnected={isHardwareConnected || hardwareMode === 'remote'} 
            />
          )}
          
          {view === 'profile' && (
            <div className="p-8 flex flex-col items-center max-w-md mx-auto animate-slide-up pb-20">
              <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mt-4">
                <div className="flex flex-col items-center text-center">
                  <div className="bg-emerald-100 p-6 rounded-full mb-4 border-4 border-emerald-50"><User size={48} className="text-emerald-600"/></div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Ilhammencez</h2>
                  <p className="text-[10px] font-black text-gray-400 mb-6 uppercase">ID: 22003814 • ETP G17</p>
                  
                  <div className="w-full mb-6 bg-slate-900 p-5 rounded-2xl text-white border border-slate-800 shadow-xl overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Radio size={16} className="text-emerald-400" />
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-100">Smart Bridge</h3>
                      </div>
                      <div className="flex bg-slate-800 p-1 rounded-lg">
                        <button onClick={() => { setHardwareMode('serial'); setIsHardwareConnected(!!serialPort); }} className={`p-1.5 rounded transition-all ${hardwareMode === 'serial' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}><Link size={14} /></button>
                        <button onClick={() => { setHardwareMode('bluetooth'); setIsHardwareConnected(!!bleCharacteristic); }} className={`p-1.5 rounded transition-all ${hardwareMode === 'bluetooth' ? 'bg-blue-500 text-white' : 'text-slate-500'}`}><Bluetooth size={14} /></button>
                        <button onClick={() => { setHardwareMode('remote'); setIsHardwareConnected(true); }} className={`p-1.5 rounded transition-all ${hardwareMode === 'remote' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}><Wifi size={14} /></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {hardwareMode === 'serial' && (
                        <button onClick={connectSerial} className="w-full bg-emerald-500 text-white py-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-2">
                           <Cpu size={14} /> {isHardwareConnected && hardwareMode === 'serial' ? 'CONNECTED' : 'PAIR ARDUINO'}
                        </button>
                      )}
                      {hardwareMode === 'bluetooth' && (
                        <button onClick={connectBluetooth} className="w-full bg-blue-500 text-white py-2.5 rounded-xl font-black text-[10px] flex items-center justify-center gap-2">
                           <Bluetooth size={14} /> {isHardwareConnected && hardwareMode === 'bluetooth' ? 'CONNECTED' : 'PAIR HM-10'}
                        </button>
                      )}
                      {hardwareMode === 'remote' && (
                        <div className="space-y-2">
                           <input value={stationId} onChange={e => setStationId(e.target.value.toUpperCase())} placeholder="STATION ID" className="bg-slate-800 border-none rounded-xl text-[10px] font-black p-2.5 w-full text-white focus:ring-1 focus:ring-emerald-500" />
                           <div className="bg-orange-900/20 border border-orange-500/20 p-2.5 rounded-xl flex items-center justify-between">
                              <span className="text-[10px] font-black text-orange-400 uppercase tracking-tighter">Remote Bridge Active</span>
                              <Globe size={14} className="text-orange-400 animate-[spin_5s_linear_infinite]" />
                           </div>
                        </div>
                      )}
                      <button onClick={() => setShowSketchModal(true)} className="w-full bg-slate-800 text-slate-300 py-2 rounded-xl font-black text-[9px] flex items-center justify-center gap-2 border border-slate-700 hover:bg-slate-700 transition-colors">
                        <Code size={12} /> GET C++ SKETCH
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Balance</p>
                    <span className="text-3xl font-black text-emerald-600 tracking-tighter">RM {walletBalance.toFixed(2)}</span>
                  </div>

                  <button onClick={() => setShowTopUpModal(true)} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all">Top Up Wallet</button>
                </div>
              </div>
            </div>
          )}
          {view === 'assistant' && <GeminiAssistant onClose={() => setView('home')} contextData={{ walletBalance, selectedStation }} />}
        </main>

        <NavigationBar view={view} setView={setView} hasActiveSession={!!activeSession} showNotification={showNotification} />

        {showSketchModal && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowSketchModal(false)}>
            <div className="bg-slate-900 text-white w-full max-w-lg rounded-3xl p-6 shadow-2xl relative border border-slate-700 flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="text-sm font-black uppercase tracking-widest">{hardwareMode} Sketch (w/ LEDs)</h3>
                  <button onClick={() => setShowSketchModal(false)} className="text-slate-400 hover:text-white transition-colors"><X size={24} /></button>
               </div>
               <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 relative group overflow-y-auto scrollbar-hide flex-1">
                  <pre className="text-[10px] font-mono leading-relaxed text-emerald-100/80">
                    {hardwareMode === 'serial' ? ARDUINO_SKETCH : hardwareMode === 'bluetooth' ? BLUETOOTH_SKETCH : ESP32_SKETCH}
                  </pre>
                  <button onClick={() => { navigator.clipboard.writeText(hardwareMode === 'serial' ? ARDUINO_SKETCH : hardwareMode === 'bluetooth' ? BLUETOOTH_SKETCH : ESP32_SKETCH); showNotification("Sketch Copied!"); }} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-lg text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Copy size={16} />
                  </button>
               </div>
               <div className="mt-4 bg-slate-800/50 p-3 rounded-xl border border-slate-700 shrink-0">
                  <p className="text-[9px] text-emerald-400 uppercase font-black mb-1">Hardware Setup:</p>
                  <p className="text-[9px] text-slate-400 leading-tight font-bold uppercase tracking-tighter">
                    • Servo Signal: D9 (Arduino) / D18 (ESP32)<br/>
                    • Red LED: D4 (Locked State)<br/>
                    • Green LED: D5 (Unlocked State)<br/>
                    • BT RX/TX: D2/D3 (HM-10 ONLY)
                  </p>
               </div>
            </div>
          </div>
        )}
        
        {showTopUpModal && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowTopUpModal(false)}>
             <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-[320px] text-center transform transition-all animate-fade-in-down" onClick={e => e.stopPropagation()}>
                <div className="bg-[#D9305C] p-6 rounded-[1.5rem] mb-4">
                  <img src="https://lh3.googleusercontent.com/d/1usUmakfqoX6yrVG_BQucVdmQx4jDpxoO" alt="QR" className="w-full aspect-square object-contain" />
                </div>
                <p className="text-sm font-black text-gray-800 uppercase tracking-widest leading-none mb-1">MAE/GrabPay Terminal</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">UTP STUDENT MERCHANT</p>
             </div>
          </div>
        )}

        {receipt && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
             <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center animate-fade-in-down">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                   <CheckCircle2 size={36} />
                </div>
                <h2 className="text-xl font-black tracking-tighter text-gray-900 uppercase">Transaction Success</h2>
                <div className="my-6">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Charge</p>
                   <p className="text-5xl font-black text-emerald-600 tracking-tighter">RM {receipt.cost.toFixed(2)}</p>
                </div>
                <button onClick={() => setReceipt(null)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-colors shadow-lg">Close Receipt</button>
             </div>
          </div>
        )}
    </div>
  );
}
