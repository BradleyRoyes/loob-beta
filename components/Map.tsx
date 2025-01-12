"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./Map.css";
import mockMapData, { Node } from "./MockMapData";
import TorusSphere from "./TorusSphere";
import TorusSphereWeek from "./TorusSphereWeek";
import TorusSphereAll from "./TorusSphereAll";
import VenueProfile from "./VenueProfile";
import MapSidebar from "./MapSidebar";
import AddVenueModal from "./AddVenueModal";

const DEFAULT_LOCATION: [number, number] = [13.405, 52.52]; // Berlin

const Map: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  const [nodes, setNodes] = useState<Node[]>(mockMapData);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [previewNode, setPreviewNode] = useState<Node | null>(null);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [showVenueProfile, setShowVenueProfile] = useState(false);
  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [showAddVenueModal, setShowAddVenueModal] = useState(false);
  const [sidebarActive, setSidebarActive] = useState(() => window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => setSidebarActive(window.innerWidth > 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getUserLocation = useCallback((map: maplibregl.Map) => {
    if (!navigator.geolocation) {
      fallbackToDefaultLocation(map);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const userLocation: [number, number] = [coords.longitude, coords.latitude];
        setCurrentLocation(userLocation);
        map.setCenter(userLocation);
        map.flyTo({ center: userLocation, zoom: 14 });
      },
      () => fallbackToDefaultLocation(map),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const fallbackToDefaultLocation = useCallback((map: maplibregl.Map) => {
    setCurrentLocation(DEFAULT_LOCATION);
    map.setCenter(DEFAULT_LOCATION);
    map.flyTo({ center: DEFAULT_LOCATION, zoom: 12 });
  }, []);

  const addMarkerForNode = useCallback((map: maplibregl.Map, node: Node) => {
    const markerEl = document.createElement("div");
    markerEl.className = "map-marker";

    new maplibregl.Marker({ element: markerEl })
      .setLngLat([node.lon, node.lat])
      .addTo(map)
      .getElement()
      .addEventListener("click", () => {
        selectNode(map, node);
      });
  }, []);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "Map data © <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors.",
            },
          },
          layers: [
            { id: "osm-tiles", type: "raster", source: "osm-tiles", minzoom: 0, maxzoom: 19 },
          ],
        },
        zoom: 12,
        center: DEFAULT_LOCATION,
      });

      mapInstanceRef.current = map;

      map.on("load", () => {
        map.getCanvas().style.filter = "grayscale(100%)";
        nodes.forEach((node) => addMarkerForNode(map, node));
      });

      getUserLocation(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [nodes, addMarkerForNode, getUserLocation]);

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

  const adjustPopupPositionToScreen = (
    screenPos: maplibregl.PointLike,
    map: maplibregl.Map
  ): { x: number; y: number } => {
    if (!(screenPos instanceof maplibregl.Point)) {
      return { x: 0, y: 0 };
    }
    const { x, y } = screenPos;
    const bounds = map.getContainer().getBoundingClientRect();
    return {
      x: Math.min(Math.max(x, 50), bounds.width - 50),
      y: Math.min(Math.max(y - 30, 50), bounds.height - 50),
    };
  };

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

    if (mapInstanceRef.current) {
      addMarkerForNode(mapInstanceRef.current, newNode);
      selectNode(mapInstanceRef.current, newNode);
    }
  };

  const handleShowVenueProfile = (node: Node) => {
    setActiveNode(node);
    setShowVenueProfile(true);
  };

  const toggleSidebar = () => setSidebarActive((prev) => !prev);

  return (
    <div className="map-container">
      <div ref={mapContainerRef} className="map-layer"></div>

      <MapSidebar
        nodes={nodes}
        sidebarActive={sidebarActive}
        toggleSidebar={toggleSidebar}
        onNodeSelect={(node) => {
          if (mapInstanceRef.current) {
            selectNode(mapInstanceRef.current, node);
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
              <h3 style={{ textAlign: "center", margin: "0 0 10px 0" }}>{previewNode.label}</h3>
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
          onClick={(e) => e.target === e.currentTarget && setShowVenueProfile(false)}
        >
          <div className="venue-profile-modal">
            <VenueProfile venue={activeNode} onClose={() => setShowVenueProfile(false)} />
          </div>
        </div>
      )}

      {currentLocation && (
        <button
          className="venue-selector-button"
          style={{ bottom: "60px" }}
          onClick={() => setShowAddVenueModal(true)}
          aria-label="Add a new venue"
        >
          Add Venue
        </button>
      )}

      {showAddVenueModal && (
        <AddVenueModal onClose={() => setShowAddVenueModal(false)} onConfirm={handleConfirmAddVenue} />
      )}
    </div>
  );
};

export default Map;
