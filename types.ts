
export interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Station {
  id: number;
  name: string;
  address: string;
  distance: string;
  slots: number;
  totalSlots: number;
  type: string;
  status: 'Active' | 'Occupied';
  coordinates: string;
  operatingHours: string;
  reviews: Review[];
  features: string[];
}

export type ChargingMode = 'fast' | 'normal';

export interface Session {
  station: Station;
  mode: ChargingMode;
  slotId: string;
  startTime: Date;
  status: 'charging' | 'completed';
  chargeLevel: number;
  cost: number;
  preAuthAmount: number;
  durationLimit: number | 'full'; 
  timeElapsed: number;
  isLocked: boolean;
}

export interface UserLocation {
  lat: number;
  lng: number;
  timestamp?: number;
}

export interface ChargingHistoryItem {
  id: number;
  stationName: string;
  date: string;
  amount: number;
  energy: number;
  status: 'Completed';
}

export interface Receipt {
  stationName: string;
  date: string;
  duration: string;
  totalEnergy: string;
  mode: ChargingMode;
  cost: number;
  paid: number;
  refund: number;
}

export type ViewState = 'home' | 'booking' | 'charging' | 'assistant' | 'profile' | 'history';

export interface ContextData {
  walletBalance: number;
  selectedStation: Station | null;
}

export interface Message {
  role: 'user' | 'model';
  text: string;
}
