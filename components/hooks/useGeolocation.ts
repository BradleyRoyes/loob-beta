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

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export const useGeolocation = (map: MaplibreMap | null, userMarker: Marker | null) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    accuracy: null,
    heading: null,
    error: null
  });
  
  const watchIdRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const lastUpdateRef = useRef(0);

  const updateMarkerPosition = useCallback((longitude: number, latitude: number, heading: number | null) => {
    if (userMarker) {
      userMarker.setLngLat([longitude, latitude]);
      if (heading !== null) {
        userMarker.setRotation(heading);
      }
    }
  }, [userMarker]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: { code: 0, message: 'Geolocation not supported' }
      }));
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      const now = Date.now();
      // Throttle updates to prevent excessive renders
      if (now - lastUpdateRef.current < 100) return;
      lastUpdateRef.current = now;

      const { latitude, longitude, accuracy, heading } = position.coords;
      
      // Reset retry count on successful position
      retryCountRef.current = 0;
      
      setState({
        location: [longitude, latitude],
        accuracy,
        heading,
        error: null
      });

      updateMarkerPosition(longitude, latitude, heading);
    };

    const handleError = (error: GeolocationPositionError) => {
      console.warn('Geolocation error:', error);

      // Implement retry logic for temporary errors
      if (retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        setTimeout(() => {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
          startWatching();
        }, RETRY_DELAY);
        return;
      }

      setState(prev => ({
        ...prev,
        error: { 
          code: error.code,
          message: error.code === 1 
            ? 'Location access was denied. Please enable location services to use the map.'
            : error.code === 2
              ? 'Location unavailable. Please check your device settings.'
              : 'Unable to get your location. Please try again.'
        }
      }));
    };

    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        GEOLOCATION_OPTIONS
      );
    } catch (error) {
      console.error('Failed to start location watching:', error);
      setState(prev => ({
        ...prev,
        error: { 
          code: 0, 
          message: 'Failed to initialize location services. Please refresh the page.' 
        }
      }));
    }
  }, [updateMarkerPosition]);

  useEffect(() => {
    startWatching();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startWatching]);

  // Add a method to manually retry location watching
  const retry = useCallback(() => {
    retryCountRef.current = 0;
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    startWatching();
  }, [startWatching]);

  return { ...state, retry };
}; 