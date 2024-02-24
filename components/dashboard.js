import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import { Noise } from "noisejs";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const [analysisData, setAnalysisData] = useState({ Mood: "", Keywords: [] });
  const [mostCommonKeyword, setMostCommonKeyword] = useState("");
  const [permanentLine, setPermanentLine] = useState([]);

  // Initialize test points and setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize Perlin noise generator
    const noiseGen = new Noise(Math.random());

    // Function to initialize 20 test points
    const initializeTestPoints = () => {
      for (let i = 0; i < 20; i++) {
        points.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: Math.random() * 2 + 1,
          trail: [],
        });
      }
    };

    initializeTestPoints();

    const draw = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      updatePoints(noiseGen);
      drawPoints(ctx);
      drawConnections(ctx);
      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  // Pusher setup for real-time updates (simplified for brevity)
  useEffect(() => {
    const pusher = new Pusher("facc28e7df1eec1d7667", { cluster: "eu", encrypted: true });
    const channel = pusher.subscribe("my-channel");
    channel.bind("my-event", function (data) {
      console.log("Received data:", data.analysis);
      setAnalysisData(prevAnalysisData => ({
        Mood: data.analysis.Mood,
        Keywords: [...prevAnalysisData.Keywords, ...(data.analysis.Keywords || [])],
      }));
      addNewPoint(data.analysis.Mood.toLowerCase());
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  // Calculate the most common keyword
  useEffect(() => {
    const intervalId = setInterval(() => {
      const keywordFrequency = {};
      analysisData.Keywords.forEach(keyword => {
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
      });
      const mostCommon = Object.entries(keywordFrequency).reduce((a, b) => (a[1] > b[1] ? a : b), ["", 0]);
      setMostCommonKeyword(mostCommon[0]);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [analysisData.Keywords]);

  // Update points logic with Perlin noise
  const updatePoints = (noiseGen) => {
    points.current.forEach(point => {
      const noiseX = noiseGen.simplex2(point.x * 0.01, point.y * 0.01);
      const noiseY = noiseGen.simplex2(point.y * 0.01, point.x * 0.01);
      point.vx += noiseX * 0.02;
      point.vy += noiseY * 0.02;

      point.x += point.vx;
      point.y += point.vy;

      // Boundary check for wrapping
      if (point.x < 0) point.x += canvasRef.current.width;
      if (point.x > canvasRef.current.width) point.x -= canvasRef.current.width;
      if (point.y < 0) point.y += canvasRef.current.height;
      if (point.y > canvasRef.current.height) point.y -= canvasRef.current.height;

      point.trail.push({ x: point.x, y: point.y });
      if (point.trail.length > 10) point.trail.shift();
    });
  };

  // Add new point based on mood
  const addNewPoint = (mood) => {
    const velocityRange = { min: 0.5, max: 1.0 }; // Adjust this based on mood if necessary
    points.current.push({
      x: Math.random() * canvasRef.current.width,
      y: Math.random() * canvasRef.current.height,
      vx: (Math.random() - 0.5) * velocityRange.max,
      vy: (Math.random() - 0.5) * velocityRange.max,
      radius: Math.random() * 2 + 1,
      trail: [],
    });
  };

  // Draw points with trails
  const drawPoints = (ctx) => {
    points.current.forEach(point => {
      // Draw point
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, 2 * Math.PI);
      ctx.fill();

      // Draw trail
      point.trail.forEach((trailPoint, index) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + (index / point.trail.length) * 0.5})`;
        ctx.beginPath();
        ctx.arc(trailPoint.x, trailPoint.y, point.radius * ((index + 1) / point.trail.length), 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };

  const drawConnections = (ctx) => {
    points.current.forEach((point, index) => {
      // Draw connections between this point and other nearby points
      for (let i = index + 1; i < points.current.length; i++) {
        const otherPoint = points.current[i];
        const dx = otherPoint.x - point.x;
        const dy = otherPoint.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if the distance is within the connection distance threshold
        if (distance < connectionDistance) {
          // Set the color based on the distance or any other criteria
          ctx.strokeStyle = "rgba(255, 255, 255, 0.2)"; // White with some opacity
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(otherPoint.x, otherPoint.y);
          ctx.stroke();
        }
      }
    });
  };


  return (
    <div>
      <canvas ref={canvasRef} style={{ display: "block", background: "black", position: "absolute", zIndex: -1 }}></canvas>
      <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1, color: "white", background: "rgba(0, 0, 0, 0.7)", padding: "10px", borderRadius: "8px" }}>
        <p>Most Common Keyword: {mostCommonKeyword}</p>
      </div>
    </div>
  );
};

export default Dashboard;
