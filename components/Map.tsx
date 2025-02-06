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
        "raster-saturation": -1,
        "raster-contrast": 0.2,
        "raster-brightness-min": 0.2,
      },
    },
  ],
};

const INITIAL_MAP_STATE = {
  center: DEFAULT_LOCATION,
  zoom: INITIAL_ZOOM,
  pitch: 0,
  bearing: 0,
  maxBounds: [
    [-10, 35],
    [40, 65],
  ] as [[number, number], [number, number]],
  minZoom: 4,
  maxZoom: 19,
  fadeDuration: 0,
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

  const startWatchingLocation = useCallback(
    async (map: maplibregl.Map) => {
      if (!navigator.geolocation) {
        setLocationState(prev => ({
          ...prev,
          status: 'error',
          error: {
            type: 'unavailable',
            message: 'Geolocation is not supported by your browser'
          }
        }));
        return;
      }

      try {
        // Check for permission first
        const hasPermission = await requestLocationPermission();
        setLocationState(prev => ({ ...prev, hasPermission }));
        
        if (!hasPermission) {
          setLocationState(prev => ({
            ...prev,
            status: 'error',
            error: {
              type: 'permission',
              message: 'Location access was denied. Please enable it in your settings.'
            }
          }));
          return;
        }

        setLocationState(prev => ({ ...prev, status: 'requesting' }));

        // Start watching position with high accuracy first
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setCurrentLocation([longitude, latitude]);
            
            // Update markers if they exist
            if (userMarkerRef.current) {
              userMarkerRef.current.setLngLat([longitude, latitude]);
              userMarkerRef.current.getElement().style.display = 'block';
            }
            if (pulsingMarkerRef.current) {
              pulsingMarkerRef.current.setLngLat([longitude, latitude]);
              pulsingMarkerRef.current.getElement().style.display = 'block';
            }

            // Only fly to location on first position or if explicitly requested
            if (locationState.status === 'requesting') {
              map.flyTo({
                center: [longitude, latitude],
                zoom: INITIAL_ZOOM,
                duration: 1000
              });
            }

            setLocationState(prev => ({
              ...prev,
              status: 'watching',
              error: null,
              lastUpdate: Date.now(),
              retryCount: 0
            }));
          },
          (error) => {
            // Only update error state if we don't already have permission
            if (!locationState.hasPermission || error.code === 1) {
              const errorMessage = 
                error.code === 1 ? 'Location access was denied. Please enable permissions in your browser settings.' :
                error.code === 2 ? 'Unable to determine your location. Please check your device settings.' :
                error.code === 3 ? 'Location request timed out. Please check your connection.' :
                'An unknown error occurred while getting your location.';

              setLocationState(prev => ({
                ...prev,
                status: 'error',
                error: {
                  type: error.code === 1 ? 'permission' : 
                        error.code === 3 ? 'timeout' : 'unavailable',
                  message: errorMessage
                }
              }));
            }
            // Log error without the full error object to avoid circular reference
            console.warn('Watch position error:', {
              code: error.code,
              message: error.message
            });
          },
          LOCATION_CONFIG.HIGH_ACCURACY
        );

      } catch (error: any) {
        console.warn('Location setup error:', error.message);
        setLocationState(prev => ({
          ...prev,
          status: 'error',
          error: {
            type: 'unavailable',
            message: 'Failed to initialize location services.'
          }
        }));
      }
    },
    [locationState.hasPermission, locationState.status]
  );

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

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      ...INITIAL_MAP_STATE,
      style: MAP_STYLE,
      maxZoom: 19,
      minZoom: 4,
      trackResize: true,
      refreshExpiredTiles: false,
    });

    // Enable default map interactions
    map.dragPan.enable();
    map.scrollZoom.enable();
    map.doubleClickZoom.enable();
    map.keyboard.enable();

    mapInstanceRef.current = map;

    const createUserMarker = () => {
      const userEl = document.createElement("div");
      userEl.className = "user-arrow";
      return new maplibregl.Marker({
        element: userEl,
        anchor: "center",
        rotationAlignment: "map",
        pitchAlignment: "map",
        scale: 1.2,
      })
        .setLngLat(DEFAULT_LOCATION)
        .addTo(map);
    };

    userMarkerRef.current = createUserMarker();
    if (!currentLocation) {
      userMarkerRef.current.getElement().style.display = 'none';
    }

    // Create a pulsing ring marker behind the user marker.
    const createPulsingMarker = () => {
      const ringEl = document.createElement("div");
      ringEl.className = "pulsing-ring";
      return new maplibregl.Marker({
        element: ringEl,
        anchor: "center",
      })
        .setLngLat(DEFAULT_LOCATION)
        .addTo(map);
    };

    pulsingMarkerRef.current = createPulsingMarker();
    if (!currentLocation) {
      pulsingMarkerRef.current.getElement().style.display = 'none';
    }

    const debouncedResize = debounce(() => {
      map.resize();
    }, 250);

    window.addEventListener("resize", debouncedResize);

    map.on("load", () => {
      setIsMapLoading(false);
      startWatchingLocation(map);
    });

    // Clean up on unmount.
    return () => {
      window.removeEventListener("resize", debouncedResize);
      debouncedResize.cancel();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [startWatchingLocation]);

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
      <div className="error-content">
        <span>{error.message}</span>
        <div className="button-group">
          {error.type !== 'permission' && (
            <button 
              className="retry-button" 
              onClick={onRetry}
              disabled={locationState.status === 'requesting'}
            >
              {locationState.status === 'requesting' ? 'Retrying...' : 'Try Again'}
            </button>
          )}
          <button className="dismiss-button" onClick={onDismiss}>
            {error.type === 'permission' ? 'Open Settings' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="map-container" style={{ position: "relative" }}>
      <div ref={mapContainerRef} className="map-layer" />

      {isMapLoading && (
        <div style={loadingOverlayStyle}>
          <div className="map-spinner" />
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
          }}
        >
          <div className="small-popup-inner">
            <button
              className="close-popup-btn"
              onClick={() => setShowPreviewPopup(false)}
              style={{ zIndex: 3000 }}
              aria-label="Close preview popup"
            >
              ×
            </button>
            <div className="popup-title">
              <h3 style={{ textAlign: "center", margin: "0 0 10px 0" }}>
                {previewNode.label}
              </h3>
            </div>
            <div className="sphere-preview">
              {renderSphereForNode(previewNode)}
            </div>
            <button
              className="more-info-btn"
              onClick={() => {
                handleShowOfferingProfile(previewNode);
                setShowPreviewPopup(false);
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

      <div className="map-visualization">
        <VibeEntity 
          entityId={previewNode?.id || 'map'}
          className="map-vibe-entity"
          onStateUpdate={async (state) => {
            try {
              await fetch('/api/vibe_entities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: previewNode?.id || 'map', state })
              });
            } catch (error) {
              console.error('Failed to update vibe state:', error);
            }
          }}
        />
      </div>
    </div>
  );
};

export default Map;
