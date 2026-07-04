'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths issue in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically re-center map when coordinates change
function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
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
    <div className="w-full h-full min-h-[300px] rounded-lg overflow-hidden border border-border/80 shadow-inner z-10 relative">
      <MapContainer center={center} zoom={16} scrollWheelZoom={true} style={{ height: '100%', width: '100%', zIndex: 1 }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Standard Map">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        {/* Geofence Target Circle */}
        <Circle 
          center={center} 
          pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.1, weight: 2, dashArray: '5, 5' }} 
          radius={radius} 
        >
          <Popup>Classroom Target Geofence Center (Radius: {radius}m)</Popup>
        </Circle>


        <RecenterMap center={center} zoom={16} />
      </MapContainer>
    </div>
  );
}
