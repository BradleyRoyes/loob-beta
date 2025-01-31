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
import {
  checkPermission,
  requestLocationPermission,
  getPermissionInstructions,
} from "../utils/permissions";
import { useGeolocation } from "./hooks/useGeolocation";
import debounce from "lodash/debounce";

import TorusSphere from "./TorusSphere";
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

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

type GeolocationPermissionState = "prompt" | "granted" | "denied";

interface LocationError {
  type: "permission" | "unavailable" | "timeout";
  message: string;
}

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8 as 8,
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
        "raster-brightness-min": 0.2
      }
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

const smoothlyUpdatePosition = (
  currentPos: [number, number],
  newPos: [number, number],
  map: maplibregl.Map,
  marker: maplibregl.Marker
) => {
  const start = currentPos;
  const end = newPos;
  const steps = 60;
  let step = 0;

  const animate = () => {
    step++;
    const progress = step / steps;
    const lat = start[1] + (end[1] - start[1]) * progress;
    const lng = start[0] + (end[0] - start[0]) * progress;

    marker.setLngLat([lng, lat]);

    if (
      map.getCenter().lng.toFixed(6) === lng.toFixed(6) &&
      map.getCenter().lat.toFixed(6) === lat.toFixed(6)
    ) {
      map.setCenter([lng, lat]);
    }

    if (step < steps) {
      requestAnimationFrame(animate);
    }
  };

  animate();
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
  const watchIdRef = useRef<number | null>(null);
  const [locationPermissionState, setLocationPermissionState] = useState<PermissionState>("prompt");
  const [mapPitch, setMapPitch] = useState(0);
  const [locationError, setLocationError] = useState<LocationError | null>(null);
  const isMapMoving = useRef(false);
  const [deviceOrientation, setDeviceOrientation] = useState<number>(0);

  // Use the geolocation hook at component level.
  // Rename error to geoError to avoid naming conflicts.
  const { location, accuracy, heading, error: geoError } = useGeolocation(
    mapInstanceRef.current,
    userMarkerRef.current
  );

  useEffect(() => {
    if (location) {
      setCurrentLocation(location);
      if (mapInstanceRef.current) {
        updateAccuracyCircle(mapInstanceRef.current, location, accuracy || 0);
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

  const startWatchingLocation = useCallback(
    async (map: maplibregl.Map) => {
      if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by this browser");
        return;
      }

      const permissionState = await checkPermission("geolocation");
      setLocationPermissionState(permissionState);
      if (permissionState === "denied") {
        return;
      }

      let hasRequestedPermission = false;
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      };

      const handleSuccess = ({ coords }: GeolocationPosition) => {
        const { longitude, latitude, heading, accuracy } = coords;
        const newPosition: [number, number] = [longitude, latitude];
        setCurrentLocation(newPosition);

        if (userMarkerRef.current) {
          if (isMapMoving.current) {
            userMarkerRef.current.setLngLat(newPosition);
          } else {
            const currentPos = userMarkerRef.current.getLngLat();
            smoothlyUpdatePosition(
              [currentPos.lng, currentPos.lat],
              newPosition,
              map,
              userMarkerRef.current
            );
          }

          if (heading !== null) {
            userMarkerRef.current.setRotation(heading);
          }
        }

        updateAccuracyCircle(map, [longitude, latitude], accuracy);
      };

      const handleError = (error: GeolocationPositionError) => {
        let locError: LocationError;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            locError = {
              type: "permission",
              message: "Location access was denied. You can enable it in your settings.",
            };
            break;
          case error.POSITION_UNAVAILABLE:
            locError = {
              type: "unavailable",
              message: "Location information is unavailable. Please check your device settings.",
            };
            break;
          case error.TIMEOUT:
            locError = {
              type: "timeout",
              message: "Location request timed out. Please try again.",
            };
            break;
          default:
            locError = {
              type: "unavailable",
              message: "An unknown error occurred while getting location.",
            };
        }

        if (!hasRequestedPermission) {
          setLocationError(locError);
          hasRequestedPermission = true;
        }

        if (error.code === error.PERMISSION_DENIED && watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      );
    },
    []
  );

  const handleDeviceOrientation = useCallback((event: DeviceOrientationEventWithWebkit) => {
    if (event.webkitCompassHeading) {
      setDeviceOrientation(event.webkitCompassHeading);
    } else if (event.alpha) {
      setDeviceOrientation(360 - event.alpha);
    }
  }, []);

  useEffect(() => {
    if (window.DeviceOrientationEvent) {
      if (
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        // iOS 13+ devices need to request permission
        document.addEventListener('click', async () => {
          try {
            const permission = await (DeviceOrientationEvent as any).requestPermission();
            if (permission === 'granted') {
              window.addEventListener('deviceorientation', handleDeviceOrientation);
            }
          } catch (error) {
            console.error('Error requesting device orientation permission:', error);
          }
        }, { once: true });
      } else {
        // Non-iOS devices
        window.addEventListener('deviceorientation', handleDeviceOrientation);
      }
    }

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
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

    mapInstanceRef.current = map;

    const createUserMarker = () => {
      const userAvatarEl = document.createElement("div");
      userAvatarEl.className = "user-arrow";
      return new maplibregl.Marker({
        element: userAvatarEl,
        anchor: "center",
        rotationAlignment: "map",
        pitchAlignment: "map",
        scale: 1.2,
      })
        .setLngLat(DEFAULT_LOCATION)
        .addTo(map);
    };

    userMarkerRef.current = createUserMarker();

    const debouncedResize = debounce(() => {
      map.resize();
    }, 250);

    window.addEventListener("resize", debouncedResize);

    // When the map is ready, start watching location.
    map.on("load", () => {
      setIsMapLoading(false);
      startWatchingLocation(map);
    });

    map.on("movestart", () => {
      isMapMoving.current = true;
    });

    map.on("moveend", () => {
      isMapMoving.current = false;
    });

    // Add bearing change handler
    map.on('rotate', () => {
      if (!window.DeviceOrientationEvent && userMarkerRef.current) {
        // Only update rotation based on map bearing for desktop
        userMarkerRef.current.setRotation(map.getBearing());
      }
    });

    return () => {
      window.removeEventListener("resize", debouncedResize);
      debouncedResize.cancel();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      map.off("movestart", () => {
        isMapMoving.current = true;
      });
      map.off("moveend", () => {
        isMapMoving.current = false;
      });
    };
  }, [startWatchingLocation]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add markers
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

    // Only update markers when movement ends
    const updateMarkerPositions = () => {
      if (!isMapMoving.current) {
        markersRef.current.forEach((marker, index) => {
          const node = nodes[index];
          if (node) {
            marker.setLngLat([node.lon, node.lat]);
          }
        });
      }
    };

    map.on("moveend", updateMarkerPositions);

    return () => {
      map.off("moveend", updateMarkerPositions);
    };
  }, [nodes]);

  const selectNode = useCallback((map: maplibregl.Map, node: Node) => {
    isMapMoving.current = true;
    map.flyTo({
      center: [node.lon, node.lat],
      zoom: 14,
      speed: 0.8,
      curve: 1,
    });

    map.once("moveend", () => {
      isMapMoving.current = false;
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

  const renderSphereForNode = (node: Node) => {
    return <TorusSphere loobricateId={node.id} />;
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
      isMapMoving.current = true;
      mapInstanceRef.current.flyTo({
        center: currentLocation,
        pitch: MAP_PITCH,
        bearing: 0,
        zoom: INITIAL_ZOOM,
        duration: 1000,
        essential: true,
      });
      mapInstanceRef.current.once("moveend", () => {
        isMapMoving.current = false;
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

  const updateAccuracyCircle = (
    map: maplibregl.Map,
    center: [number, number],
    accuracy: number
  ) => {
    const circleId = "accuracy-circle";

    if (!map.getSource(circleId)) {
      map.addSource(circleId, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: center,
          },
          properties: {
            accuracy,
          },
        },
      });

      map.addLayer({
        id: circleId,
        type: "circle",
        source: circleId,
        paint: {
          "circle-radius": ["get", "accuracy"],
          "circle-color": "#4264fb",
          "circle-opacity": 0.2,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#4264fb",
        },
      });
    } else {
      const source = map.getSource(circleId) as maplibregl.GeoJSONSource;
      source.setData({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: center,
        },
        properties: {
          accuracy,
        },
      });
    }
  };

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
          {error.type !== "permission" && (
            <button className="retry-button" onClick={onRetry}>
              Try Again
            </button>
          )}
          <button className="dismiss-button" onClick={onDismiss}>
            Dismiss
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

      {window.innerWidth < 768 && !currentLocation && (
        <div style={mobileOverlayStyle}>
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                startWatchingLocation(mapInstanceRef.current);
              }
            }}
            style={{
              padding: "12px 24px",
              fontSize: "1rem",
              borderRadius: "4px",
            }}
          >
            Enable Location
          </button>
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

      <button
        className={`recenter-button ${
          currentLocation &&
          mapInstanceRef.current?.getCenter().toString() !== currentLocation.toString()
            ? "not-centered"
            : ""
        }`}
        onClick={handleRecenter}
        aria-label="Center on my location"
      >
        <div className="recenter-icon" />
      </button>

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

      {locationError && (
        <LocationErrorMessage
          error={locationError}
          onRetry={() => {
            setLocationError(null);
            if (mapInstanceRef.current) {
              startWatchingLocation(mapInstanceRef.current);
            }
          }}
          onDismiss={() => setLocationError(null)}
        />
      )}
    </div>
  );
};

export default Map;
