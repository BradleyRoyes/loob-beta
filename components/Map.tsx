'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import TorusSphere from './TorusSphere';
import TorusSphereWeek from './TorusSphereWeek';
import TorusSphereAll from './TorusSphereAll';

type VisualType = 'Today' | 'ThisWeek' | 'AllTime';

interface Node {
  id: string;
  lat: number;
  lon: number;
  label: string;
  vibe: string;
  visualType: VisualType;
}

const Map: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  const [activeNode, setActiveNode] = useState<Node | null>(null);
  const [nodes, setNodes] = useState<Node[]>([
    { id: 'Berghain', lat: 52.511, lon: 13.438, label: 'Berghain', vibe: 'Pulsating beats and untamed energy', visualType: 'Today' },
    { id: 'Sisyphos', lat: 52.520, lon: 13.462, label: 'Sisyphos', vibe: 'Endless party with an outdoor twist', visualType: 'ThisWeek' },
    { id: 'Tresor', lat: 52.512, lon: 13.428, label: 'Tresor', vibe: 'Industrial techno wonderland', visualType: 'AllTime' },
    { id: 'KitKat', lat: 52.513, lon: 13.432, label: 'KitKat', vibe: 'Playful freedom, let your wild side out', visualType: 'Today' },
  ]);

  useEffect(() => {
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors.',
            },
          },
          layers: [
            {
              id: 'osm-tiles',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [13.405, 52.52], // Berlin Central
        zoom: 12,
      });

      // Add black-and-white filter using CSS
      map.on('load', () => {
        const mapCanvas = map.getCanvas();
        mapCanvas.style.filter = 'grayscale(100%)';
      });

      // Add initial markers
      nodes.forEach((node) => {
        new maplibregl.Marker()
          .setLngLat([node.lon, node.lat])
          .addTo(map)
          .getElement()
          .addEventListener('click', () => {
            setActiveNode(node);
          });
      });

      mapInstanceRef.current = map;
    }
  }, [nodes]);

  const handleNodeClick = (node: Node) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({ center: [node.lon, node.lat], zoom: 14 });
    }
    setActiveNode(node);
  };

  const handleAddNode = () => {
    const newNode: Node = {
      id: `Node${nodes.length + 1}`,
      lat: 52.52 + Math.random() * 0.01,
      lon: 13.405 + Math.random() * 0.01,
      label: `New Venue ${nodes.length + 1}`,
      vibe: 'A new user-generated vibe',
      visualType: ['Today', 'ThisWeek', 'AllTime'][Math.floor(Math.random() * 3)] as VisualType, // Ensures type safety
    };
    setNodes((prev) => [...prev, newNode]);

    // Add marker dynamically
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      new maplibregl.Marker()
        .setLngLat([newNode.lon, newNode.lat])
        .addTo(map)
        .getElement()
        .addEventListener('click', () => {
          setActiveNode(newNode);
        });
    }
  };

  return (
    <div className="flex flex-row h-screen">
      {/* Sidebar */}
      <div className="w-1/3 bg-black text-white p-4 overflow-auto">
        <h2 className="text-xl font-bold mb-4">Locations</h2>
        <button
          className="button-primary mb-4"
          onClick={handleAddNode}
        >
          Add New Venue
        </button>
        <div className="flex flex-col gap-4">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="p-4 cursor-pointer hover:bg-gray-800 rounded border border-gray-700"
              onClick={() => handleNodeClick(node)}
            >
              <div className="text-lg font-semibold">{node.label}</div>
              <div className="text-sm text-gray-400">{node.vibe}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="w-2/3 relative">
        <div ref={mapContainerRef} className="w-full h-full"></div>

        {/* Modal for Active Node */}
        {activeNode && (
          <div
            className="absolute bg-black shadow-lg rounded-lg p-6 w-96 h-auto"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
            }}
          >
            <button
              className="absolute top-2 right-2 text-white hover:text-gray-400"
              onClick={() => setActiveNode(null)}
            >
              &times;
            </button>
            <div className="text-center text-white text-xl font-semibold mb-4">{activeNode.label}</div>
            <div className="text-center text-gray-400 mb-4">{activeNode.vibe}</div>
            <div className="flex justify-center items-center w-full">
              {activeNode.visualType === 'Today' && <TorusSphere />}
              {activeNode.visualType === 'ThisWeek' && <TorusSphereWeek />}
              {activeNode.visualType === 'AllTime' && <TorusSphereAll />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;
