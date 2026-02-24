
import React, { useState, useEffect } from 'react';
import { User, CheckCircle2, Zap as ZapIcon, Power, History, Loader2, ShieldCheck, Clock } from 'lucide-react';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './components/HomeView';
import { BookingView } from './components/BookingView';
import { ChargingSessionView } from './components/ChargingSessionView';
import { GeminiAssistant } from './components/GeminiAssistant';
import { HistoryView } from './components/HistoryView';
import { ProfileView } from './components/ProfileView';
import { STATIONS } from './constants';
import { Station, Session, UserLocation, ViewState, ChargingMode, Receipt, ChargingHistoryItem } from './types';

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

export default function App() {
  const [view, setView] = useState<ViewState>('home'); 
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [walletBalance, setWalletBalance] = useState(50.00);
  const [notification, setNotification] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null); 
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [chargingHistory, setChargingHistory] = useState<ChargingHistoryItem[]>([]);
  
  const [stations, setStations] = useState<Station[]>(STATIONS);
  const [bleDevice, setBleDevice] = useState<any | null>(null);
  const [bleCharacteristic, setBleCharacteristic] = useState<any | null>(null);
  const [isBleConnecting, setIsBleConnecting] = useState(false);

  const handleOccupancyUpdate = (event: any) => {
    const value = new TextDecoder().decode(event.target.value);
    console.log("BLE Notification Received:", value);
    
    if (value.includes("OCCUPIED") || value.includes("AVAILABLE")) {
      const isOccupied = value.includes("OCCUPIED");
      setStations(prev => prev.map(s => {
        if (s.name === "Village 4") {
          return {
            ...s,
            status: isOccupied ? "Occupied" : "Active",
            slots: isOccupied ? 0 : 1
          };
        }
        return s;
      }));
      showNotification(isOccupied ? "VILLAGE 4 PORT OCCUPIED" : "VILLAGE 4 PORT AVAILABLE");
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const connectBluetooth = async () => {
    if (!(navigator as any).bluetooth) {
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      showNotification(isIOS ? "USE BLUEFY APP ON IOS" : "BROWSER NOT SUPPORTED");
      return;
    }

    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      showNotification("HTTPS REQUIRED FOR BT");
      return;
    }

    setIsBleConnecting(true);
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ name: 'SolarSynergyHub' }],
        optionalServices: [SERVICE_UUID]
      });
      
      const server = await device.gatt?.connect();
      const service = await server?.getPrimaryService(SERVICE_UUID);
      const characteristic = await service?.getCharacteristic(CHARACTERISTIC_UUID);
      
      if (characteristic) {
        setBleDevice(device);
        setBleCharacteristic(characteristic);
        
        // Enable Notifications for IR Sensor
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', handleOccupancyUpdate);
        
        showNotification("HUB PAIRED SUCCESSFULLY");
        
        device.addEventListener('gattserverdisconnected', () => {
          setBleDevice(null);
          setBleCharacteristic(null);
          showNotification("HUB DISCONNECTED");
        });
      }
    } catch (error: any) {
      console.error("BLE Error Detail:", error);
      if (error.name === 'NotFoundError') {
        showNotification("DEVICE NOT FOUND/CANCELLED");
      } else if (error.name === 'SecurityError') {
        showNotification("SECURITY BLOCK (USE HTTPS)");
      } else if (error.name === 'NotAllowedError') {
        showNotification("BT PERMISSION DENIED");
      } else {
        showNotification(`BT FAIL: ${error.message?.substring(0, 15) || "UNKNOWN"}`);
      }
    } finally {
      setIsBleConnecting(false);
    }
  };

  const disconnectBluetooth = () => {
    if (bleDevice?.gatt?.connected) bleDevice.gatt.disconnect();
    setBleDevice(null);
    setBleCharacteristic(null);
  };

  const sendBleCommand = async (command: 'UNLOCK' | 'LOCK') => {
    if (!bleCharacteristic || !bleDevice?.gatt?.connected) {
      showNotification("HUB NOT CONNECTED");
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(command);
      
      if (bleCharacteristic.writeValueWithResponse) {
        await bleCharacteristic.writeValueWithResponse(data);
      } else {
        await bleCharacteristic.writeValue(data);
      }
      
      return true;
    } catch (error: any) {
      console.error("BLE Write Error:", error);
      
      if (error.message?.includes('GATT operation already in progress')) {
        showNotification("COMMAND IN PROGRESS...");
      } else {
        showNotification("HARDWARE CMD FAILED");
      }
      return false;
    }
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLocation({ 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude, 
            timestamp: Date.now() 
          });
        },
        (err) => console.error("Location Error:", err),
        { enableHighAccuracy: true }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (activeSession && activeSession.status === 'charging') {
      interval = setInterval(() => {
        setActiveSession(prev => {
          if (!prev) return null;
          
          const increment = prev.mode === 'fast' ? 1.5 : 0.8;
          const newLevel = prev.chargeLevel + increment;
          
          if (newLevel >= 100) { 
            endSession(prev); 
            return null; 
          }
          
          const costInc = prev.mode === 'fast' ? 0.05 : 0.01;
          return { ...prev, chargeLevel: Math.min(newLevel, 100), cost: prev.cost + costInc, timeElapsed: prev.timeElapsed + 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const startCharging = async (mode: ChargingMode, slotId: string, duration: number | 'full', preAuth: number) => {
    if (preAuth > walletBalance) return showNotification("INSUFFICIENT CREDITS");
    
    const locked = await sendBleCommand('LOCK');
    if (!locked && bleCharacteristic) {
      showNotification("WARNING: HUB FAILED TO LOCK");
    }
    
    setWalletBalance(p => p - preAuth);
    setActiveSession({ 
      station: selectedStation!, 
      mode, slotId, startTime: new Date(), status: 'charging', chargeLevel: 24, cost: 0, preAuthAmount: preAuth, durationLimit: duration, timeElapsed: 0, 
      isLocked: true 
    });
    setView('charging');
  };

  const endSession = async (cur = activeSession) => {
    if (!cur) return;
    
    await sendBleCommand('UNLOCK');

    const refund = cur.preAuthAmount - cur.cost;
    const energy = cur.cost > 0 ? cur.cost / 1.2 : 4.5; 
    setWalletBalance(p => p + refund);
    
    const historyItem: ChargingHistoryItem = {
      id: Date.now(),
      stationName: cur.station.name,
      date: new Date().toLocaleString(),
      amount: cur.cost,
      energy: energy,
      status: 'Completed'
    };
    
    setChargingHistory(prev => [historyItem, ...prev]);
    setReceipt({ 
      stationName: cur.station.name, 
      date: new Date().toLocaleString(), 
      duration: `${Math.floor(cur.timeElapsed / 60)}m`, 
      totalEnergy: `${energy.toFixed(2)}kWh`, 
      mode: cur.mode, 
      cost: cur.cost, 
      paid: cur.preAuthAmount, 
      refund: refund 
    });
    
    setActiveSession(null); 
    setSelectedStation(null); 
    setView('home');
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
              handleLocateMe={() => {}} 
              stations={stations} 
              onBookStation={(s) => { setSelectedStation(s); setView('booking'); }} 
              onPrebook={(s) => { setSelectedStation(s); setView('booking'); }} 
            />
          )}
          {view === 'booking' && selectedStation && (
            <BookingView selectedStation={selectedStation} onBack={() => { setView('home'); setSelectedStation(null); }} onStartCharging={startCharging} />
          )}
          {view === 'charging' && (
            <ChargingSessionView 
              activeSession={activeSession} 
              toggleLock={() => {}} 
              endSession={() => endSession()} 
              isBleConnected={!!bleCharacteristic}
              isBleConnecting={isBleConnecting}
              onConnectBle={connectBluetooth}
            />
          )}
          {view === 'history' && <HistoryView history={chargingHistory} onClearHistory={() => setChargingHistory([])} />}
          {view === 'profile' && (
            <ProfileView 
              walletBalance={walletBalance} 
              isBleConnected={!!bleCharacteristic}
              isBleConnecting={isBleConnecting}
              bleDeviceName={bleDevice?.name}
              onConnectBle={connectBluetooth}
              onDisconnectBle={disconnectBluetooth}
              onTestCommand={sendBleCommand}
            />
          )}
          {view === 'assistant' && (
            <GeminiAssistant 
              onClose={() => setView('home')} 
              contextData={{ walletBalance, selectedStation, userLocation }} 
            />
          )}
        </main>

        <NavigationBar view={view} setView={setView} hasActiveSession={!!activeSession} showNotification={showNotification} />

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
