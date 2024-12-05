import React, { useState, useRef } from 'react';
import TorusSphere from './Torusphere';

const Map: React.FC = () => {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Nodes with coordinates and labels
  const nodes = [
    { id: 'Berghain', x: 20, y: 80, label: 'Berghain', color: '#f8b195', vibe: 'Vibe: Pulsating beats and untamed energy' },
    { id: 'Sisyphos', x: 60, y: 150, label: 'Sisyphos', color: '#f67280', vibe: 'Vibe: Endless party with an outdoor twist' },
    { id: 'Tresor', x: 120, y: 220, label: 'Tresor', color: '#f8a5b3', vibe: 'Vibe: Industrial techno wonderland' },
    { id: 'KitKat', x: 200, y: 100, label: 'KitKat', color: '#fab1a0', vibe: 'Vibe: Playful freedom, let your wild side out' },
    { id: 'Watergate', x: 280, y: 250, label: 'Watergate', color: '#ff9f80', vibe: 'Vibe: Riverside views and hypnotic rhythms' },
    { id: 'Ritter Butzke', x: 340, y: 170, label: 'Ritter Butzke', color: '#f6bdc0', vibe: 'Vibe: Hidden gem with eclectic vibes' },
    { id: 'Aethos', x: 420, y: 80, label: 'Aethos', color: '#f5a7a1', vibe: 'Vibe: Mystical beats in an intimate setting' },
    { id: 'MOOS', x: 480, y: 200, label: 'MOOS', color: '#ffcdb2', vibe: 'Vibe: Community-driven creativity and music' },
    { id: 'Neon Spire', x: 540, y: 50, label: 'Neon Spire', color: '#ffa69e', vibe: 'Vibe: Neon lights and futuristic sounds' },
    { id: 'Club der Visionaere', x: 600, y: 180, label: 'Club der Visionaere', color: '#ffc3a0', vibe: 'Vibe: Chill riverside grooves under the stars' },
  ];

  // Links between nodes
  const links = [
    { source: 'Berghain', target: 'Sisyphos' },
    { source: 'Sisyphos', target: 'Tresor' },
    { source: 'Tresor', target: 'KitKat' },
    { source: 'KitKat', target: 'Watergate' },
    { source: 'Watergate', target: 'Ritter Butzke' },
    { source: 'Ritter Butzke', target: 'Aethos' },
    { source: 'Aethos', target: 'MOOS' },
    { source: 'MOOS', target: 'Neon Spire' },
    { source: 'Neon Spire', target: 'Club der Visionaere' },
    { source: 'Club der Visionaere', target: 'Berghain' },
  ];

  const findNode = (id: string) => nodes.find((node) => node.id === id);

  return (
    <div className="flex flex-col w-full h-full bg-black md:flex-row">
      {/* Sidebar with node information */}
      <div className="w-full md:w-1/4 h-auto md:h-full p-4 text-white bg-black overflow-auto sticky top-0">
        <h2 className="text-xl font-bold mb-4 bg-black p-4 sticky top-0 z-10">Locations</h2>
        <div className="flex flex-col gap-6">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="mb-4 p-4 cursor-pointer hover:bg-gray-800 rounded border border-gray-700"
              onClick={() => setActiveNode(node.label)}
            >
              <div className="text-lg font-semibold" style={{ color: node.color }}>{node.label}</div>
              <div className="text-sm text-gray-400 mt-2">{node.vibe}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="w-full md:w-3/4 h-full relative flex items-center justify-center">
        <svg ref={svgRef} viewBox="0 0 640 360" className="w-full h-full">
          <g>
            {/* Links */}
            {links.map((link, index) => {
              const source = findNode(link.source);
              const target = findNode(link.target);
              if (!source || !target) return null;

              return (
                <line
                  key={index}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.7"
                  style={{ filter: 'drop-shadow(0 0 10px orange)' }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => (
              <g
                key={node.id}
                className="node"
                onClick={() => setActiveNode(node.label)}
              >
                {/* Circle for node with 3D illusion */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="20"
                  fill={`url(#gradient-${node.id})`}
                  className="cursor-pointer"
                  style={{ filter: 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.5))' }}
                />
                {/* Gradient for 3D effect */}
                <defs>
                  <radialGradient id={`gradient-${node.id}`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: node.color, stopOpacity: 1 }} />
                  </radialGradient>
                </defs>
                {/* Node label */}
                <text
                  x={node.x + 25}
                  y={node.y + 5}
                  fontSize="12"
                  fill="white"
                  opacity="0.9"
                >
                  {node.label}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {/* Modal */}
        {activeNode && (
          <div
            className="absolute top-1/2 left-1/2 w-80 h-80 rounded-lg shadow-lg border border-gray-700 flex flex-col items-center justify-center p-4"
            style={{
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(0, 0, 0, 0.7)', // Transparent background
            }}
          >
            <div className="w-full flex justify-end">
              <button
                className="text-white text-lg"
                onClick={() => setActiveNode(null)}
              >
                &times;
              </button>
            </div>
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="text-center text-white mb-2 text-xl font-semibold">{activeNode}</div>
              <div className="w-full h-full flex items-center justify-center">
                <TorusSphere />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Map;