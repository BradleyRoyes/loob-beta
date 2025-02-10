"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  CSSProperties,
} from "react";
import maplibregl, { Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./Map.css";
import { checkPermission, getPermissionInstructions } from "../utils/permissions";
import { useGeolocation } from "./hooks/useGeolocation";
import debounce from "lodash/debounce";

import VibeEntity from "./VibeEntity";
import OfferingProfile from "./OfferingProfile";
import MapSidebar from "./MapSidebar";
import AddVenueModal from "./AddVenueModal";
import LoobCache from "./LoobCache";
import { useGlobalState } from './GlobalStateContext';

export type VisualView = "Today";

export interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;
  type: string;
  details: string;
  contact: string;
  visualType: VisualView;
  createdAt?: string;
  updatedAt?: string;
  location?: string;
  pseudonym?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  loobricates?: string[];
  dataType?: string;
  isLoobricate?: boolean;
}

interface MapNode extends Node {
  isLoobricate?: boolean;
}

const DEFAULT_LOCATION: [number, number] = [13.405, 52.52];
const MAP_PITCH = 75;
const INITIAL_ZOOM = 16;
const LOCATION_TIMEOUT = 15000; // 15 seconds timeout

interface LocationError {
  type: "permission" | "unavailable" | "timeout";
  message: string;
}

interface LocationState {
  status: 'idle' | 'requesting' | 'watching' | 'error';
  error?: LocationError | null;
  retryCount: number;
  lastUpdate?: number;
  hasPermission?: boolean;
}

const LOCATION_CONFIG = {
  TIMEOUT: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000,
  HIGH_ACCURACY: {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  },
  LOW_ACCURACY: {
    enableHighAccuracy: false,
    timeout: 10000,
    maximumAge: 30000,
  },
};

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
      paint: {
        "raster-saturation": -0.9,
        "raster-brightness-min": 0.1,
        "raster-brightness-max": 0.9,
      },
    },
  ],
};

const INITIAL_MAP_STATE = {
  zoom: 18,
  pitch: 60,
  bearing: 0,
  maxBounds: undefined,
  minZoom: 16,
  maxZoom: 19,
  dragRotate: false,
  dragPan: false,
  scrollZoom: false,
  keyboard: false,
  doubleClickZoom: false,
  touchZoomRotate: false,
};

const loadingOverlayStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(5px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const mobileOverlayStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1500,
};

interface DeviceOrientationEventWithWebkit extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
}

const Map: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [previewNode, setPreviewNode] = useState<Node | null>(null);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showOfferingProfile, setShowOfferingProfile] = useState(false);
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [sidebarActive, setSidebarActive] = useState(() => window.innerWidth > 768);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const pulsingMarkerRef = useRef<maplibregl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<PermissionState>("prompt");
  const [mapPitch, setMapPitch] = useState(0);
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const [deviceOrientation, setDeviceOrientation] = useState<number>(0);
  const [isLocating, setIsLocating] = useState(false);
  const [locationState, setLocationState] = useState<LocationState>({
    status: 'idle',
    retryCount: 0,
  });
  const [showVibeEntity, setShowVibeEntity] = useState(false);
  const { activeServitor } = useGlobalState();
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);
  const initializationAttemptRef = useRef(0);
  const maxInitializationAttempts = 3;

  const { location, accuracy, heading, error: geoError } = useGeolocation(
    mapInstanceRef.current,
    userMarkerRef.current
  );

  // Update user marker and pulsing ring with new location.
  useEffect(() => {
    if (location && mapInstanceRef.current) {
      setCurrentLocation(location);
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat(location);
      }
      if (pulsingMarkerRef.current) {
        pulsingMarkerRef.current.setLngLat(location);
      }
    }
  }, [location, accuracy]);

  useEffect(() => {
    if (geoError) {
      setLocationError({
        type: "unavailable",
        message: geoError.message,
      });
    }
  }, [geoError]);

  useEffect(() => {
    async function fetchUserEntries() {
      try {
        const response = await fetch("/api/mapData");
        if (!response.ok) {
          throw new Error(`Error fetching map data: ${response.status}`);
        }
        const data = await response.json();

        function getRandomCoordsNearBerlin(): [number, number] {
          const lon = 13.2 + Math.random() * 0.5;
          const lat = 52.4 + Math.random() * 0.4;
          return [lon, lat];
        }

        const newNodes: MapNode[] = data.map((entry: any) => {
          const [lon, lat] = getRandomCoordsNearBerlin();
          return {
            id: entry.document_id || `temp-${Math.random()}`,
            lat,
            lon,
            label: entry.title ?? "Untitled Entry",
            type: entry.offeringType ?? "UserEntry",
            details: entry.description ?? "No description provided.",
            contact: entry.email ? `mailto:${entry.email}` : "No contact info",
            visualType: "Today",
            isLoobricate: entry.offeringType === "Loobricate",
            location: entry.location,
            pseudonym: entry.pseudonym,
            email: entry.email,
            phone: entry.phone,
            tags: entry.tags,
            loobricates: entry.loobricates,
            dataType: entry.dataType,
          };
        });

        setNodes(newNodes);
      } catch (err) {
        console.error("Failed to fetch map data:", err);
      }
    }

    fetchUserEntries();
  }, []);

  useEffect(() => {
    const handleResize = () => setSidebarActive(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const requestLocationPermission = async (): Promise<boolean> => {
    // Handle iOS Safari specifically
    if (typeof navigator.permissions === 'undefined') {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 3000 }
        );
      });
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state === 'granted';
    } catch (e) {
      console.warn('Permissions API not supported, falling back to geolocation check');
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 3000 }
        );
      });
    }
  };

  const getLocationWithRetry = useCallback(async (
    options: PositionOptions,
    retryCount = 0
  ): Promise<GeolocationPosition> => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Location request timed out'));
        }, options.timeout || LOCATION_CONFIG.TIMEOUT);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve(position);
          },
          (error) => {
            clearTimeout(timeoutId);
            reject(error);
          },
          options
        );
      });

      return position;
    } catch (error) {
      if (retryCount < LOCATION_CONFIG.MAX_RETRIES) {
        // Exponential backoff
        const delay = LOCATION_CONFIG.RETRY_DELAY * Math.pow(2, retryCount);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // If high accuracy failed, try with low accuracy
        const nextOptions = options.enableHighAccuracy ? 
          LOCATION_CONFIG.LOW_ACCURACY : 
          options;

        return getLocationWithRetry(nextOptions, retryCount + 1);
      }
      throw error;
    }
  }, []);

  const startWatchingLocation = useCallback(async (map: maplibregl.Map) => {
    if (!navigator.geolocation) {
      setLocationError({
        type: 'unavailable',
        message: 'Geolocation is not supported by your browser'
      });
      return;
    }

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocationError({
          type: 'permission',
          message: 'Location access was denied. Please enable location services in your settings.'
        });
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [longitude, latitude];
          
          setCurrentLocation(newLocation);
          
          // Update markers
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat(newLocation);
          }
          if (pulsingMarkerRef.current) {
            pulsingMarkerRef.current.setLngLat(newLocation);
          }

          // Keep map centered on user
          map.easeTo({
            center: newLocation,
            duration: 1000,
          });

          // Clear any existing location errors
          setLocationError(null);
          
          setLocationState({
            status: 'watching',
            error: null,
            retryCount: 0,
            lastUpdate: Date.now(),
            hasPermission: true
          });
        },
        (error) => {
          let errorMessage = 'An unknown error occurred while getting your location.';
          let errorType: 'permission' | 'unavailable' | 'timeout' = 'unavailable';

          switch (error.code) {
            case GeolocationPositionError.PERMISSION_DENIED:
              errorType = 'permission';
              errorMessage = 'Location access was denied. Please enable location services in your settings.';
              break;
            case GeolocationPositionError.POSITION_UNAVAILABLE:
              errorType = 'unavailable';
              errorMessage = 'Unable to determine your location. Please check your device settings.';
              break;
            case GeolocationPositionError.TIMEOUT:
              errorType = 'timeout';
              errorMessage = 'Location request timed out. Please check your connection.';
              break;
          }

          console.warn('Location error:', {
            code: error.code,
            message: errorMessage,
            type: errorType
          });

          setLocationError({
            type: errorType,
            message: errorMessage
          });

          setLocationState(prev => ({
            ...prev,
            status: 'error',
            error: {
              type: errorType,
              message: errorMessage
            }
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );

      // Clean up watch position on component unmount
      return () => {
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };
    } catch (error) {
      console.warn('Location setup error:', error);
      setLocationError({
        type: 'unavailable',
        message: 'Failed to initialize location services. Please try again.'
      });
    }
  }, []);

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEventWithWebkit) => {
      if (event.webkitCompassHeading) {
        setDeviceOrientation(event.webkitCompassHeading);
      } else if (event.alpha) {
        setDeviceOrientation(360 - event.alpha);
      }
    },
    []
  );

  useEffect(() => {
    if (window.DeviceOrientationEvent) {
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === "function"
      ) {
        document.addEventListener(
          "click",
          async () => {
            try {
              const permission = await (DeviceOrientationEvent as any).requestPermission();
              if (permission === "granted") {
                window.addEventListener("deviceorientation", handleDeviceOrientation);
              }
            } catch (error) {
              console.error("Error requesting device orientation permission:", error);
            }
          },
          { once: true }
        );
      } else {
        window.addEventListener("deviceorientation", handleDeviceOrientation);
      }
    }

    return () => {
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [handleDeviceOrientation]);

  useEffect(() => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setRotation(deviceOrientation);
    }
  }, [deviceOrientation]);

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        ...INITIAL_MAP_STATE,
        fadeDuration: 0, // Disable fade animations for faster loading
      });

      // Disable all default interactions
      map.dragPan.disable();
      map.scrollZoom.disable();
      map.doubleClickZoom.disable();
      map.touchZoomRotate.disable();
      map.keyboard.disable();
      map.dragRotate.disable();

      mapInstanceRef.current = map;

      // Handle successful map load
      map.once('load', () => {
        console.log('Map loaded successfully');
        setIsMapLoading(false);
        setMapLoadError(null);
        
        // Create markers and start location watching only after successful load
        createUserMarker(map);
        createPulsingMarker(map);
        startWatchingLocation(map);
      });

      // Handle map load errors
      map.once('error', (e) => {
        console.error('Map load error:', e);
        setMapLoadError('Failed to load map. Retrying...');
        
        // Clean up failed map instance
        map.remove();
        mapInstanceRef.current = null;

        // Retry initialization if under max attempts
        if (initializationAttemptRef.current < maxInitializationAttempts) {
          initializationAttemptRef.current += 1;
          setTimeout(initializeMap, 2000); // Retry after 2 seconds
        } else {
          setMapLoadError('Could not load map. Please refresh the page.');
          setIsMapLoading(false);
        }
      });

    } catch (error) {
      console.error('Map initialization error:', error);
      setMapLoadError('Failed to initialize map');
      setIsMapLoading(false);
    }
  }, [startWatchingLocation]);

  // Create user marker with companion icon
  const createUserMarker = useCallback((map: maplibregl.Map) => {
    const userEl = document.createElement("div");
    userEl.className = "user-marker";
    
    if (activeServitor) {
      const companionEl = document.createElement("div");
      companionEl.className = "companion-indicator";
      companionEl.innerHTML = activeServitor.icon;
      userEl.appendChild(companionEl);
    }
    
    userMarkerRef.current = new maplibregl.Marker({
      element: userEl,
      anchor: "center",
      rotationAlignment: "map",
      pitchAlignment: "viewport",
    })
      .setLngLat(DEFAULT_LOCATION)
      .addTo(map);
  }, [activeServitor]);

  // Create pulsing marker with companion theme
  const createPulsingMarker = useCallback((map: maplibregl.Map) => {
    const ringEl = document.createElement("div");
    ringEl.className = `pulsing-ring ${activeServitor ? activeServitor.id : ''}`;
    
    pulsingMarkerRef.current = new maplibregl.Marker({
      element: ringEl,
      anchor: "center",
    })
      .setLngLat(DEFAULT_LOCATION)
      .addTo(map);
  }, [activeServitor]);

  // Initialize map on component mount
  useEffect(() => {
    setIsMapLoading(true);
    initializeMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [initializeMap]);

  // Create markers for nodes once and update only when nodes change.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers.
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    nodes.forEach((node) => {
      const markerEl = document.createElement("div");
      markerEl.className = `map-marker ${node.isLoobricate ? "loobricate" : ""}`;
      const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: "bottom",
        rotationAlignment: "map",
        pitchAlignment: "map",
      })
        .setLngLat([node.lon, node.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        selectNode(map, node);
      });

      markersRef.current.push(marker);
    });
  }, [nodes]);

  const selectNode = useCallback((map: maplibregl.Map, node: Node) => {
    map.flyTo({
      center: [node.lon, node.lat],
      zoom: 14,
      speed: 0.8,
      curve: 1,
    });

    map.once("moveend", () => {
      setPreviewNode(node);
      setShowPreviewPopup(true);
      const screenPos = map.project([node.lon, node.lat]);
      setPopupPosition({ x: screenPos.x, y: screenPos.y });
    });
  }, []);

  const renderSphereForNode = (node: Node) => {
    return <VibeEntity entityId={node.id} />;
  };

  const handleConfirmAddVenue = (venueName: string) => {
    if (!currentLocation) {
      setShowAddVenueModal(false);
      return;
    }
    const [lon, lat] = currentLocation;
    const newNode: MapNode = {
      id: `Node-${Date.now()}`,
      lat,
      lon,
      label: venueName,
      details: "User-created venue details.",
      contact: "mailto:info@usercreated.com",
      visualType: "Today",
      type: "Venue",
      location: "User-created location",
      pseudonym: "User-created pseudonym",
      email: "info@usercreated.com",
      phone: "123-456-7890",
      tags: ["User-created tag"],
      loobricates: ["User-created loobricate"],
      dataType: "User-created",
    };

    setNodes((prev) => [...prev, newNode]);
    setShowAddVenueModal(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [lon, lat], zoom: 14 });
    }
  };

  const handleShowOfferingProfile = (node: Node) => {
    setActiveNode(node);
    setShowOfferingProfile(true);
  };

  const toggleSidebar = () => setSidebarActive((prev) => !prev);

  const handleRecenter = () => {
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.flyTo({
        center: currentLocation,
        pitch: MAP_PITCH,
        bearing: 0,
        zoom: INITIAL_ZOOM,
        duration: 1000,
        essential: true,
      });
    }
  };

  useEffect(() => {
    const checkLocationPermission = async () => {
      const state = await checkPermission("geolocation");
      setLocationPermissionState(state);
      if (state === "denied") {
        alert(getPermissionInstructions("geolocation"));
      }
    };

    checkLocationPermission();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkLocationPermission();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const LocationErrorMessage = ({
    error,
    onRetry,
    onDismiss,
  }: {
    error: LocationError;
    onRetry: () => void;
    onDismiss: () => void;
  }) => (
    <div className="location-error-message">
      <div className="error-content" style={{
        backgroundColor: 'rgba(23, 23, 23, 0.9)',
        color: '#E0E0E0',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <span style={{ display: 'block', marginBottom: '1rem' }}>{error.message}</span>
        <div className="button-group" style={{ display: 'flex', gap: '0.5rem' }}>
          {error.type !== 'permission' && (
            <button 
              className="retry-button" 
              onClick={onRetry}
              disabled={locationState.status === 'requesting'}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#FF6B6B',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {locationState.status === 'requesting' ? 'Retrying...' : 'Try Again'}
            </button>
          )}
          <button 
            className="dismiss-button" 
            onClick={onDismiss}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: error.type === 'permission' ? '#4A4A4A' : '#333',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {error.type === 'permission' ? 'Open Settings' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="map-container" style={{ position: "relative" }}>
      <div ref={mapContainerRef} className="map-layer" />

      {/* Loading State */}
      {isMapLoading && (
        <div style={loadingOverlayStyle}>
          <div className="map-loading-content">
            <div className="map-spinner" />
            <p className="map-loading-text">
              {mapLoadError || 'Loading map...'}
            </p>
          </div>
        </div>
      )}

      {/* Map Load Error */}
      {!isMapLoading && mapLoadError && (
        <div className="map-error-message">
          <p>{mapLoadError}</p>
          <button 
            onClick={() => {
              setIsMapLoading(true);
              initializationAttemptRef.current = 0;
              initializeMap();
            }}
            className="retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {locationState.error && !locationState.hasPermission && (
        <div className="location-error-banner" style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '8px',
          zIndex: 1000,
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          <p style={{ margin: '0 0 10px 0' }}>{locationState.error.message}</p>
          {locationState.error.type !== 'permission' && (
            <button
              onClick={() => {
                if (mapInstanceRef.current) {
                  startWatchingLocation(mapInstanceRef.current);
                }
              }}
              style={{
                padding: '8px 16px',
                fontSize: '0.9rem',
                borderRadius: '4px',
                backgroundColor: '#FFB3BA',
                border: 'none',
                color: '#333',
                cursor: 'pointer'
              }}
            >
              Try Again
            </button>
          )}
        </div>
      )}

      <div className="tilt-controller">
        <button
          className="tilt-button"
          onClick={() => {
            const newPitch = Math.min(mapPitch + 10, 80);
            setMapPitch(newPitch);
            mapInstanceRef.current?.setPitch(newPitch);
          }}
          aria-label="Increase tilt"
        >
          ↑
        </button>
        <button
          className="tilt-button"
          onClick={() => {
            const newPitch = Math.max(mapPitch - 10, 0);
            setMapPitch(newPitch);
            mapInstanceRef.current?.setPitch(newPitch);
          }}
          aria-label="Decrease tilt"
        >
          ↓
        </button>
      </div>

      {currentLocation && (
        <button
          className={`recenter-button ${
            mapInstanceRef.current?.getCenter().toString() !== currentLocation.toString()
              ? "not-centered"
              : ""
          }`}
          onClick={handleRecenter}
          aria-label="Center on my location"
        >
          <div className="recenter-icon" />
        </button>
      )}

      <MapSidebar
        nodes={nodes}
        sidebarActive={sidebarActive}
        toggleSidebar={toggleSidebar}
        onNodeSelect={(node) => {
          if (mapInstanceRef.current) {
            selectNode(mapInstanceRef.current, node);
          }
        }}
        onMoreInfo={handleShowOfferingProfile}
      />

      <button
        className={`toggle-sidebar ${sidebarActive ? "attached" : "tab"}`}
        onClick={toggleSidebar}
        style={{
          position: "absolute",
          bottom: "80px",
          right: "20px",
          zIndex: 1100,
          width: "70px",
          height: "70px",
          fontSize: "1.5rem",
          borderRadius: "50%",
        }}
        aria-label={sidebarActive ? "Close sidebar" : "Open sidebar"}
      >
        {sidebarActive ? "←" : "→"}
      </button>

      {showPreviewPopup && previewNode && popupPosition && (
        <div
          className="small-popup"
          style={{
            position: "absolute",
            top: popupPosition.y,
            left: popupPosition.x,
            zIndex: 2000,
            backgroundColor: 'rgba(23, 23, 23, 0.9)',
            borderRadius: '12px',
            padding: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            color: '#E0E0E0',
            transform: 'translate(-50%, -100%)',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="small-popup-inner">
            <button
              className="close-popup-btn"
              onClick={() => setShowPreviewPopup(false)}
              style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '0.25rem',
                opacity: 0.8,
                transition: 'opacity 0.2s'
              }}
              aria-label="Close preview popup"
            >
              ×
            </button>
            <div className="popup-title">
              <h3 style={{ textAlign: "center", margin: "0 0 10px 0" }}>
                {previewNode.label}
              </h3>
            </div>
            <div className="sphere-preview" style={{ 
              backgroundColor: 'transparent',
              borderRadius: '8px',
              overflow: 'hidden',
              margin: '-0.5rem'
            }}>
              {previewNode && (
                <VibeEntity 
                  entityId={previewNode.id}
                  className="preview-vibe-entity transparent-bg"
                  onStateUpdate={async (state) => {
                    try {
                      await fetch('/api/vibe_entities', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          id: previewNode.id,
                          state,
                          type: previewNode.type,
                          isLoobricate: previewNode.isLoobricate 
                        })
                      });
                    } catch (error) {
                      console.error('Failed to update vibe state:', error);
                    }
                  }}
                />
              )}
            </div>
            <button
              className="more-info-btn"
              onClick={() => {
                handleShowOfferingProfile(previewNode);
                setShowPreviewPopup(false);
              }}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#FF6B6B',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                width: '100%',
                transition: 'background-color 0.2s'
              }}
              aria-label="Show more info"
            >
              More Info
            </button>
          </div>
        </div>
      )}

      {showOfferingProfile && activeNode && (
        <OfferingProfile
          offering={{
            _id: activeNode.id,
            title: activeNode.label,
            description: activeNode.details,
            offeringType: (activeNode.type.toLowerCase() as "venue" | "gear" | "talent"),
            createdAt: activeNode.createdAt || new Date().toISOString(),
            location: activeNode.location,
            pseudonym: activeNode.pseudonym,
            email: activeNode.email,
            phone: activeNode.phone,
            tags: activeNode.tags,
            loobricates: activeNode.loobricates,
            dataType: activeNode.dataType,
          }}
          onClose={() => setShowOfferingProfile(false)}
        />
      )}

      {showAddVenueModal && (
        <AddVenueModal
          onClose={() => setShowAddVenueModal(false)}
          onConfirm={handleConfirmAddVenue}
        />
      )}

      <LoobCache
        currentLocation={currentLocation}
        onLoobFound={(amount) => {
          console.log(`Found ${amount} LOOB!`);
        }}
      />

      {/* Companion Status Overlay */}
      {activeServitor && (
        <div className="companion-overlay">
          <div className="companion-status">
            <span className="companion-icon">{activeServitor.icon}</span>
            <span className="companion-name">{activeServitor.name}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
