import React, { useEffect, useRef } from "react";

const Dashboard = () => {
  const canvasRef = useRef(null);

  class Particle {
    constructor(x, y, mood) {
      this.x = x;
      this.y = y;
      this.size = 5; // Default size of the particle
      this.speedX = (Math.random() - 0.5) * 2; // Horizontal velocity
      this.speedY = (Math.random() - 0.5) * 2; // Vertical velocity
      this.color =
        mood === "Positive" ? "rgba(0, 255, 0, 0.8)" : "rgba(255, 0, 0, 0.8)"; // Color based on mood
    }

    update() {
      // Update particle position
      this.x += this.speedX;
      this.y += this.speedY;
      // Implement simple boundary collision so particles stay within canvas
      if (this.x <= 0 || this.x >= window.innerWidth) this.speedX *= -1;
      if (this.y <= 0 || this.y >= window.innerHeight) this.speedY *= -1;
    }

    draw(ctx) {
      // Draw the particle
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles based on data entries
    let particles = [
      new Particle(100, 100, "Positive"),
      new Particle(200, 200, "Negative"),
      // Add more particles as needed
    ];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
      particles.forEach((particle) => {
        particle.update(); // Update particle position
        particle.draw(ctx); // Draw particle
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
