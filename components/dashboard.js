import React, { useEffect, useRef } from "react";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const maxNodes = 10;
  const connectionDistance = 100;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize points
    for (let i = 0; i < maxNodes; i++) {
      points.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      drawPoints(ctx);
      drawConnections(ctx);
      requestAnimationFrame(draw); // Create an animation loop
    };

    draw();
  }, []);

  // Draw points
  const drawPoints = (ctx) => {
    points.current.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Draw connections between close points
  const drawConnections = (ctx) => {
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

  return <canvas ref={canvasRef}></canvas>;
};

export default Dashboard;
