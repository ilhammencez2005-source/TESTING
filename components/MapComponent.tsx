
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Station, UserLocation } from '../types';

// Fix for default marker icons in Leaflet with React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Custom Charging Icon
const chargingIcon = new L.DivIcon({
  html: `
    <div class="flex items-center justify-center w-10 h-10 bg-[#10B981] rounded-full border-2 border-white shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 22V8a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v14"></path>
        <path d="M6 6h.01"></path>
        <path d="M7 18H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1"></path>
        <path d="M14 13h.01"></path>
        <path d="M17 16h.01"></path>
      </svg>
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// User Location Icon
const userIcon = new L.DivIcon({
  html: `
    <div class="relative flex items-center justify-center w-6 h-6">
      <div class="absolute w-full h-full bg-blue-500 rounded-full opacity-30 animate-ping"></div>
      <div class="relative w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-sm"></div>
    </div>
  `,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

interface MapComponentProps {
  userLocation: UserLocation | null;
  stations: Station[];
}

const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ userLocation, stations }) => {
  const defaultCenter: [number, number] = [4.3835, 100.9638]; // Village 3C
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  return (
    <div className="w-full h-full">
      <MapContainer 
        center={center} 
        zoom={16} 
        scrollWheelZoom={false}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={center} zoom={16} />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {stations.map(station => {
          const [lat, lng] = station.coordinates.split(',').map(Number);
          return (
            <Marker key={station.id} position={[lat, lng]} icon={chargingIcon}>
              <Popup>
                <div className="p-1">
                  <p className="font-black text-xs uppercase tracking-tight">{station.name}</p>
                  <p className="text-[10px] text-gray-500">{station.address}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
