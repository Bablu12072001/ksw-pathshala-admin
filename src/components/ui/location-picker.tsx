'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically load the MapComponent to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[300px] bg-secondary/50 rounded-md animate-pulse flex items-center justify-center border border-border/50">
      <span className="text-sm font-medium text-muted-foreground">Loading Map...</span>
    </div>
  ),
});

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  onChange: (lat: string, lng: string) => void;
}

export function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  return (
    <div className="space-y-2 col-span-2 mt-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-foreground">
          Select Location on Map *
        </label>
        <span className="text-xs text-muted-foreground font-medium">
          {latitude && longitude && latitude !== '0' && longitude !== '0' ? `${latitude}, ${longitude}` : 'No location selected'}
        </span>
      </div>
      <MapComponent latitude={latitude} longitude={longitude} onLocationSelect={onChange} />
      <p className="text-xxs text-muted-foreground">Click anywhere on the map to set the teacher's exact location coordinates.</p>
    </div>
  );
}
