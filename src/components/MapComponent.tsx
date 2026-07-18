'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMap, LayersControl, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Modern custom marker using Lucide icon styling
const customIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="color: #10b981; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#10b981" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3" fill="white"></circle>
          </svg>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// Component to dynamically re-center map when coordinates change
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
}

interface MapComponentProps {
  targetLat: number;
  targetLng: number;
  radius?: number; // Geofence radius in meters, default 100
}

export default function MapComponent({ targetLat, targetLng, radius = 100 }: MapComponentProps) {
  const center: [number, number] = [targetLat, targetLng];

  return (
    <div className="w-full h-full min-h-[350px] rounded-2xl overflow-hidden border border-border/60 shadow-sm ring-1 ring-black/5 z-10 relative">
      <MapContainer center={center} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer name="Modern Light (CartoDB)">
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer checked name="Street Map (OSM)">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              maxZoom={20}
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* The center marker */}
        <Marker position={center} icon={customIcon} />

        {/* Geofence Target Circle */}
        <Circle 
          center={center} 
          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.15, weight: 2, dashArray: '5, 5' }} 
          radius={radius} 
        />

        <RecenterMap center={center} zoom={16} />
      </MapContainer>
    </div>
  );
}
