import React, { useEffect, useRef } from 'react';
import Pusher from 'pusher-js';

interface NodePersonality {
  mood: string;
  energy: number;
  color: string;
  size: number;
  velocity: {
    x: number;
    y: number;
  };
}

class Node {
  x: number;
  y: number;
  personality: NodePersonality;
  age: number = 0;
  maxAge: number = 1000;
  targetX: number | null = null;
  targetY: number | null = null;
  cluster: Node[] = [];

  constructor(x: number, y: number, personality: NodePersonality) {
    this.x = x;
    this.y = y;
    this.personality = personality;
    this.findNewTarget();
  }

  findNewTarget() {
    // Set a new random target within 100px of current position
    this.targetX = this.x + (Math.random() - 0.5) * 200;
    this.targetY = this.y + (Math.random() - 0.5) * 200;
  }

  move(width: number, height: number) {
    // Organic movement towards target
    if (this.targetX === null || this.targetY === null || 
        Math.hypot(this.x - this.targetX, this.y - this.targetY) < 5) {
      this.findNewTarget();
    }

    // Move towards target with smooth easing
    const dx = (this.targetX! - this.x) * 0.02;
    const dy = (this.targetY! - this.y) * 0.02;

    this.x += dx * this.personality.energy;
    this.y += dy * this.personality.energy;

    // Bounce off edges with padding
    const padding = this.personality.size * 2;
    if (this.x < padding || this.x > width - padding) {
      this.targetX = width / 2;
    }
    if (this.y < padding || this.y > height - padding) {
      this.targetY = height / 2;
    }

    this.x = Math.max(padding, Math.min(width - padding, this.x));
    this.y = Math.max(padding, Math.min(height - padding, this.y));

    this.age++;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const opacity = Math.max(0, 1 - (this.age / this.maxAge));
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.personality.size, 0, Math.PI * 2);
    
    // Create glow effect
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.personality.size * 2
    );
    gradient.addColorStop(0, `${this.personality.color}`);
    gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
    
    ctx.fillStyle = gradient;
    ctx.globalAlpha = opacity;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  isAlive(): boolean {
    return this.age < this.maxAge;
  }
}

const generatePersonality = (): NodePersonality => {
  const pastelColors = [
    'rgba(255, 182, 193, 0.6)', // pink
    'rgba(173, 216, 230, 0.6)', // light blue
    'rgba(144, 238, 144, 0.6)', // light green
    'rgba(221, 160, 221, 0.6)', // plum
    'rgba(255, 218, 185, 0.6)', // peach
  ];

  return {
    mood: ['happy', 'calm', 'excited', 'contemplative'][Math.floor(Math.random() * 4)],
    energy: Math.random(),
    color: pastelColors[Math.floor(Math.random() * pastelColors.length)],
    size: 2 + Math.random() * 4,
    velocity: {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
    },
  };
};

export interface TorusSphereProps {
  loobricateId?: string;
}

const INITIAL_NODES = 15;
const MAX_NODES = 50; // Limit total nodes for performance

const TorusSphere: React.FC<TorusSphereProps> = ({ loobricateId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationFrameRef = useRef<number>();
  const clustersRef = useRef<Node[][]>([]);

  const createInitialNodes = (canvas: HTMLCanvasElement) => {
    for (let i = 0; i < INITIAL_NODES; i++) {
      nodesRef.current.push(
        new Node(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          generatePersonality()
        )
      );
    }
  };

  const updateClusters = () => {
    const nodes = nodesRef.current;
    const newClusters: Node[][] = [];
    const unclustered = [...nodes];

    while (unclustered.length > 0) {
      const current = unclustered.pop()!;
      const cluster = [current];

      for (let i = unclustered.length - 1; i >= 0; i--) {
        const node = unclustered[i];
        const distance = Math.hypot(current.x - node.x, current.y - node.y);
        if (distance < 100) {
          cluster.push(node);
          unclustered.splice(i, 1);
        }
      }

      newClusters.push(cluster);
    }

    clustersRef.current = newClusters;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create initial nodes
    createInitialNodes(canvas);

    // Initialize Pusher
    const pusher = new Pusher('facc28e7df1eec1d7667', {
      cluster: 'eu'
    });

    const channel = pusher.subscribe('my-channel');
    channel.bind('my-event', (data: { analysis: any }) => {
      if (nodesRef.current.length >= MAX_NODES) {
        // Remove oldest node if at capacity
        nodesRef.current.shift();
      }
      
      const newNode = new Node(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        generatePersonality()
      );
      nodesRef.current.push(newNode);
    });

    // For testing: Add random nodes less frequently
    const testInterval = setInterval(() => {
      if (nodesRef.current.length < MAX_NODES) {
        const newNode = new Node(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          generatePersonality()
        );
        nodesRef.current.push(newNode);
      }
    }, 3000);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update clusters every few frames
      if (Math.random() < 0.1) { // 10% chance each frame
        updateClusters();
      }

      // Update and draw nodes
      nodesRef.current = nodesRef.current.filter(node => node.isAlive());
      nodesRef.current.forEach(node => {
        node.move(canvas.width, canvas.height);
        node.draw(ctx);
      });

      // Draw connections within clusters
      ctx.strokeStyle = 'rgba(200, 200, 200, 0.15)';
      ctx.lineWidth = 0.5;
      
      clustersRef.current.forEach(cluster => {
        for (let i = 0; i < cluster.length; i++) {
          for (let j = i + 1; j < cluster.length; j++) {
            const distance = Math.hypot(
              cluster[i].x - cluster[j].x,
              cluster[i].y - cluster[j].y
            );
            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(cluster[i].x, cluster[i].y);
              ctx.lineTo(cluster[j].x, cluster[j].y);
              ctx.stroke();
            }
          }
        }
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(testInterval);
      window.removeEventListener('resize', resizeCanvas);
      pusher.unsubscribe('my-channel');
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: '100%',
        height: '100%',
        background: 'transparent',
      }} 
    />
  );
};

export default TorusSphere;
