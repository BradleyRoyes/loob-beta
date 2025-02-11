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
  timeout: 10000,
  maximumAge: 0
};

const FALLBACK_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 30000
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const UPDATE_THRESHOLD = 100;

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
      if (now - lastUpdateRef.current < UPDATE_THRESHOLD) return;
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

      // For timeout errors, try again with less accurate but more reliable options
      if (error.code === 3 && retryCountRef.current < MAX_RETRIES) {
        retryCountRef.current++;
        console.log(`Retrying geolocation (${retryCountRef.current}/${MAX_RETRIES}) with fallback options...`);
        
        setTimeout(() => {
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
          }
          
          // Use fallback options on retry
          watchIdRef.current = navigator.geolocation.watchPosition(
            handleSuccess,
            handleError,
            retryCountRef.current === MAX_RETRIES ? FALLBACK_OPTIONS : GEOLOCATION_OPTIONS
          );
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
              : error.code === 3
                ? 'Location request timed out. Please check your connection and try again.'
                : 'Unable to get your location. Please try again.'
        }
      }));
    };

    try {
      // Start with high accuracy options
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