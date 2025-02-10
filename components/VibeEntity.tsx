import React, { useEffect, useRef, useState, useCallback } from 'react';
import Pusher, { Channel } from 'pusher-js';

// Enhanced interfaces for state management
interface VibeState {
  quaternion: [number, number, number, number];
  nodes: NodeState[];
  lastUpdate: number;
}

interface NodeState {
  position: [number, number, number];
  personality: NodePersonality;
  age: number;
}

interface NodePersonality {
  mood: string;
  energy: number;
  color: string;
  size: number;
  velocity: {
    x: number;
    y: number;
    z: number;
  };
  sentiment: number;
  intensity: number;
}

class Node {
  position: [number, number, number];
  personality: NodePersonality;
  age: number;
  connections: Node[];
  targetPosition: [number, number, number];
  
  constructor(position: [number, number, number], personality: NodePersonality) {
    this.position = position;
    this.personality = personality;
    this.age = 0;
    this.connections = [];
    this.targetPosition = [...position];
    this.setNewTarget(); // Initialize with a target
  }

  setNewTarget() {
    // Create a new target position with more organic, random movement patterns
    const randomFactor = 1.2; // Increased range of movement
    const noiseOffset = Math.sin(this.age * 0.5) * 0.3; // Adds some noise to movement
    
    this.targetPosition = [
      this.position[0] + (Math.random() - 0.5) * randomFactor + noiseOffset,
      this.position[1] + (Math.random() - 0.5) * randomFactor + noiseOffset,
      this.position[2] + (Math.random() - 0.5) * randomFactor
    ];

    // Occasionally make dramatic moves
    if (Math.random() < 0.1) {
      const dramaticDirection = Math.floor(Math.random() * 3);
      this.targetPosition[dramaticDirection] *= 2;
    }
  }

  update(dt: number) {
    // Organic movement towards target
    const moveSpeed = 0.2;
    for (let i = 0; i < 3; i++) {
      const diff = this.targetPosition[i] - this.position[i];
      this.position[i] += diff * moveSpeed * dt;
    }

    // Set new target if we're close to current target
    const distanceToTarget = Math.sqrt(
      this.targetPosition.reduce((sum, curr, i) => 
        sum + Math.pow(curr - this.position[i], 2), 0)
    );
    
    if (distanceToTarget < 0.1) {
      this.setNewTarget();
    }
    
    // Bounce off boundaries with organic dampening
    [-1, 1].forEach((bound, i) => {
      if (Math.abs(this.position[i]) > 1) {
        this.position[i] = bound * 0.95; // Pull slightly away from edge
        this.targetPosition[i] *= -0.5; // Reflect target with dampening
      }
    });

    // Age the node
    this.age += dt;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const x = (this.position[0] + 1) * width / 2;
    const y = (this.position[1] + 1) * height / 2;
    const baseSize = this.personality.size * Math.min(width, height) / 25;
    const pulseSize = baseSize * (1 + 0.3 * Math.sin(this.age * 1.5));
    
    // Draw mycelial connections with organic fade
    ctx.beginPath();
    this.connections.forEach(node => {
      const nx = (node.position[0] + 1) * width / 2;
      const ny = (node.position[1] + 1) * height / 2;
      
      // Create organic curves between nodes
      const midX = (x + nx) / 2 + (Math.sin(this.age * 2) * 20);
      const midY = (y + ny) / 2 + (Math.cos(this.age * 2) * 20);
      
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(midX, midY, nx, ny);
    });
    ctx.strokeStyle = `${this.personality.color.replace(')', ', 0.15)')}`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw organic glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, pulseSize * 3);
    gradient.addColorStop(0, `${this.personality.color.replace(')', ', 0.2)')}`);
    gradient.addColorStop(0.5, `${this.personality.color.replace(')', ', 0.05)')}`);
    gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, pulseSize * 3, 0, Math.PI * 2);
    ctx.fill();

    // Draw node core with organic shape
    ctx.fillStyle = this.personality.color;
    ctx.beginPath();
    const angleStep = (Math.PI * 2) / 8;
    for (let i = 0; i < 8; i++) {
      const angle = i * angleStep + this.age;
      const radius = pulseSize * (0.9 + Math.sin(angle * 3) * 0.1);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}

const generatePersonality = (sentiment: number = 0, intensity: number = 0.5): NodePersonality => {
  // Generate pastel pink/orange colors
  const baseHue = 15 + Math.random() * 25; // Orange base (15-40)
  const isRosy = Math.random() > 0.5;
  const hue = isRosy ? (340 + Math.random() * 30) : baseHue; // Mix of pinks (340-370) and oranges
  const saturation = 70 + intensity * 20; // Softer saturation for pastels
  const lightness = 75 + intensity * 15; // Higher lightness for pastels
  
  return {
    mood: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral',
    energy: intensity,
    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    size: 0.3 + intensity * 0.4, // Slightly smaller nodes
    velocity: {
      x: (Math.random() - 0.5) * 0.1, // Slower movement
      y: (Math.random() - 0.5) * 0.1,
      z: (Math.random() - 0.5) * 0.1
    },
    sentiment,
    intensity
  };
};

export interface VibeEntityProps {
  entityId?: string;
  initialState?: VibeState;
  onStateUpdate?: (state: VibeState) => void;
  className?: string;
}

const INITIAL_NODES = 20;
const MAX_NODES = 60;
const STATE_UPDATE_INTERVAL = 5000;
const MAX_CONNECTIONS = 4;
const MIN_CONNECTIONS = 2;

const VibeEntity: React.FC<VibeEntityProps> = ({ 
  entityId, 
  initialState, 
  onStateUpdate,
  className 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationFrameRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const pusherRef = useRef<Pusher | null>(null);
  const channelRef = useRef<Channel | null>(null);
  const [quaternion, setQuaternion] = useState<[number, number, number, number]>(
    initialState?.quaternion || [1, 0, 0, 0]
  );

  // Initialize nodes
  useEffect(() => {
    // Create initial nodes in a more organic pattern
    for (let i = 0; i < INITIAL_NODES; i++) {
      const angle = (i / INITIAL_NODES) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.3;
      const position: [number, number, number] = [
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        (Math.random() - 0.5) * 0.5
      ];
      const personality = generatePersonality(
        Math.random() * 2 - 1,
        0.3 + Math.random() * 0.4 // More moderate intensities
      );
      nodesRef.current.push(new Node(position, personality));
    }

    // Create organic connections
    nodesRef.current.forEach(node => {
      const numConnections = MIN_CONNECTIONS + 
        Math.floor(Math.random() * (MAX_CONNECTIONS - MIN_CONNECTIONS + 1));
      
      // Find nearest nodes for more organic connections
      const others = [...nodesRef.current]
        .filter(n => n !== node)
        .sort((a, b) => {
          const distA = Math.sqrt(
            node.position.reduce((sum, curr, i) => 
              sum + Math.pow(curr - a.position[i], 2), 0)
          );
          const distB = Math.sqrt(
            node.position.reduce((sum, curr, i) => 
              sum + Math.pow(curr - b.position[i], 2), 0)
          );
          return distA - distB;
        });

      // Connect to nearest nodes
      for (let i = 0; i < numConnections && i < others.length; i++) {
        node.connections.push(others[i]);
        others[i].connections.push(node);
      }
    });
  }, []);

  // Animation loop
  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Update canvas size with device pixel ratio handling
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);
      }

      // Clear canvas with complete transparency
      ctx.clearRect(0, 0, width, height);

      // Calculate delta time
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Add some global movement influence
      const globalInfluence = {
        x: Math.sin(now * 0.001) * 0.1,
        y: Math.cos(now * 0.001) * 0.1
      };

      // Update and draw nodes with added influence
      nodesRef.current.forEach(node => {
        // Add subtle global movement influence
        node.position[0] += globalInfluence.x * dt;
        node.position[1] += globalInfluence.y * dt;
        
        node.update(dt);
        node.draw(ctx, width, height);
      });

      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Set up Pusher subscription with proper cleanup
  useEffect(() => {
    if (!entityId) return;

    // Initialize Pusher with enabledTransports to avoid using WebSockets fallbacks
    pusherRef.current = new Pusher('facc28e7df1eec1d7667', {
      cluster: 'eu',
      enabledTransports: ['ws', 'wss']
    });

    // Subscribe to channel
    channelRef.current = pusherRef.current.subscribe(`user-${entityId}`);
    
    // Bind event handler
    const handleVibeUpdate = (data: any) => {
      if (data.entityId === entityId) {
        const position: [number, number, number] = [
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        ];
        const personality = generatePersonality(data.sentiment, data.intensity);
        const newNode = new Node(position, personality);

        // Connect to existing nodes
        const numConnections = Math.floor(Math.random() * MAX_CONNECTIONS) + 1;
        const existingNodes = [...nodesRef.current];
        for (let i = 0; i < numConnections; i++) {
          if (existingNodes.length > 0) {
            const randomIndex = Math.floor(Math.random() * existingNodes.length);
            const connection = existingNodes.splice(randomIndex, 1)[0];
            newNode.connections.push(connection);
            connection.connections.push(newNode);
          }
        }

        // Add the new node
        nodesRef.current.push(newNode);

        // Remove oldest node if we're over the limit
        if (nodesRef.current.length > MAX_NODES) {
          const oldestNode = nodesRef.current.shift();
          // Remove connections to the removed node
          nodesRef.current.forEach(node => {
            node.connections = node.connections.filter(n => n !== oldestNode);
          });
        }
      }
    };

    channelRef.current.bind('vibe-update', handleVibeUpdate);

    // Cleanup function
    return () => {
      if (channelRef.current) {
        channelRef.current.unbind('vibe-update', handleVibeUpdate);
        if (pusherRef.current) {
          pusherRef.current.unsubscribe(`user-${entityId}`);
        }
      }
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      channelRef.current = null;
    };
  }, [entityId]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ 
        width: '100%',
        height: '100%',
        background: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
      }} 
    />
  );
};

export default VibeEntity; 