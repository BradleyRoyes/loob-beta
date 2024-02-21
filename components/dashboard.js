import React, { useEffect, useRef } from "react";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const maxNodes = 50; // Updated to reflect the potential for 50 nodes
  const connectionDistance = 100;
  const redThreadLength = useRef(0); // Length of the red thread, increases over time
  const redThreadSpeed = 0.005; // Speed at which the red thread grows, adjust as needed

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize points with position, velocity, and radius
    for (let i = 0; i < maxNodes; i++) {
      points.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2, // Velocity in X
        vy: (Math.random() - 0.5) * 2, // Velocity in Y
        radius: Math.random() * 2 + 1, // Increased radius for visibility
      });
    }

    const draw = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      updatePoints();
      drawPoints(ctx);
      drawConnections(ctx);
      drawRedThread(ctx); // Draw the evolving red thread
      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  const updatePoints = () => {
    points.current.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;

      // Reverse velocity if the point hits the canvas boundary
      if (point.x <= 0 || point.x >= canvas.width) point.vx *= -1;
      if (point.y <= 0 || point.y >= canvas.height) point.vy *= -1;
    });
    redThreadLength.current += redThreadSpeed; // Incrementally increase the red thread length
  };

  const drawPoints = (ctx) => {
    points.current.forEach((point) => {
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.radius * 2);
      gradient.addColorStop(0, "white");
      gradient.addColorStop(1, "black");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius * 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawConnections = (ctx) => {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    points.current.forEach((point, index) => {
      for (let i = index + 1; i < points.current.length; i++) {
        const other = points.current[i];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    });
  };

  // Draw the red thread connecting nodes over time
  const drawRedThread = (ctx) => {
    let length = redThreadLength.current;
    ctx.strokeStyle = "red"; // Red thread color
    ctx.beginPath();
    for (let i = 0; i < points.current.length && length > 0; i++) {
      if (i === 0) {
        ctx.moveTo(points.current[i].x, points.current[i].y);
      } else {
        const distance = Math.hypot(points.current[i].x - points.current[i - 1].x, points.current[i].y - points.current[i - 1].y);
        if (length - distance > 0) {
          ctx.lineTo(points.current[i].x, points.current[i].y);
        } else {
          // Calculate intermediate point for partial line
          const ratio = length / distance;
          const intermediateX = points.current[i - 1].x + ratio * (points.current[i].x - points.current[i - 1].x);
          const intermediateY = points.current[i - 1].y + ratio * (points.current[i].y - points.current[i - 1].y);
          ctx.lineTo(intermediateX, intermediateY);
        }
        length -= distance;
      }
    }
    ctx.stroke();
  };

  return <canvas ref={canvasRef} style={{ display: "block", background: "black" }}></canvas>;
};

export default Dashboard;