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

// Child components (you already have these)
import TorusSphere from "./TorusSphere";
import TorusSphereWeek from "./TorusSphereWeek";
import TorusSphereAll from "./TorusSphereAll";
import VenueProfile from "./VenueProfile";
import MapSidebar from "./MapSidebar";
import AddVenueModal from "./AddVenueModal";

// Types
export type VisualView = "Today" | "ThisWeek" | "AllTime";

export interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;     // e.g. "Berghain"
  type: string;      // e.g. "Venue", "Gear", etc.
  details: string;   // e.g. description or details
  contact: string;   // e.g. "mailto:someone@example.com"
  visualType: VisualView; // "Today", "ThisWeek", "AllTime"
}

// Berlin center (longitude, latitude)
const DEFAULT_LOCATION: [number, number] = [13.405, 52.52];

const Map: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  // We'll store references to the markers so we can remove them if needed.
  const markersRef = useRef<Marker[]>([]);

  // Our array of nodes from DB
  const [nodes, setNodes] = useState<Node[]>([]);

  // Current user geolocation
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);

  // Pop-up / preview logic
  const [previewNode, setPreviewNode] = useState<Node | null>(null);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // Venue profile logic
  const [showVenueProfile, setShowVenueProfile] = useState(false);
  const [activeNode, setActiveNode] = useState<Node | null>(null);

  // "Add Venue" modal logic
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);

  // Sidebar logic
  const [sidebarActive, setSidebarActive] = useState(() => window.innerWidth > 768);

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

        const newNodes: Node[] = data.map((entry: any) => {
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

  const map = new maplibregl.Map({
    container: mapContainerRef.current,
    style: {
      version: 8,
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors.',
        },
      },
      layers: [
        {
          id: "osm-tiles",
          type: "raster",
          source: "osm-tiles",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
    center: DEFAULT_LOCATION,
    zoom: 12,
  });

  mapInstanceRef.current = map;

  // Add grayscale effect to the map on load
  map.on("load", () => {
    map.getCanvas().style.filter = "grayscale(100%)";
  });

  // Hide the modal when the map moves
  map.on("move", () => {
    setShowPreviewPopup(false); // Hide the mini modal
    setPreviewNode(null); // Reset the preview node
  });

  // Attempt to get user location once
  getUserLocation(map);

  // Cleanup if unmounted
  return () => {
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
      markerEl.className = "map-marker";

      const marker = new maplibregl.Marker({ element: markerEl })
        .setLngLat([node.lon, node.lat])
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        selectNode(map, node);
      });

      markersRef.current.push(marker);
    });
  }, [nodes]);

  /**
   * 5) Geolocation logic
   */
  const fallbackToDefaultLocation = useCallback((map: maplibregl.Map) => {
    setCurrentLocation(DEFAULT_LOCATION);
    map.setCenter(DEFAULT_LOCATION);
    map.flyTo({ center: DEFAULT_LOCATION, zoom: 12 });
  }, []);

  const getUserLocation = useCallback(
    (map: maplibregl.Map) => {
      if (!navigator.geolocation) {
        fallbackToDefaultLocation(map);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const userLoc: [number, number] = [coords.longitude, coords.latitude];
          setCurrentLocation(userLoc);
          map.setCenter(userLoc);
          map.flyTo({ center: userLoc, zoom: 14 });
        },
        () => fallbackToDefaultLocation(map),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    },
    [fallbackToDefaultLocation]
  );

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
      const popupPos = adjustPopupPositionToScreen(screenPos, map);
      setPopupPosition(popupPos);
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
    switch (node.visualType) {
      case "ThisWeek":
        return <TorusSphereWeek />;
      case "AllTime":
        return <TorusSphereAll />;
      default:
        return <TorusSphere />;
    }
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

    const newNode: Node = {
      id: `Node-${Date.now()}`,
      lat,
      lon,
      label: venueName,
      details: "User-created venue details.",
      contact: "mailto:info@usercreated.com",
      visualType: "Today",
      type: "Venue",
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
  const handleShowVenueProfile = (node: Node) => {
    setActiveNode(node);
    setShowVenueProfile(true);
  };

  /**
   * 10) Sidebar toggle
   */
  const toggleSidebar = () => setSidebarActive((prev) => !prev);

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="map-layer" />

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
        onMoreInfo={handleShowVenueProfile}
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
                handleShowVenueProfile(previewNode);
                setShowPreviewPopup(false);
              }}
              aria-label="Show more info"
            >
              More Info
            </button>
          </div>
        </div>
      )}

      {showVenueProfile && activeNode && (
        <div
          className="venue-profile-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowVenueProfile(false);
            }
          }}
        >
          <div className="venue-profile-modal">
            <VenueProfile
              venue={activeNode}
              onClose={() => setShowVenueProfile(false)}
            />
          </div>
        </div>
      )}

      {showAddVenueModal && (
        <AddVenueModal
          onClose={() => setShowAddVenueModal(false)}
          onConfirm={handleConfirmAddVenue}
        />
      )}
    </div>
  );
};

export default Map;
