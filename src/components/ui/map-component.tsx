import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Fix for default marker icon in leaflet with Next.js/Webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  latitude: string;
  longitude: string;
  onLocationSelect: (lat: string, lng: string) => void;
}

function SearchField() {
  const map = useMapEvents({});
  useEffect(() => {
    const provider = new OpenStreetMapProvider({
      params: {
        countrycodes: 'in' // Constrain to India
      }
    });
    
    // Create control
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
    
    return () => {
      map.removeControl(searchControl);
    };
  }, [map]);

  return null;
}

function LocationMarker({ position, setPosition }: { position: L.LatLng | null, setPosition: (pos: L.LatLng) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Re-center if position changes externally
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

// 3. Current Location Control
function CurrentLocationControl({ setPosition }: { setPosition: (pos: L.LatLng) => void }) {
  const map = useMapEvents({
    locationfound(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15);
    },
    locationerror(e) {
      alert("Could not access your location. Please check your browser permissions.");
    }
  });

  return (
    <div className="leaflet-top leaflet-left" style={{ top: '80px' }}>
      <div className="leaflet-control leaflet-bar">
        <a 
          href="#"
          className="flex items-center justify-center bg-white text-black hover:bg-gray-100" 
          title="Use my current location"
          onClick={(e) => {
            e.preventDefault();
            map.locate({ setView: false, maxZoom: 16 });
          }}
          style={{ width: '30px', height: '30px', display: 'flex' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
        </a>
      </div>
    </div>
  );
}

export default function MapComponent({ latitude, longitude, onLocationSelect }: MapComponentProps) {
  const defaultCenter: L.LatLngExpression = [28.6139, 77.2090]; // New Delhi default
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
    <div className="w-full h-[350px] rounded-xl overflow-hidden border border-border/50 relative z-0 shadow-sm">
      <MapContainer center={center} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <LayersControl position="bottomright">
          <LayersControl.BaseLayer checked name="Street Map (OSM)">
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite View">
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <SearchField />
        <LocationMarker position={position} setPosition={handleSetPosition} />
        <CurrentLocationControl setPosition={handleSetPosition} />
      </MapContainer>
    </div>
  );
}
