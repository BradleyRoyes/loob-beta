"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  MutableRefObject,
} from "react";
import maplibregl, { Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./Map.css";
import { checkPermission, requestLocationPermission } from '../utils/permissions';

// Child components with their prop types
import TorusSphere, { TorusSphereProps } from "./TorusSphere";
import OfferingProfile from "./OfferingProfile";
import MapSidebar from "./MapSidebar";
import AddVenueModal from "./AddVenueModal";
import LoobCache from './LoobCache';

// Types
export type VisualView = "Today";

export interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;     // e.g. "Berghain"
  type: string;      // e.g. "Venue", "Gear", etc.
  details: string;   // e.g. description or details
  contact: string;   // e.g. "mailto:someone@example.com"
  visualType: VisualView; // "Today"
  createdAt?: string;  // Add these as optional
  updatedAt?: string;  // Add these as optional
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

// Berlin center (longitude, latitude)
const DEFAULT_LOCATION: [number, number] = [13.405, 52.52];
const MAP_PITCH = 75;
const INITIAL_ZOOM = 16;

// Add these constants at the top level
const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0, // Always get fresh position
};

// Add this type
type GeolocationPermissionState = 'prompt' | 'granted' | 'denied';

// Update the error message constants at the top
const GEOLOCATION_ERRORS = {
  PERMISSION_DENIED: 'Please enable location services to see your position on the map.',
  POSITION_UNAVAILABLE: 'Unable to determine your location. Please check your device settings.',
  TIMEOUT: 'Location request timed out. Please try again.',
  GENERAL: 'Unable to access location services. Please check your settings and try again.'
} as const;

// Add this to your Map component's JSX return statement, before the closing div
const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8 as 8,  // Type assertion to literal type '8'
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    }
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    }
  ]
};

// Add this at the top with other constants
const INITIAL_MAP_STATE = {
  center: DEFAULT_LOCATION,
  zoom: INITIAL_ZOOM,
  pitch: 0, // Start with top-down view
  bearing: 0,
  maxBounds: [[-10, 35], [40, 65]] as [[number, number], [number, number]], // Type assertion for bounds
  minZoom: 4,
  maxZoom: 19,
  fadeDuration: 0
};

// Update the smoothlyUpdatePosition function for better performance
const smoothlyUpdatePosition = (
  currentPos: [number, number],
  newPos: [number, number],
  map: maplibregl.Map,
  marker: maplibregl.Marker
) => {
  const start = currentPos;
  const end = newPos;
  const duration = 1000;
  const startTime = performance.now();

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth movement
    const easeProgress = progress < 0.5
      ? 2 * progress * progress
      : -1 + (4 - 2 * progress) * progress;
    
    const lat = start[1] + (end[1] - start[1]) * easeProgress;
    const lng = start[0] + (end[0] - start[0]) * easeProgress;
    
    marker.setLngLat([lng, lat]);
    
    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  };

  requestAnimationFrame(animate);
};

// Add this function to handle device orientation changes
const handleDeviceOrientation = (
  event: DeviceOrientationEvent,
  map: maplibregl.Map,
  marker: maplibregl.Marker
) => {
  let heading: number | null = null;

  if ('webkitCompassHeading' in event) {
    // iOS compass heading
    heading = (event as any).webkitCompassHeading;
  } else if (event.alpha) {
    // Android compass heading
    heading = 360 - event.alpha;
  }

  if (heading !== null) {
    marker.setRotation(heading);
    if (map.getPitch() > 0) { // Only rotate map if we're in 3D view
      map.setBearing(heading);
    }
  }
};

const Map: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // We'll store references to the markers so we can remove them if needed.
  const markersRef = useRef<Marker[]>([]);

  // Our array of nodes from DB
  const [nodes, setNodes] = useState<MapNode[]>([]);

  // Current user geolocation
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  // Pop-up / preview logic
  const [previewNode, setPreviewNode] = useState<Node | null>(null);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // Venue profile logic
  const [showOfferingProfile, setShowOfferingProfile] = useState(false);
  const [activeNode, setActiveNode] = useState<Node | null>(null);

  // "Add Venue" modal logic
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);

  // Sidebar logic
  const [sidebarActive, setSidebarActive] = useState(() => window.innerWidth > 768);

  // Add new state for loading
  const [isMapLoading, setIsMapLoading] = useState(true);

  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Add new state for permission
  const [locationPermissionState, setLocationPermissionState] = useState<PermissionState>('prompt');

  // Add new state for pitch
  const [mapPitch, setMapPitch] = useState(0);

  const deviceOrientationRef = useRef<number | null>(null);

  // Add new state for orientation permission
  const [orientationPermissionState, setOrientationPermissionState] = useState<PermissionState>('prompt');

  // Add new state for error message
  const [locationError, setLocationError] = useState<string | null>(null);

  /**
   * 1) On mount, fetch data from /api/mapData
   */
  useEffect(() => {
    async function fetchUserEntries() {
      try {
        const response = await fetch("/api/mapData");
        if (!response.ok) {
          throw new Error(`Error fetching map data: ${response.status}`);
        }
        const data = await response.json();
        /**
         * data is an array of docs from your library collection
         * We'll create random coords if we have no lat/lon.
         * In future, you might store real lat/lon or do geocoding.
         */

        function getRandomCoordsNearBerlin(): [number, number] {
          const lon = 13.2 + Math.random() * 0.5; // ~13.2 to ~13.7
          const lat = 52.4 + Math.random() * 0.4; // ~52.4 to ~52.8
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
            isLoobricate: entry.offeringType === 'Loobricate', // Check if it's a loobricate
            location: entry.location,
            pseudonym: entry.pseudonym,
            email: entry.email,
            phone: entry.phone,
            tags: entry.tags,
            loobricates: entry.loobricates,
            dataType: entry.dataType
          };
        });

        setNodes(newNodes);
      } catch (err) {
        console.error("Failed to fetch map data:", err);
      }
    }

    fetchUserEntries();
  }, []);

  /**
   * 2) Adjust sidebar on window resize
   */
  useEffect(() => {
    const handleResize = () => setSidebarActive(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

 /**
 * 3) Map initialization — run once
 */
useEffect(() => {
  if (!mapContainerRef.current || mapInstanceRef.current) return;

  setIsMapLoading(true);

  const map = new maplibregl.Map({
    container: mapContainerRef.current,
    ...INITIAL_MAP_STATE,
    style: MAP_STYLE
  });

  mapInstanceRef.current = map;

  // Batch map control modifications
  const disableControls = () => {
    const controls = [
      map.dragPan,
      map.scrollZoom,
      map.dragRotate,
      map.touchZoomRotate,
      map.doubleClickZoom,
      map.keyboard
    ];
    controls.forEach(control => control.disable());
  };

  disableControls();

  // Optimize user marker creation
  const createUserMarker = () => {
    const userAvatarEl = document.createElement('div');
    userAvatarEl.className = 'user-arrow';
    return new maplibregl.Marker({
      element: userAvatarEl,
      anchor: 'center',
      rotationAlignment: 'map',
      scale: 1.2
    }).setLngLat(DEFAULT_LOCATION).addTo(map);
  };

  userMarkerRef.current = createUserMarker();

  // Optimize loading check
  const loadStates = { tiles: false, style: false };
  const checkLoading = () => {
    if (loadStates.tiles && loadStates.style) {
      setIsMapLoading(false);
    }
  };

  map.once('load', () => {
    map.getCanvas().style.filter = "grayscale(100%)";
    loadStates.style = true;
    checkLoading();
    startWatchingLocation(map);
  });

  map.once('idle', () => {
    loadStates.tiles = true;
    checkLoading();
  });

  map.on('error', () => {
    console.error('Map loading error');
    setIsMapLoading(false);
  });

  // Preload surrounding tiles
  const preloadTiles = () => {
    const center = map.getCenter();
    const zoom = map.getZoom();
    
    // Force load surrounding tiles
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const lat = center.lat + (i * 0.1);
        const lng = center.lng + (j * 0.1);
        map.setCenter([lng, lat]);
      }
    }
    
    // Reset to original position
    map.setCenter([center.lng, center.lat]);
    map.setZoom(zoom);
  };

  map.on('load', preloadTiles);

  // Hide the modal when the map moves
  map.on("move", () => {
    setShowPreviewPopup(false); // Hide the mini modal
    setPreviewNode(null); // Reset the preview node
  });

  return () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    map.remove();
    mapInstanceRef.current = null;
  };
}, []);


  /**
   * 4) Whenever `nodes` changes, we remove old markers and add new ones.
   */
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove existing markers from the map
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    nodes.forEach((node) => {
      const markerEl = document.createElement("div");
      markerEl.className = `map-marker ${node.isLoobricate ? 'loobricate' : ''}`;

      // Create the marker with a consistent anchor point
      const marker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
        .setLngLat([node.lon, node.lat])
        .addTo(map);

      // Add click event listener
      marker.getElement().addEventListener("click", () => {
        selectNode(map, node);
      });

      markersRef.current.push(marker);
    });

    // Update marker positions on map move and zoom
    const updateMarkerPositions = () => {
      markersRef.current.forEach((marker, index) => {
        const node = nodes[index];
        if (node) {
          marker.setLngLat([node.lon, node.lat]);
        }
      });
    };

    map.on('move', updateMarkerPositions);
    map.on('zoom', updateMarkerPositions);

    return () => {
      map.off('move', updateMarkerPositions);
      map.off('zoom', updateMarkerPositions);
    };
  }, [nodes]);

  /**
   * Enhanced permission handling
   */
  useEffect(() => {
    const handlePermissions = async () => {
      try {
        const permissionState = await requestLocationPermission();
        setLocationPermissionState(permissionState);

        if (permissionState === 'granted') {
          const map = mapInstanceRef.current;
          if (map) {
            startWatchingLocation(map);
          }
        } else {
          setLocationError('To see your location, enable location services in your device settings.');
        }
      } catch (error) {
        console.error('Error handling permissions:', error);
        setLocationError('Unable to access location services. You can still use the map without location.');
      }
    };

    handlePermissions();
  }, []);

  /**
   * Enhanced location watching with better error handling
   */
  const startWatchingLocation = useCallback((map: maplibregl.Map) => {
    if (!navigator.geolocation) {
      setLocationError('Location services are not supported by your browser.');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 30000, // Increased timeout for better mobile support
      maximumAge: 0
    };

    // Clear any existing watch
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { longitude, latitude, accuracy } = coords;
        const newPosition: [number, number] = [longitude, latitude];
        
        setCurrentLocation(newPosition);
        setLocationError(null);

        if (userMarkerRef.current) {
          const currentPos = userMarkerRef.current.getLngLat();
          smoothlyUpdatePosition(
            [currentPos.lng, currentPos.lat],
            newPosition,
            map,
            userMarkerRef.current
          );
        }

        // Update accuracy circle
        updateAccuracyCircle(map, newPosition, accuracy);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        let errorMessage: string = GEOLOCATION_ERRORS.GENERAL;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied. You can still use the map without location.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Unable to determine your location. Please check your device settings.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            // Retry after timeout
            setTimeout(() => startWatchingLocation(map), 2000);
            break;
        }
        
        setLocationError(errorMessage);
      },
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  /**
   * Enhanced accuracy circle
   */
  const updateAccuracyCircle = useCallback((
    map: maplibregl.Map,
    center: [number, number],
    accuracy: number
  ) => {
    const circleId = 'accuracy-circle';
    const circleColor = '#ffb6b9';
    
    if (!map.getSource(circleId)) {
      map.addSource(circleId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: center
          },
          properties: {
            accuracy
          }
        }
      });

      map.addLayer({
        id: circleId,
        type: 'circle',
        source: circleId,
        paint: {
          'circle-radius': ['get', 'accuracy'],
          'circle-color': circleColor,
          'circle-opacity': 0.2,
          'circle-stroke-width': 2,
          'circle-stroke-color': circleColor,
          'circle-stroke-opacity': 0.4
        }
      });
    } else {
      const source = map.getSource(circleId) as maplibregl.GeoJSONSource;
      source.setData({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: center
        },
        properties: {
          accuracy
        }
      });
    }
  }, []);

  /**
   * 6) Node selection logic -> popup
   */
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
      setPopupPosition({
        x: screenPos.x,
        y: screenPos.y,
      });
    });
  }, []);
  
  function adjustPopupPositionToScreen(
    screenPos: maplibregl.PointLike,
    map: maplibregl.Map
  ): { x: number; y: number } {
    if (!(screenPos instanceof maplibregl.Point)) {
      return { x: 0, y: 0 };
    }
    const { x, y } = screenPos;
    const bounds = map.getContainer().getBoundingClientRect();
    return {
      x: Math.min(Math.max(x, 50), bounds.width - 50),
      y: Math.min(Math.max(y - 30, 50), bounds.height - 50),
    };
  }

  /**
   * 7) Render sphere by visualType
   */
  const renderSphereForNode = (node: Node) => {
    return <TorusSphere loobricateId={node.id} />;
  };

  /**
   * 8) Logic for AddVenueModal
   */
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
      dataType: "User-created"
    };

    setNodes((prev) => [...prev, newNode]);
    setShowAddVenueModal(false);

    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo({ center: [lon, lat], zoom: 14 });
    }
  };

  /**
   * 9) Show venue profile
   */
  const handleShowOfferingProfile = (node: Node) => {
    setActiveNode(node);
    setShowOfferingProfile(true);
  };

  /**
   * 10) Sidebar toggle
   */
  const toggleSidebar = () => setSidebarActive((prev) => !prev);

  // Update the recenter button click handler
  const handleRecenter = () => {
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.flyTo({
        center: currentLocation,
        pitch: MAP_PITCH,
        bearing: 0,
        zoom: INITIAL_ZOOM,
        duration: 1000,
        essential: true // This makes the animation smoother
      });
    }
  };

  // Add this button component near your other UI elements
  const LocationButton = () => (
    <button 
      className="location-button"
      onClick={async () => {
        const permission = await requestLocationPermission();
        if (permission === 'granted' && mapInstanceRef.current) {
          startWatchingLocation(mapInstanceRef.current);
        }
      }}
    >
      Enable Location
    </button>
  );

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="map-layer" />

      {/* Location error message */}
      {locationError && (
        <div className="location-error-message">
          <div className="error-content">
            <span>{locationError}</span>
            <button 
              onClick={() => {
                setLocationError(null);
                const map = mapInstanceRef.current;
                if (map) {
                  startWatchingLocation(map);
                }
              }}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Only show tilt controls on desktop */}
      {window.innerWidth > 768 && (
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
      )}

      {/* Enhanced recenter button */}
      <button 
        className={`recenter-button ${
          currentLocation && 
          mapInstanceRef.current?.getCenter().toString() !== currentLocation.toString() 
          ? 'not-centered' 
          : ''
        }`}
        onClick={handleRecenter}
        aria-label="Center on my location"
      >
        <div className="recenter-icon" />
      </button>

      {isMapLoading && (
        <div className="map-loading-overlay">
          <div className="map-spinner" />
        </div>
      )}

      <MapSidebar
        nodes={nodes}
        sidebarActive={sidebarActive}
        toggleSidebar={toggleSidebar}
        onNodeSelect={(node) => {
          const map = mapInstanceRef.current;
          if (map) {
            selectNode(map, node);
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
            <div className="sphere-preview">{renderSphereForNode(previewNode)}</div>
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
            offeringType: (activeNode.type.toLowerCase() as 'venue' | 'gear' | 'talent'),
            createdAt: activeNode.createdAt || new Date().toISOString(),
            location: activeNode.location,
            pseudonym: activeNode.pseudonym,
            email: activeNode.email,
            phone: activeNode.phone,
            tags: activeNode.tags,
            loobricates: activeNode.loobricates,
            dataType: activeNode.dataType
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
          // Show celebration animation
          // Update user's LOOB balance
          console.log(`Found ${amount} LOOB!`);
        }}
      />

      <LocationButton />
    </div>
  );
};

export default Map;