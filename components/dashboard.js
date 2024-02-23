import React, { useEffect, useRef } from "react";
import { useAnalysisData } from "../components/AnalysisDataContext";
const Dashboard = () => {
  const { analysisData } = useAnalysisData(); // Use the context to access analysis data
  const canvasRef = useRef(null);
  const points = useRef([]);
  const maxNodes = 10;
  const connectionDistance = 100;
  useEffect(() => {
    console.log("Received analysis data:", analysisData); // Log the analysis data to verify receipt
  }, [analysisData]); // Add analysisData as a dependency to useEffect to re-run when analysisData changes
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
        radius: Math.random() * 2 + 1,
      });
    }
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
      updatePoints(); // Update points' positions based on their velocities
      drawPoints(ctx); // Draw points
      drawConnections(ctx); // Draw connections between close points
      requestAnimationFrame(draw); // Create an animation loop
    };
    draw();
  }, [analysisData]); // Add analysisData as a dependency to useEffect to re-run when analysisData changes
  // Update points' positions
  const updatePoints = () => {
    points.current.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;
      // Reverse velocity if the point hits the canvas boundary
      if (point.x <= 0 || point.x >= canvasRef.current.width) point.vx *= -1;
      if (point.y <= 0 || point.y >= canvasRef.current.height) point.vy *= -1;
    });
  };
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
  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", background: "white" }}
    ></canvas>
  );
};
export default Dashboard;
