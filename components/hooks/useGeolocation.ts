import { useState, useEffect, useRef, useCallback } from 'react';
import type { Map as MaplibreMap, Marker } from 'maplibre-gl';

interface GeolocationState {
  location: [number, number] | null;
  accuracy: number | null;
  heading: number | null;
  error: GeolocationError | null;
}

interface GeolocationError {
  code: number;
  message: string;
}

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};

export const useGeolocation = (map: MaplibreMap | null, userMarker: Marker | null) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    accuracy: null,
    heading: null,
    error: null
  });
  
  const watchIdRef = useRef<number | null>(null);

  const updateMarkerPosition = useCallback((longitude: number, latitude: number, heading: number | null) => {
    if (userMarker) {
      userMarker.setLngLat([longitude, latitude]);
      if (heading !== null) {
        userMarker.setRotation(heading);
      }
    }
  }, [userMarker]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: { code: 0, message: 'Geolocation not supported' }
      }));
      return;
    }

    let lastUpdate = 0;
    const handleSuccess = (position: GeolocationPosition) => {
      const now = Date.now();
      if (now - lastUpdate < 100) return;
      lastUpdate = now;

      const { latitude, longitude, accuracy, heading } = position.coords;
      
      setState({
        location: [longitude, latitude],
        accuracy,
        heading,
        error: null
      });

      updateMarkerPosition(longitude, latitude, heading);
    };

    const handleError = (error: GeolocationPositionError) => {
      setState(prev => ({
        ...prev,
        error: { code: error.code, message: error.message }
      }));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      GEOLOCATION_OPTIONS
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [updateMarkerPosition]);

  return state;
}; 