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
import { Servitor, defaultServitors } from './ServitorManager';
import CompanionSelection from './CompanionSelection';

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

const MAP_PITCH = 75;
const INITIAL_ZOOM = 16;
const FALLBACK_ZOOM = 14;

const LOCATION_CONFIG = {
  TIMEOUT: 10000, // Reduced timeout for faster feedback
  HIGH_ACCURACY: {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  }
};

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        // Use multiple tile servers for redundancy and load balancing
        "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
      minzoom: 0,
      bounds: [-180, -85.0511, 180, 85.0511],
      scheme: "xyz",
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
        "raster-resampling": "linear",
      },
    },
  ],
};

const INITIAL_MAP_STATE = {
  pitch: 60, // Tilted view by default
  bearing: 0,
  maxBounds: undefined, // Remove bounds restriction
  minZoom: 16, // Keep users zoomed in
  maxZoom: 19,
  dragRotate: false, // Disable manual rotation
  dragPan: false, // Disable manual panning
  scrollZoom: false, // Disable zoom with scroll
  keyboard: false, // Disable keyboard controls
  doubleClickZoom: false, // Disable double click zoom
  touchZoomRotate: false, // Disable touch zoom/rotate
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

interface SpawnedServitor extends Servitor {
  spawnLocation: {
    lat: number;
    lng: number;
  };
  spawnTime: number;
  despawnTime: number;
}

const SPAWN_CONFIG = {
  MAX_DISTANCE: 1000, // meters
  MIN_DISTANCE: 100, // meters
  SPAWN_INTERVAL: 300000, // 5 minutes
  DESPAWN_TIME: 1800000, // 30 minutes
  INTERACTION_RADIUS: 50 // meters
};

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
  const [locationState, setLocationState] = useState<{
    status: 'initializing' | 'requesting' | 'granted' | 'denied' | 'error';
    error?: string;
  }>({ status: 'initializing' });
  const [showVibeEntity, setShowVibeEntity] = useState(false);
  const { activeServitor, discoveredServitors = [], setUserState } = useGlobalState();
  const [spawnedServitors, setSpawnedServitors] = useState<SpawnedServitor[]>([]);
  const [showCompanionSelection, setShowCompanionSelection] = useState(false);
  const [selectedServitor, setSelectedServitor] = useState<Servitor | null>(null);
  const servitorMarkersRef = useRef<{ [key: string]: maplibregl.Marker }>({});

  const { location, accuracy, heading, error: geoError, retry: retryGeolocation } = useGeolocation(
    mapInstanceRef.current,
    userMarkerRef.current
  );

  // Update user marker and pulsing ring with new location
  useEffect(() => {
    if (location && mapInstanceRef.current) {
      setCurrentLocation(location);
      if (userMarkerRef.current) {
        userMarkerRef.current.setLngLat(location);
      }
      if (pulsingMarkerRef.current) {
        pulsingMarkerRef.current.setLngLat(location);
      }

      // Only update map center if we just got our first location fix
      if (!currentLocation) {
        mapInstanceRef.current.flyTo({
          center: location,
          zoom: INITIAL_ZOOM,
          pitch: MAP_PITCH,
          essential: true
        });
      }
    }
  }, [location, accuracy, currentLocation]);

  // Handle geolocation errors
  useEffect(() => {
    if (geoError) {
      console.warn('Geolocation error:', geoError);
      setLocationState({
        status: geoError.code === 1 ? 'denied' : 'error',
        error: geoError.message
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

  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEventWithWebkit) => {
      if (event.webkitCompassHeading) {
        // Handle device orientation
      } else if (event.alpha) {
        // Handle device orientation
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
      userMarkerRef.current.setRotation(0); // Reset rotation
    }
  }, []);

  // Initialize map without a default center
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE,
        zoom: FALLBACK_ZOOM,
        ...INITIAL_MAP_STATE,
        center: [0, 0], // Add a default center to prevent initialization errors
      });

      map.on('error', (e) => {
        console.error('Map error:', e);
      });

      // Wait for map to be fully loaded before proceeding
      map.once('load', () => {
        mapInstanceRef.current = map;
        initializeLocation();
      });

      // Create user marker but don't add it to map yet
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
      });

      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }
      };
    } catch (error) {
      console.error('Map initialization error:', error);
      setLocationState({
        status: 'error',
        error: 'Failed to initialize map. Please refresh the page.'
      });
    }
  }, [activeServitor]);

  // Simplified location initialization
  const initializeLocation = async () => {
    if (!navigator.geolocation) {
      setLocationState({ 
        status: 'error', 
        error: 'Geolocation is not supported by your browser' 
      });
      return;
    }

    try {
      setLocationState({ status: 'requesting' });

      // First try to get permission
      if (typeof navigator.permissions !== 'undefined') {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
          setLocationState({ 
            status: 'denied',
            error: 'Location access was denied. Please enable location services to use the map.'
          });
          return;
        }
      }

      // Start watching position
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation: [number, number] = [longitude, latitude];
          
          setCurrentLocation(newLocation);
          setLocationState({ status: 'granted' });
          
          // Update markers and map
          if (userMarkerRef.current) {
            userMarkerRef.current
              .setLngLat(newLocation)
              .addTo(mapInstanceRef.current!);
          }

          // Center map on first location fix
          if (locationState.status !== 'granted' && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo({
              center: newLocation,
              zoom: INITIAL_ZOOM,
              pitch: MAP_PITCH,
              essential: true
            });
          }
        },
        (error) => {
          console.warn('Location error:', error);
          let errorMessage = 'Unable to get your location.';
          
          if (error.code === 1) {
            errorMessage = 'Location access was denied. Please enable location services to use the map.';
            setLocationState({ status: 'denied', error: errorMessage });
          } else {
            setLocationState({ status: 'error', error: errorMessage });
          }
        },
        LOCATION_CONFIG.HIGH_ACCURACY
      );

      // Store watch ID for cleanup
      watchIdRef.current = watchId;

    } catch (error) {
      console.error('Location initialization error:', error);
      setLocationState({ 
        status: 'error',
        error: 'Failed to initialize location services. Please try again.'
      });
    }
  };

  // Render location status banner with retry option
  const renderLocationStatus = () => {
    if (locationState.status === 'requesting') {
      return (
        <div className="location-status-banner">
          <div className="status-content">
            <div className="location-spinner" />
            <span>Requesting location access...</span>
          </div>
        </div>
      );
    }

    if (locationState.status === 'denied' || locationState.status === 'error') {
      return (
        <div className="location-status-banner error">
          <div className="status-content">
            <span>{locationState.error}</span>
            <button
              onClick={() => {
                if (locationState.status === 'denied') {
                  window.location.reload();
                } else {
                  retryGeolocation();
                }
              }}
              className="retry-button"
            >
              {locationState.status === 'denied' ? 'Enable Location' : 'Retry'}
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  // Add accuracy indicator when location is active
  const renderAccuracyIndicator = () => {
    if (location && accuracy) {
      return (
        <div className="location-accuracy-indicator">
          <div className="accuracy-dot" />
          <span>Accuracy: {Math.round(accuracy)}m</span>
        </div>
      );
    }
    return null;
  };

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
    error: string;
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
        <span style={{ display: 'block', marginBottom: '1rem' }}>{error}</span>
        <div className="button-group" style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="retry-button" 
            onClick={onRetry}
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
            Try Again
          </button>
          <button 
            className="dismiss-button" 
            onClick={onDismiss}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#333',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );

  // Add this new function for spawning companions
  const generateSpawnLocation = (userLat: number, userLng: number): [number, number] => {
    const radius = SPAWN_CONFIG.MIN_DISTANCE + 
      Math.random() * (SPAWN_CONFIG.MAX_DISTANCE - SPAWN_CONFIG.MIN_DISTANCE);
    const angle = Math.random() * 2 * Math.PI;
    
    // Convert meters to rough degrees (approximate at most latitudes)
    const latOffset = (radius / 111111) * Math.cos(angle);
    const lngOffset = (radius / (111111 * Math.cos(userLat * Math.PI / 180))) * Math.sin(angle);
    
    return [userLat + latOffset, userLng + lngOffset];
  };

  // Add this new function to manage spawns
  const manageServitorSpawns = useCallback(() => {
    if (!currentLocation) return;
    
    const [userLng, userLat] = currentLocation;
    const now = Date.now();
    
    // Remove despawned servitors
    const activeSpawns = spawnedServitors.filter(s => s.despawnTime > now);
    
    // Check if we need to spawn a new servitor
    if (activeSpawns.length < 1) {
      // Get available servitors (not yet discovered)
      const availableServitors = defaultServitors.filter(
        servitor => !discoveredServitors.includes(servitor.id)
      );
      
      if (availableServitors.length > 0) {
        // Randomly select a servitor to spawn
        const servitorToSpawn = availableServitors[Math.floor(Math.random() * availableServitors.length)];
        const [spawnLat, spawnLng] = generateSpawnLocation(userLat, userLng);
        
        const newSpawn: SpawnedServitor = {
          ...servitorToSpawn,
          spawnLocation: { lat: spawnLat, lng: spawnLng },
          spawnTime: now,
          despawnTime: now + SPAWN_CONFIG.DESPAWN_TIME
        };
        
        setSpawnedServitors([...activeSpawns, newSpawn]);
      }
    } else {
      setSpawnedServitors(activeSpawns);
    }
  }, [currentLocation, discoveredServitors, spawnedServitors]);

  // Replace the existing useEffect for nearby servitors with this
  useEffect(() => {
    const spawnInterval = setInterval(manageServitorSpawns, 10000); // Check every 10 seconds
    return () => clearInterval(spawnInterval);
  }, [manageServitorSpawns]);

  // Update the isWithinDiscoveryRange function
  const isWithinDiscoveryRange = (userLocation: [number, number], servitor: SpawnedServitor): boolean => {
    const [userLng, userLat] = userLocation;
    const { lat, lng } = servitor.spawnLocation;
    
    // Calculate distance using Haversine formula
    const R = 6371e3; // Earth's radius in meters
    const φ1 = userLat * Math.PI/180;
    const φ2 = lat * Math.PI/180;
    const Δφ = (lat - userLat) * Math.PI/180;
    const Δλ = (lng - userLng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance <= SPAWN_CONFIG.INTERACTION_RADIUS;
  };

  // Update the servitor markers useEffect to use spawned servitors
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers
    Object.values(servitorMarkersRef.current).forEach(marker => marker.remove());
    servitorMarkersRef.current = {};

    // Add markers for spawned servitors
    spawnedServitors.forEach(servitor => {
      const { lat, lng } = servitor.spawnLocation;
      
      const markerEl = document.createElement('div');
      markerEl.className = 'servitor-marker';
      
      // Add pulsing effect if nearby
      if (currentLocation && isWithinDiscoveryRange(currentLocation, servitor)) {
        markerEl.classList.add('nearby');
      }
      
      const iconEl = document.createElement('div');
      iconEl.className = 'servitor-icon';
      iconEl.innerHTML = servitor.icon;
      markerEl.appendChild(iconEl);

      const marker = new maplibregl.Marker({
        element: markerEl,
        anchor: 'bottom'
      })
        .setLngLat([lng, lat])
        .addTo(map);

      marker.getElement().addEventListener('click', () => {
        if (!currentLocation) return;
        
        if (isWithinDiscoveryRange(currentLocation, servitor)) {
          if (discoveredServitors.includes(servitor.id)) {
            alert(`You have already summoned ${servitor.name}!`);
            return;
          }
          setSelectedServitor(servitor);
          setShowCompanionSelection(true);
        } else {
          alert('Move closer to discover this companion!');
        }
      });

      servitorMarkersRef.current[servitor.id] = marker;
    });

    return () => {
      Object.values(servitorMarkersRef.current).forEach(marker => marker.remove());
    };
  }, [mapInstanceRef.current, spawnedServitors, currentLocation, discoveredServitors]);

  const handleCompanionSummoned = (servitor: Servitor) => {
    setUserState({
      discoveredServitors: [...(discoveredServitors || []), servitor.id]
    });
    setShowCompanionSelection(false);
    setSelectedServitor(null);
  };

  // Add tile error handling
  const handleTileError = (e: any) => {
    console.warn('Tile loading error:', e);
    // Attempt to reload the tile after a delay
    if (e.target && typeof e.target.retryLoadTile === 'function') {
      setTimeout(() => {
        e.target.retryLoadTile(e.tile);
      }, 1000);
    }
  };

  return (
    <div className="map-container" style={{ position: "relative" }}>
      <div ref={mapContainerRef} className="map-layer" />

      {locationState.status === 'initializing' && (
        <div className="map-loading-overlay">
          <div className="loading-content">
            <div className="map-spinner" />
            <p>Initializing map...</p>
          </div>
        </div>
      )}

      {renderLocationStatus()}
      {renderAccuracyIndicator()}

      {currentLocation && locationState.status === 'granted' && (
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

      {/* Companion Status Overlay - Show even without location */}
      {activeServitor && (
        <div className="companion-overlay">
          <div className="companion-status">
            <span className="companion-icon">{activeServitor.icon}</span>
            <span className="companion-name">{activeServitor.name}</span>
          </div>
        </div>
      )}

      {showCompanionSelection && selectedServitor && (
        <CompanionSelection
          isOpen={true}
          onClose={() => {
            setShowCompanionSelection(false);
            setSelectedServitor(null);
          }}
          onSelect={handleCompanionSummoned}
          initialServitor={selectedServitor}
        />
      )}
    </div>
  );
};

export default Map;
