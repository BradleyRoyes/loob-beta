import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const maxNodes = 10;
  const connectionDistance = 100;
  const [analysisData, setAnalysisData] = useState({ Mood: "", Keywords: [] });
  const [mostCommonKeyword, setMostCommonKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Set the global error handler once on component mount
  useEffect(() => {
    const globalErrorHandler = (message, source, lineno, colno, error) => {
      console.log("Caught an error:", message, "from", source, "line", lineno, "column", colno);
      console.error(error);
      return true; // Prevents the firing of the default event handler
    };

    window.onerror = globalErrorHandler;

    return () => {
      window.onerror = null; // Cleanup global error handler on component unmount
    };
  }, []);

  // Handle interval for adding random points
  useEffect(() => {
    const addRandomPoint = () => {
      const canvas = canvasRef.current;
      const moodOptions = ['positive', 'neutral', 'negative']; // Example moods
      const randomMood = moodOptions[Math.floor(Math.random() * moodOptions.length)];
      
      const point = {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2, // Velocity between -1 and 1
        vy: (Math.random() - 0.5) * 2, // Velocity between -1 and 1
        mood: randomMood, // Random mood
        radius: Math.random() * 2 + 1, // Radius between 1 and 3
        trail: [],
      };

      points.current.push(point);
    };

    const interval = setInterval(addRandomPoint, 300000); // 300000 ms = 5 minutes
    
    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  useEffect(() => {
    if (mostCommonKeyword) {
      setShowModal(true); // Show the modal with the keyword
      const timer = setTimeout(() => {
        setShowModal(false); // Hide the modal after a few seconds
      }, 6000); // Adjust time as needed

      return () => clearTimeout(timer);
    }
  }, [mostCommonKeyword]);

  useEffect(() => {
    // Initialize Pusher and subscribe to the channel for real-time updates
    const pusher = new Pusher("facc28e7df1eec1d7667", {
      cluster: "eu",
      encrypted: true,
    });

    console.log("Attempting to subscribe to Pusher channel");
    const channel = pusher.subscribe("my-channel");

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

        console.log("Updated analysis data:", updatedData); // Log the updated state for debugging

        // Add a new point for every new data received
        addNewPoint(updatedData.Mood.toLowerCase());

        return updatedData;
      });
    });

    // Bind to the subscription succeeded event
    channel.bind("pusher:subscription_succeeded", function () {
      console.log("Successfully subscribed to 'my-channel'");
    });

    // Handle subscription error
    channel.bind("pusher:subscription_error", function (statusCode) {
      console.error(`Failed to subscribe to 'my-channel'. Status code: ${statusCode}`);
      console.log("subscription failed");
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      // pusher.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize Perlin noise generator
    // const noiseGen = new Noise(Math.random());

    const draw = () => {
      ctx.fillStyle = "white"; // Set background color to black
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with black color
      updatePoints(); // Pass the noise generator to the update function
      drawPoints(ctx);
      drawConnections(ctx);
      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  useEffect(() => {
    // Function to calculate the most common keyword
    const calculateMostCommonKeyword = () => {
      const keywordFrequency = {};
      analysisData.Keywords.forEach((keyword) => {
        if (keywordFrequency.hasOwnProperty(keyword)) {
          keywordFrequency[keyword]++;
        } else {
          keywordFrequency[keyword] = 1;
        }
      });

      const mostCommon = Object.entries(keywordFrequency).reduce(
        (acc, curr) => (curr[1] > acc[1] ? curr : acc),
        ["", 0]
      );

      console.log(
        `Most common keyword: ${mostCommon[0]}`,
        mostCommon[1]
      );
      setMostCommonKeyword(mostCommon[0]); // Update state with the most common keyword
    };

    // Interval to calculate the most common keyword every minute
    const intervalId = setInterval(
      calculateMostCommonKeyword,
      1200000
    ); // Adjust to 60000 for 1 minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [analysisData.Keywords]);

  const applyMoodInfluences = () => {
  const gravityStrength = 0.05; // Adjust as needed for attraction
  const repulsionStrength = 0.05; // Adjust as needed for repulsion

  points.current.forEach((point, index) => {
    let forceX = 0;
    let forceY = 0;

    points.current.forEach((otherPoint, otherIndex) => {
      if (index === otherIndex) return; // Skip self

      const dx = otherPoint.x - point.x;
      const dy = otherPoint.y - point.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Avoid extreme forces at very short distances
      if (distance < 1) return;

      const forceMagnitude =
        (point.mood === 'positive' && otherPoint.mood === 'positive')
          ? gravityStrength / distance // Attraction force for positive mood
          : (point.mood === 'negative' && otherPoint.mood === 'negative')
          ? -repulsionStrength / distance // Repulsion force for negative mood
          : 0; // No force if moods are mixed or neutral

      forceX += (dx / distance) * forceMagnitude;
      forceY += (dy / distance) * forceMagnitude;
    });

    // Apply the resulting force to the point's velocity
    point.vx += forceX;
    point.vy += forceY;
  });
};


const updatePoints = (noiseGen) => {
  // First, apply mood influences for attraction and repulsion
  applyMoodInfluences();

  // Then, update points with the new velocities and check boundaries
  points.current.forEach((point) => {
    point.x += point.vx;
    point.y += point.vy;

    if (point.x <= 0 || point.x >= canvasRef.current.width) point.vx *= -1;
    if (point.y <= 0 || point.y >= canvasRef.current.height) point.vy *= -1;

    point.trail.push({ x: point.x, y: point.y });
    if (point.trail.length > 10) point.trail.shift();
  });
};


  const addNewPoint = (mood) => {
    const canvas = canvasRef.current;
    let velocityRange;
    switch (mood) {
      case "positive":
        velocityRange = { min: 0.5, max: 1.0 }; // Fast
        break;
      case "neutral":
      default: // Neutral serves as default
        velocityRange = { min: 0.25, max: 0.5 }; // Medium
        break;
      case "negative":
        velocityRange = { min: 0.15, max: 0.5 }; // Slow
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
      vx: vx,
      vy: vy,
      mood: mood, // Store mood to retain speed category
      radius: Math.random() * 2 + 1,
      trail: [],
    });
  };

  // Draw points
  const drawPoints = (ctx) => {
    points.current.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = "black"; // Set point color to black
      ctx.fill();

      // Draw subtle trail
      if (point.trail.length > 0) {  // Check if the trail array has at least one point
        ctx.beginPath();
        ctx.moveTo(point.trail[0].x, point.trail[0].y);
        for (let i = 1; i < point.trail.length; i++) {
          const p = point.trail[i];
          ctx.lineTo(p.x, p.y);
        }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.06)"; // Adjust the opacity of the trail
      ctx.stroke();
      }
    });
  };

  // Draw connections between close points
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

          ctx.lineWidth = 2; // Make connection lines thicker

          if (isRed) {
            ctx.strokeStyle = `rgba(255, 105, 110, ${opacity})`;
          } else {
            ctx.strokeStyle = `rgba(0, 0, 0, ${opacity})`;
          }
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
          background: "#FFE4C4", // Set canvas background color to black
          position: "absolute",
          // top: "5%", // Add top padding as 5% of the viewport height
          // left: "5%", // Add left padding as 5% of the viewport width
          // right: "5%", // Add right padding as 5% of the viewport width
          // bottom: "5%", // Add bottom padding as 5% of the viewport height
          zIndex: -1,
        }}
      ></canvas>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1,
          color: "black", // Set text color to white
          background: "rgba(255, 255, 255, 0.9)", // Set background color to black with opacity
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <p>Most Common Keyword: {mostCommonKeyword}</p>
      </div>
      {/* Modal Overlay */}
      <div className={`modal-overlay ${showModal ? "show" : ""}`}>
        <div className="modal-content">{mostCommonKeyword}</div>
      </div>
    </div>
  );
};

export default Dashboard;
