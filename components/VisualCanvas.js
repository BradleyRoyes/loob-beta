import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";

// VisualCanvas: A dynamic, interactive visualization canvas for mood analysis data.
const VisualCanvas = () => {
  const canvasRef = useRef(null); // Reference to the canvas element
  const points = useRef([]); // Store all animated points
  const maxNodes = 10; // Maximum nodes for potential future use
  const connectionDistance = 100; // Distance threshold for connecting points visually
  const [analysisData, setAnalysisData] = useState({ Mood: "", Keywords: [] }); // Data from real-time updates
  const [mostCommonKeyword, setMostCommonKeyword] = useState(""); // Most frequent keyword from analysis data
  const [showModal, setShowModal] = useState(false); // Modal visibility state for displaying the most common keyword

  // Set up a global error handler for catching uncaught errors during runtime
  useEffect(() => {
    const globalErrorHandler = (message, source, lineno, colno, error) => {
      console.log("Caught an error:", message, "from", source, "line", lineno, "column", colno);
      console.error(error);
      return true; // Prevents the firing of the default error event handler
    };

    window.onerror = globalErrorHandler;

    return () => {
      window.onerror = null; // Cleanup: Remove the global error handler when unmounting
    };
  }, []);

  // Add new points at regular intervals (5 minutes)
  useEffect(() => {
    const addRandomPoint = () => {
      const canvas = canvasRef.current;
      const moodOptions = ["positive", "neutral", "negative"]; // Example moods for simulation
      const randomMood = moodOptions[Math.floor(Math.random() * moodOptions.length)];

      // Create a new point with random position, velocity, and mood
      const point = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2, // Velocity between -1 and 1
        vy: (Math.random() - 0.5) * 2,
        mood: randomMood,
        radius: Math.random() * 2 + 1, // Radius between 1 and 3
        trail: [], // Trail of points for visualizing movement
      };

      points.current.push(point); // Add the new point to the array
    };

    const interval = setInterval(addRandomPoint, 300000); // Add a new point every 5 minutes

    return () => clearInterval(interval); // Cleanup: Stop interval on unmount
  }, []);

  // Show a modal whenever the most common keyword changes
  useEffect(() => {
    if (mostCommonKeyword) {
      setShowModal(true); // Display modal with the keyword
      const timer = setTimeout(() => {
        setShowModal(false); // Automatically hide modal after 6 seconds
      }, 6000);

      return () => clearTimeout(timer); // Cleanup: Clear the timer on unmount
    }
  }, [mostCommonKeyword]);

  // Real-time updates with Pusher
  useEffect(() => {
    const pusher = new Pusher("facc28e7df1eec1d7667", {
      cluster: "eu",
      encrypted: true,
    });

    console.log("Attempting to subscribe to Pusher channel");
    const channel = pusher.subscribe("my-channel");

    // Receive real-time data and update the state
    channel.bind("my-event", function (data) {
      console.log("Received data:", data.analysis);
      setAnalysisData((prevAnalysisData) => {
        const updatedData = {
          Mood: data.analysis.Mood,
          Keywords: [
            ...prevAnalysisData.Keywords,
            ...(data.analysis.Keywords || []),
          ],
        };

        console.log("Updated analysis data:", updatedData);
        addNewPoint(updatedData.Mood.toLowerCase()); // Add a new point based on mood
        return updatedData;
      });
    });

    // Handle subscription events
    channel.bind("pusher:subscription_succeeded", () => {
      console.log("Successfully subscribed to 'my-channel'");
    });

    channel.bind("pusher:subscription_error", (statusCode) => {
      console.error(`Subscription failed with status code: ${statusCode}`);
    });

    return () => {
      channel.unbind_all(); // Unbind all events
      channel.unsubscribe(); // Unsubscribe from the channel
    };
  }, []);

  // Handle canvas drawing and animations
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const draw = () => {
      ctx.fillStyle = "white"; // Canvas background color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      updatePoints(); // Update point positions and properties
      drawPoints(ctx); // Draw each point on the canvas
      drawConnections(ctx); // Draw connections between points based on distance
      requestAnimationFrame(draw); // Recursively call draw for animation
    };

    draw(); // Start the drawing loop
  }, []);

  // Calculate the most common keyword at regular intervals (20 minutes)
  useEffect(() => {
    const calculateMostCommonKeyword = () => {
      const keywordFrequency = {};
      analysisData.Keywords.forEach((keyword) => {
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
      });

      const mostCommon = Object.entries(keywordFrequency).reduce(
        (acc, curr) => (curr[1] > acc[1] ? curr : acc),
        ["", 0]
      );

      console.log("Most common keyword:", mostCommon[0], mostCommon[1]);
      setMostCommonKeyword(mostCommon[0]); // Update the state with the most common keyword
    };

    const intervalId = setInterval(calculateMostCommonKeyword, 1200000); // 20 minutes interval

    return () => clearInterval(intervalId); // Cleanup: Stop interval on unmount
  }, [analysisData.Keywords]);

  // Apply attraction or repulsion between points based on their mood
  const applyMoodInfluences = () => {
    const gravityStrength = 0.05; // Attraction strength
    const repulsionStrength = 0.05; // Repulsion strength

    points.current.forEach((point, index) => {
      let forceX = 0;
      let forceY = 0;

      points.current.forEach((otherPoint, otherIndex) => {
        if (index === otherIndex) return;

        const dx = otherPoint.x - point.x;
        const dy = otherPoint.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 1) return;

        const forceMagnitude =
          point.mood === "positive" && otherPoint.mood === "positive"
            ? gravityStrength / distance
            : point.mood === "negative" && otherPoint.mood === "negative"
            ? -repulsionStrength / distance
            : 0;

        forceX += (dx / distance) * forceMagnitude;
        forceY += (dy / distance) * forceMagnitude;
      });

      point.vx += forceX; // Apply force to velocity
      point.vy += forceY;
    });
  };

  const updatePoints = () => {
    applyMoodInfluences(); // Apply mood-based forces
    points.current.forEach((point) => {
      point.x += point.vx;
      point.y += point.vy;

      if (point.x <= 0 || point.x >= canvasRef.current.width) point.vx *= -1;
      if (point.y <= 0 || point.y >= canvasRef.current.height) point.vy *= -1;

      point.trail.push({ x: point.x, y: point.y });
      if (point.trail.length > 10) point.trail.shift(); // Limit trail length
    });
  };

  const addNewPoint = (mood) => {
    const canvas = canvasRef.current;
    let velocityRange;
    switch (mood) {
      case "positive":
        velocityRange = { min: 0.5, max: 1.0 }; // Faster for positive
        break;
      case "neutral":
      default:
        velocityRange = { min: 0.25, max: 0.5 }; // Medium for neutral
        break;
      case "negative":
        velocityRange = { min: 0.15, max: 0.5 }; // Slower for negative
        break;
    }

    const vx =
      (Math.random() * (velocityRange.max - velocityRange.min) +
        velocityRange.min) *
      (Math.random() < 0.5 ? -1 : 1);
    const vy =
      (Math.random() * (velocityRange.max - velocityRange.min) +
        velocityRange.min) *
      (Math.random() < 0.5 ? -1 : 1);

    points.current.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx,
      vy,
      mood,
      radius: Math.random() * 2 + 1,
      trail: [],
    });
  };

  const drawPoints = (ctx) => {
    points.current.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = "black";
      ctx.fill();

      if (point.trail.length > 0) {
        ctx.beginPath();
        ctx.moveTo(point.trail[0].x, point.trail[0].y);
        for (let i = 1; i < point.trail.length; i++) {
          const p = point.trail[i];
          ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
        ctx.stroke();
      }
    });
  };

  const drawConnections = (ctx) => {
    points.current.forEach((point, index) => {
      for (let i = index + 1; i < points.current.length; i++) {
        const other = points.current[i];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance < connectionDistance) {
          const isRed = Math.random() < 0.05;
          const opacity = 1 - distance / connectionDistance;
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);
          ctx.lineWidth = 2;

          ctx.strokeStyle = isRed
            ? `rgba(255, 105, 110, ${opacity})`
            : `rgba(0, 0, 0, ${opacity})`;
          ctx.stroke();
        }
      }
    });
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          background: "#FFE4C4",
          position: "absolute",
          zIndex: -1,
        }}
      ></canvas>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1,
          color: "black",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <p>Most Common Keyword: {mostCommonKeyword}</p>
      </div>
      <div className={`modal-overlay ${showModal ? "show" : ""}`}>
        <div className="modal-content">{mostCommonKeyword}</div>
      </div>
    </div>
  );
};

export default VisualCanvas;
