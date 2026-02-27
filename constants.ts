
import { Station, ChargingHistoryItem } from './types';

export const STATIONS: Station[] = [
  { 
    id: 1, 
    name: "Village 3", 
    address: "9XP8+RH, 31750, Perak", 
    distance: "120m", 
    slots: 2, 
    totalSlots: 2,
    type: "Type 2 (22.0kW)",
    status: "Active",
    coordinates: "4.3835,100.9638",
    operatingHours: "24/7",
    features: ["Sheltered", "Solar Powered", "Nearby Cafe"],
    reviews: [
      { id: 1, user: "Dr. Azlan", rating: 5, comment: "Super fast charging! The solar canopy is a nice touch.", date: "2 days ago" },
      { id: 2, user: "Dr. Yit", rating: 4, comment: "Good location, but sometimes crowded during lunch.", date: "1 week ago" }
    ]
  },
  { 
    id: 2, 
    name: "Village 4", 
    address: "9XQ8+48 Bota, Perak",
    distance: "450m", 
    slots: 0, 
    totalSlots: 2,
    type: "Type 2 (11.0kW)",
    status: "Occupied",
    coordinates: "4.3852,100.9702",
    operatingHours: "7:00 AM - 11:00 PM",
    features: ["Security Guard", "Vending Machine"],
    reviews: [
      { id: 1, user: "Dr. Azlan", rating: 5, comment: "Very convenient for V4 residents.", date: "3 days ago" },
      { id: 2, user: "Dr. Yit", rating: 3, comment: "One port was under maintenance last time.", date: "2 weeks ago" }
    ]
  },
];

export const PRICING = {
  fast: 1.20, // RM per kWh (Turbo Charge)
  normal: 0,   // Free (Eco Charge)
};
