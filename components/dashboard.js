import React, { useEffect, useRef } from "react";

const Dashboard = () => {
  const canvasRef = useRef(null);

  const maxNodes = 20;
  const connectionDistance = 100;

  class Node {
    constructor(x, y, mood, connectedness, intensity, coherence) {
      this.x = x;
      this.y = y;
      this.radius = Math.random() * 4 + 1; // Size based on intensity perhaps
      this.velocity = { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2 };
      this.mood = mood;
      this.connectedness = connectedness;
      this.intensity = intensity;
      this.coherence = coherence;
      this.connections = new Map();
    }

    update(particles) {
      // Movement logic here, possibly influenced by mood and coherence
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      if (this.x <= 0 || this.x >= canvasRef.current.width) this.velocity.x *= -1;
      if (this.y <= 0 || this.y >= canvasRef.current.height) this.velocity.y *= -1;

      // Update connections
      particles.forEach(other => {
        if (other !== this && this.isConnected(other)) {
          this.updateConnection(other);
        }
      });
    }

    isConnected(other) {
      const dx = this.x - other.x;
      const dy = this.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < connectionDistance;
    }

    updateConnection(other) {
      // Here you might adjust the logic based on connectedness or other traits
      if (!this.connections.has(other)) {
        this.connections.set(other, Date.now());
      }
    }

    draw(ctx, particles) {
      // Particle itself
      ctx.fillStyle = `rgba(0, 0, 0, ${(this.mood + 5) / 10})`; // Mood influences color opacity
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Connections
      particles.forEach(other => {
        if (this.isConnected(other)) {
          this.drawConnection(ctx, other);
        }
      });
    }

    drawConnection(ctx, other) {
      ctx.strokeStyle = `rgba(0, 0, 0, 0.5)`; // Basic connection color, could be adjusted
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(other.x, other.y);
      ctx.stroke();
    }
  }

  const getRandomMood = () => Math.random() * 10 - 5; // Random mood between -5 and 5

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let particles = [];
    for (let i = 0; i < maxNodes; i++) {
      particles.push(new Node(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        getRandomMood(), // Mood
        Math.random(), // Connectedness
        Math.random(), // Intensity
        Math.random() // Coherence
      ));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(particle => {
        particle.update(particles);
        particle.draw(ctx, particles);
      });
      requestAnimationFrame(animate);
    };

    animate();
  }, []);

  return (
    <div className="visualization-container">
      <canvas ref={canvasRef}></canvas>
    </div>
  );
};

export default Dashboard;
