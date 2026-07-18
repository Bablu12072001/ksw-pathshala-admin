'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Modern custom marker using Lucide icon styling
const customIcon = L.divIcon({
  className: 'custom-leaflet-marker',
  html: `<div style="color: #4f46e5; filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#4f46e5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3" fill="white"></circle>
          </svg>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

interface MapComponentProps {
  latitude: string;
  longitude: string;
  onLocationSelect: (lat: string, lng: string) => void;
}

function SearchField({ setPosition }: { setPosition: (pos: L.LatLng) => void }) {
  const map = useMap();
  useEffect(() => {
    // Check if control already exists
    if (document.querySelector('.leaflet-control-geosearch')) return;

    const provider = new OpenStreetMapProvider({
      params: { countrycodes: 'in' } // Constrain to India
    });
    
    const searchControl = new (GeoSearchControl as any)({
      provider: provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Search state, district in India...',
    });
    
    map.addControl(searchControl);
    
    const handleLocationSelect = (e: any) => {
      if (e && e.location) {
        const pos = new L.LatLng(e.location.y, e.location.x);
        setPosition(pos);
        map.flyTo(pos, 15, { animate: true, duration: 1 });
      }
    };
    
    map.on('geosearch/showlocation', handleLocationSelect);
    
    return () => { 
      map.removeControl(searchControl); 
      map.off('geosearch/showlocation', handleLocationSelect);
    };
  }, [map, setPosition]);
  return null;
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom(), { animate: true, duration: 0.8 });
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom(), { animate: true, duration: 0.8 });
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  );
}

function CurrentLocationControl({ setPosition }: { setPosition: (pos: L.LatLng) => void }) {
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15, { animate: true, duration: 1 });
    },
    locationerror(e) {
      console.error(e.message);
    }
  });

  return (
    <div className="leaflet-top leaflet-left" style={{ top: '80px', zIndex: 1000 }}>
      <div className="leaflet-control leaflet-bar">
        <a 
          href="#"
          className="flex items-center justify-center bg-white hover:bg-gray-50 transition-colors" 
          title="Use my current location"
          onClick={(e) => {
            e.preventDefault();
            map.locate({ setView: false, maxZoom: 16 });
          }}
          style={{ width: '34px', height: '34px', display: 'flex' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        </a>
      </div>
    </div>
  );
}

export default function MapComponent({ latitude, longitude, onLocationSelect }: MapComponentProps) {
  const defaultCenter: L.LatLngExpression = [28.6139, 77.2090]; // New Delhi
  const [position, setPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    if (latitude && longitude && !isNaN(Number(latitude)) && !isNaN(Number(longitude)) && latitude !== '0' && longitude !== '0') {
      setPosition(new L.LatLng(Number(latitude), Number(longitude)));
    } else {
      setPosition(null);
    }
  }, [latitude, longitude]);

  const handleSetPosition = (pos: L.LatLng) => {
    setPosition(pos);
    onLocationSelect(pos.lat.toFixed(6), pos.lng.toFixed(6));
  };

  const center = position || defaultCenter;

  return (
    <div className="w-full h-[380px] rounded-2xl overflow-hidden border border-border/60 relative z-0 shadow-sm ring-1 ring-black/5">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
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
        
        <SearchField setPosition={handleSetPosition} />
        <LocationMarker position={position} setPosition={handleSetPosition} />
        <CurrentLocationControl setPosition={handleSetPosition} />
      </MapContainer>
    </div>
  );
}
