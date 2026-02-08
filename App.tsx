
import React, { useState, useEffect, useRef } from 'react';
import { User, CreditCard, X, CheckCircle2, Clock, Calendar, ChevronRight, LockKeyhole, Loader2, History, Zap, Receipt as ReceiptIcon, Cpu, Link, Link2Off } from 'lucide-react';
import { Header } from './components/Header';
import { NavigationBar } from './components/NavigationBar';
import { HomeView } from './components/HomeView';
import { BookingView } from './components/BookingView';
import { ChargingSessionView } from './components/ChargingSessionView';
import { GeminiAssistant } from './components/GeminiAssistant';
import { STATIONS } from './constants';
import { Station, Session, UserLocation, ViewState, ChargingMode, ChargingHistoryItem, Receipt } from './types';

const MOCK_HISTORY: ChargingHistoryItem[] = [
  { id: 101, stationName: "Village 3C", date: "Today, 9:00 AM", amount: 0.00, energy: 2.5, status: 'Completed' },
  { id: 102, stationName: "Village 4", date: "Yesterday, 2:30 PM", amount: 3.60, energy: 3.0, status: 'Completed' },
  { id: 103, stationName: "Village 3C", date: "24 Feb, 10:15 AM", amount: 0.00, energy: 4.1, status: 'Completed' },
];

export default function App() {
  const [view, setView] = useState<ViewState>('home'); 
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [walletBalance, setWalletBalance] = useState(50.00);
  const [notification, setNotification] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null); 
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  
  // Hardware Serial State
  const [serialPort, setSerialPort] = useState<any>(null);
  const [isHardwareConnected, setIsHardwareConnected] = useState(false);

  const [prebookStation, setPrebookStation] = useState<Station | null>(null);
  const [prebookDuration, setPrebookDuration] = useState<number>(5);
  const [prebookStep, setPrebookStep] = useState<'duration' | 'password' | 'processing'>('duration');
  const [prebookPassword, setPrebookPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const connectSerial = async () => {
    try {
      if (!("serial" in navigator)) {
        showNotification("Web Serial not supported in this browser.");
        return;
      }
      // @ts-ignore
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600 });
      setSerialPort(port);
      setIsHardwareConnected(true);
      showNotification("Arduino Connected! 🛠️");
    } catch (err) {
      console.error("Serial Connection Error:", err);
      showNotification("Failed to connect hardware.");
    }
  };

  const sendSerialCommand = async (command: string) => {
    if (serialPort && serialPort.writable) {
      const writer = serialPort.writable.getWriter();
      const data = new TextEncoder().encode(command);
      await writer.write(data);
      writer.releaseLock();
    }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showNotification("Geolocation is not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude, timestamp: Date.now() });
        showNotification("Location found!");
      },
      () => showNotification("Unable to retrieve location.")
    );
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    let interval: any;
    if (activeSession && activeSession.status === 'charging') {
      interval = setInterval(() => {
        setActiveSession(prev => {
          if (!prev) return null;
          
          const isFull = prev.chargeLevel >= 100;
          const durationReached = prev.durationLimit !== 'full' && (prev.timeElapsed / 60) >= prev.durationLimit;
          
          if (isFull || durationReached) {
            endSession(prev);
            return null;
          }

          let newCost = prev.cost;
          if (prev.mode === 'fast') {
            newCost = prev.cost + 0.05; 
          }

          const increment = prev.mode === 'fast' ? 1.5 : 0.5;
          const newLevel = Math.min(prev.chargeLevel + increment, 100);
          
          return {
            ...prev,
            chargeLevel: newLevel,
            cost: newCost,
            timeElapsed: prev.timeElapsed + 1
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.status]);

  const handleBook = (station: Station) => {
    setSelectedStation(station);
    setView('booking');
  };

  const startCharging = (mode: ChargingMode, slotId: string, duration: number | 'full', preAuth: number) => {
    if (!selectedStation) return;
    
    if (preAuth > walletBalance) {
        showNotification("Insufficient wallet balance.");
        return;
    }

    if (preAuth > 0) {
        setWalletBalance(prev => prev - preAuth);
    }

    setActiveSession({
      station: selectedStation,
      mode: mode,
      slotId: slotId,
      startTime: new Date(),
      status: 'charging',
      chargeLevel: 20,
      cost: 0.00,
      preAuthAmount: preAuth,
      durationLimit: duration,
      timeElapsed: 0,
      isLocked: true 
    });
    
    // Initially locked
    sendSerialCommand('L');
    setView('charging');
  };

  const toggleLock = async () => {
    if (!activeSession) return;
    const nextLockedState = !activeSession.isLocked;
    
    // Send physical command to Arduino
    // 'U' for Unlock, 'L' for Lock
    await sendSerialCommand(nextLockedState ? 'L' : 'U');

    setActiveSession(prev => prev ? ({ ...prev, isLocked: nextLockedState }) : null);
    showNotification(nextLockedState ? "Hardware Locked 🔒" : "Hardware Unlocked 🔓");
  };

  const endSession = (currentSession = activeSession) => {
    if (!currentSession) return;
    
    // Ensure unlocked on end
    sendSerialCommand('U');

    const actualCost = currentSession.cost;
    const paid = currentSession.preAuthAmount;
    const refund = Math.max(0, paid - actualCost);

    if (refund > 0) {
        setWalletBalance(prev => prev + refund);
    }

    setReceipt({
        stationName: currentSession.station.name,
        date: new Date().toLocaleString(),
        duration: `${Math.floor(currentSession.timeElapsed / 60)} mins`,
        totalEnergy: `${(currentSession.chargeLevel * 0.5).toFixed(1)} kWh`,
        mode: currentSession.mode,
        cost: actualCost,
        paid: paid,
        refund: refund
    });

    setActiveSession(null);
    setSelectedStation(null);
    setView('home');
  };

  const handlePrebookClick = (station: Station) => {
    if (station.slots > 0) {
        setPrebookStation(station);
        setPrebookStep('duration');
    } else {
        showNotification("No slots available.");
    }
  };

  const confirmPrebook = () => {
    if (prebookPassword === '0000') {
        setPrebookStep('processing');
        setTimeout(() => {
            if (prebookStation) {
                const cost = prebookDuration === 5 ? 0 : (prebookDuration === 15 ? 2.00 : 5.00);
                if (walletBalance >= cost) {
                    setWalletBalance(prev => prev - cost);
                    showNotification(`Confirmed! Slot reserved.`);
                    setPrebookStation(null);
                } else {
                    showNotification("Insufficient balance.");
                    setPrebookStep('password');
                }
            }
        }, 1500);
    } else {
        setPasswordError(true);
        setTimeout(() => setPasswordError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 text-gray-900 font-sans overflow-hidden">
        {notification && (
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[60] bg-gray-900/90 text-white px-6 py-3 rounded-2xl shadow-2xl text-center text-sm font-medium animate-fade-in-down backdrop-blur-sm max-w-sm w-full mx-4 border border-gray-700">
            {notification}
          </div>
        )}
        
        {view !== 'charging' && view !== 'assistant' && (
          <div className="shrink-0 w-full max-w-4xl mx-auto bg-white shadow-sm border-b border-gray-200 lg:rounded-b-2xl">
             <Header walletBalance={walletBalance} onProfileClick={() => setView('profile')} />
          </div>
        )}

        <main className="flex-1 overflow-y-auto relative w-full">
          {view === 'home' && (
            <HomeView 
              userLocation={userLocation} 
              handleLocateMe={handleLocateMe}
              stations={STATIONS}
              onBookStation={handleBook}
              onPrebook={handlePrebookClick}
            />
          )}
          {view === 'booking' && selectedStation && (
            <BookingView 
              selectedStation={selectedStation}
              onBack={() => setView('home')}
              onStartCharging={startCharging}
            />
          )}
          {view === 'charging' && (
            <div className="h-full flex flex-col justify-center">
                <ChargingSessionView 
                  activeSession={activeSession}
                  toggleLock={toggleLock}
                  endSession={() => endSession(activeSession)}
                  isHardwareConnected={isHardwareConnected}
                />
            </div>
          )}
          {view === 'profile' && (
            <div className="p-8 flex flex-col items-center justify-start h-full max-w-md mx-auto animate-slide-up pb-20">
              <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mt-4">
                <div className="flex flex-col items-center">
                  <div className="bg-emerald-100 p-6 rounded-full mb-4 border-4 border-emerald-50">
                    <User size={48} className="text-emerald-600"/>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">ILHAMMENCEZ</h2>
                  <p className="text-sm text-gray-500 mb-6">Student ID: 22003814</p>
                  
                  {/* Hardware Integration Section */}
                  <div className="w-full mb-6 bg-slate-900 p-5 rounded-2xl text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Cpu size={18} className="text-emerald-400" />
                        <h3 className="text-sm font-bold uppercase tracking-widest">Hardware Bridge</h3>
                      </div>
                      {isHardwareConnected ? <Link size={16} className="text-emerald-400" /> : <Link2Off size={16} className="text-red-400" />}
                    </div>
                    
                    <p className="text-[10px] text-slate-400 font-medium mb-4 leading-relaxed">
                      Sync your device with a physical charging dock to enable hardware lock/unlock features.
                    </p>

                    {!isHardwareConnected ? (
                      <button 
                        onClick={connectSerial}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2"
                      >
                        <Cpu size={14} />
                        CONNECT ARDUINO
                      </button>
                    ) : (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400">ACTIVE BRIDGE</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      </div>
                    )}
                  </div>

                  <div className="w-full bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Wallet Balance</p>
                    <div className="flex justify-between items-end">
                       <span className="text-3xl font-bold text-emerald-600">RM {walletBalance.toFixed(2)}</span>
                       <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md mb-1">ACTIVE</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowTopUpModal(true)}
                    className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 flex items-center justify-center gap-2 mb-8"
                  >
                    <CreditCard size={20} />
                    Top Up Wallet
                  </button>

                  <div className="w-full">
                     <div className="flex items-center gap-2 mb-4">
                        <History size={18} className="text-gray-400" />
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Recent Activity</h3>
                     </div>
                     <div className="space-y-3">
                        {MOCK_HISTORY.map(item => (
                           <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-lg ${item.amount > 0 ? 'bg-yellow-100 text-yellow-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <Zap size={16} fill="currentColor" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-gray-900">{item.stationName}</p>
                                    <p className="text-xs text-gray-500">{item.date}</p>
                                 </div>
                              </div>
                              <div className="text-right font-bold text-sm">
                                 {item.amount > 0 ? `- RM ${item.amount.toFixed(2)}` : 'FREE'}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {view === 'assistant' && (
            <GeminiAssistant 
              onClose={() => setView('home')} 
              contextData={{ walletBalance, selectedStation }}
            />
          )}
        </main>

        <div className="shrink-0 z-50 bg-white border-t border-gray-200">
            <div className="max-w-2xl mx-auto">
                <NavigationBar 
                    view={view} 
                    setView={setView} 
                    hasActiveSession={!!activeSession}
                    showNotification={showNotification}
                />
            </div>
        </div>

        {prebookStation && (
            <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in-down" onClick={() => setPrebookStation(null)}>
                <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Prebook Slot</h3>
                            <p className="text-sm text-emerald-600 font-medium">{prebookStation.name}</p>
                        </div>
                        <button onClick={() => setPrebookStation(null)} className="p-2 bg-gray-100 rounded-full">
                            <X size={20} className="text-gray-600" />
                        </button>
                    </div>

                    {prebookStep === 'duration' ? (
                        <>
                            <div className="grid grid-cols-3 gap-3">
                                {[5, 15, 30].map((duration) => (
                                    <button 
                                        key={duration}
                                        onClick={() => setPrebookDuration(duration)}
                                        className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                                            prebookDuration === duration 
                                            ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                                            : 'border-gray-100 bg-white text-gray-500'
                                        }`}
                                    >
                                        <Clock size={24} className="mb-2" />
                                        <span className="text-lg font-bold">{duration}</span>
                                        <span className="text-[10px] font-bold uppercase">Mins</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setPrebookStep('password')} className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold">
                                Continue
                            </button>
                        </>
                    ) : prebookStep === 'password' ? (
                        <>
                             <div className="space-y-4">
                                <p className="text-sm text-gray-600 font-medium text-center">Enter Password (0000)</p>
                                <div className="flex justify-center">
                                    <input 
                                        type="password" 
                                        value={prebookPassword}
                                        onChange={(e) => setPrebookPassword(e.target.value)}
                                        className={`bg-gray-100 p-3 rounded-xl border-2 text-center text-xl font-bold tracking-widest ${passwordError ? 'border-red-400' : 'border-transparent'}`}
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setPrebookStep('duration')} className="flex-1 bg-gray-100 py-4 rounded-2xl font-bold">Back</button>
                                <button onClick={confirmPrebook} className="flex-[2] bg-emerald-600 text-white py-4 rounded-2xl font-bold">Confirm</button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center py-8">
                            <Loader2 size={48} className="text-emerald-600 animate-spin" />
                        </div>
                    )}
                </div>
            </div>
        )}

        {showTopUpModal && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowTopUpModal(false)}>
             <div className="rounded-[2.5rem] w-full max-w-[320px] shadow-2xl relative overflow-hidden bg-white" onClick={e => e.stopPropagation()}>
                <div className="bg-[#D9305C] p-8 flex flex-col items-center">
                    <div className="bg-white p-3 rounded-[1.5rem] w-full aspect-square flex items-center justify-center shadow-lg mb-6">
                       <img src="https://lh3.googleusercontent.com/d/1usUmakfqoX6yrVG_BQucVdmQx4jDpxoO" alt="QR" className="w-full h-full object-contain" />
                    </div>
                </div>
                <div className="p-4 text-center">
                   <p className="text-lg font-bold text-gray-800">Scan to Top Up</p>
                </div>
             </div>
          </div>
        )}

        {receipt && (
          <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-down">
             <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-emerald-600 p-6 text-center text-white">
                    <CheckCircle2 size={48} className="mx-auto mb-3" />
                    <h2 className="text-2xl font-bold">Payment Success</h2>
                    <p className="text-emerald-100 text-sm">{receipt.date}</p>
                </div>
                <div className="p-6">
                    <div className="text-center mb-6 border-b border-dashed border-gray-200 pb-6">
                        <p className="text-4xl font-bold text-gray-900">RM {receipt.cost.toFixed(2)}</p>
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-bold">{receipt.duration}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Energy</span><span className="font-bold">{receipt.totalEnergy}</span></div>
                    </div>
                    <div className="mt-6 bg-gray-50 p-4 rounded-xl space-y-2 text-sm border border-gray-100">
                         <div className="flex justify-between"><span>Paid</span><span className="font-bold">RM {receipt.paid.toFixed(2)}</span></div>
                        <div className="flex justify-between text-emerald-600 font-bold"><span>Refunded</span><span>RM {receipt.refund.toFixed(2)}</span></div>
                    </div>
                    <button onClick={() => setReceipt(null)} className="w-full mt-6 bg-gray-900 text-white py-3.5 rounded-xl font-bold">Close</button>
                </div>
             </div>
          </div>
        )}
    </div>
  );
}
