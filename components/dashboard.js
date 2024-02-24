import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import { Noise } from "noisejs"; // Import the Noise object from noisejs

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const keywordCounts = useRef({});
  const connectionDistance = 100;
  const [commonKeyword, setCommonKeyword] = useState("");
  const [permanentConnections, setPermanentConnections] = useState([]); // New state to track permanent connections

  useEffect(() => {
    // Define the global error handler
    const globalErrorHandler = (message, source, lineno, colno, error) => {
      console.log(
        "Caught an error:",
        message,
        "from",
        source,
        "line",
        lineno,
        "column",
        colno,
      );
      console.error(error);
      return true; // Prevents the firing of the default event handler
    };

    // Set the global error handler
    window.onerror = globalErrorHandler;

    // Cleanup function to remove the global error handler when the component unmounts
    return () => {
      window.onerror = null;
    };
  }, []); // Empty dependency array ensures this effect runs only once on mount

  useEffect(() => {
    // Initialize Pusher and subscribe to the channel for real-time updates
    const pusher = new Pusher("facc28e7df1eec1d7667", {
      cluster: "eu",
      encrypted: true,
    });

    console.log("Attempting to subscribe to Pusher channel");
    const channel = pusher.subscribe("my-channel");

    channel.bind("my-event", function (data) {
      // console.log("Raw received data:", data);
      console.log("Received data:", data.analysis);

      const keywords = data.analysis.Keywords || [];
      keywords.forEach((keyword) => {
        keywordCounts.current[keyword] =
          (keywordCounts.current[keyword] || 0) + 1;
      });

      // Determine the most common keyword after each message is received
      const currentCommonKeyword = Object.keys(keywordCounts.current).reduce(
        (a, b) => (keywordCounts.current[a] > keywordCounts.current[b] ? a : b),
        "",
      );
      setCommonKeyword(currentCommonKeyword);

      addNewPoint(data.analysis.Mood.toLowerCase(), keywords);
    });

    // Bind to the subscription succeeded event
    channel.bind("pusher:subscription_succeeded", function () {
      console.log("Successfully subscribed to 'my-channel'");
    });

    // Handle subscription error
    channel.bind("pusher:subscription_error", function (statusCode) {
      console.error(
        `Failed to subscribe to 'my-channel'. Status code: ${statusCode}`,
      );
      console.log("subscription failed");
    });

    // Periodically determine the most common keyword
    const intervalId = setInterval(() => {
      const mostCommonKeyword = Object.keys(keywordCounts.current).reduce(
        (a, b) => (keywordCounts.current[a] > keywordCounts.current[b] ? a : b),
        "",
      );
      if (mostCommonKeyword !== commonKeyword) {
        setCommonKeyword(mostCommonKeyword);
        setPermanentConnections([]); // Reset permanent connections when the most common keyword changes
      }
    }, 60000); // Check every minute for testing

    return () => {
      clearInterval(intervalId);
      channel.unbind_all();
      channel.unsubscribe();
      // pusher.disconnect();
    };
  }, [commonKeyword]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize Perlin noise generator
    const noiseGen = new Noise(Math.random());

    const draw = () => {
      ctx.fillStyle = "black"; // Set background color to black
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with black color
      updatePoints(noiseGen); // Pass the noise generator to the update function
      drawPoints(ctx);
      drawConnections(ctx, commonKeyword);
      requestAnimationFrame(draw);
    };

    draw();
  }, [commonKeyword, permanentConnections]);
  // Function to add a new point with velocity based on the mood
  const addNewPoint = (mood, keywords) => {
    // const canvas = canvasRef.current;

    // Define velocity ranges based on mood (slowed down by a factor of 3)
    let velocityRange;
    switch (mood) {
      case "positive":
        velocityRange = { min: 1.5, max: 2.0 }; // Fast
        break;
      case "neutral":
        velocityRange = { min: 0.75, max: 1.25 }; // Medium
        break;
      case "negative":
        velocityRange = { min: 0.25, max: 0.5 }; // Slow
        break;
      default:
        velocityRange = { min: 0.75, max: 1.25 }; // Default to medium if mood is undefined or unknown
    }

    // Generate velocity within the selected range
    const vx =
      (Math.random() * (velocityRange.max - velocityRange.min) +
        velocityRange.min) *
      (Math.random() < 0.5 ? -1 : 1);
    const vy =
      (Math.random() * (velocityRange.max - velocityRange.min) +
        velocityRange.min) *
      (Math.random() < 0.5 ? -1 : 1);

    points.current.push({
      x: Math.random() * canvasRef.current.width,
      y: Math.random() * canvasRef.current.height,
      vx: vx,
      vy: vy,
      radius: Math.random() * 2 + 1,
      trail: [], // Store previous positions for the trailing effect
      keywords: keywords,
    });
  };

  const updatePoints = (noiseGen) => {
    points.current.forEach((point, index) => {
      // Check if the point is defined to prevent runtime errors
      if (!point) {
        console.error(`Point at index ${index} is undefined`);
        return; // Skip this iteration if the point is undefined
      }

      let hasPermanentConnection = false;

      // Check if this point has any permanent connection
      permanentConnections.forEach((connection) => {
        const [point1Index, point2Index] = connection.split("-").map(Number);
        // Check if either end of the connection includes the current point
        if (index === point1Index || index === point2Index) {
          hasPermanentConnection = true;
        }
      });

      // Proceed with noise-based velocity updates only if there's no permanent connection
      if (!hasPermanentConnection) {
        // Use Perlin noise for natural movement
        const noiseX = noiseGen.simplex2(point.x * 0.01, point.y * 0.01);
        const noiseY = noiseGen.simplex2(point.y * 0.01, point.x * 0.01);

        point.vx += noiseX * 0.2; // Adjust velocity based on Perlin noise
        point.vy += noiseY * 0.2;
      }
      // Else, you might want to either limit the movement or keep the point stationary
      // This part of logic is up to your application's requirements

      // Update point position, ensuring it's defined
      point.x += point.vx;
      point.y += point.vy;

      // Boundary check to reverse the velocity if the point hits the canvas edge
      if (point.x <= 0 || point.x >= canvasRef.current.width) point.vx *= -1;
      if (point.y <= 0 || point.y >= canvasRef.current.height) point.vy *= -1;
    });
  };

  // Draw points
  const drawPoints = (ctx) => {
    points.current.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = "white"; // Set point color to white
      ctx.fill();

      // Draw subtle trail
      ctx.beginPath();
      ctx.moveTo(point.trail[0].x, point.trail[0].y);
      for (let i = 1; i < point.trail.length; i++) {
        const p = point.trail[i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)"; // Adjust the opacity of the trail
      ctx.stroke();
    });
  };

  const drawConnections = (ctx, commonKeyword) => {
    // Temporary array to track new permanent connections identified in this frame
    let newPermanentConnections = [];

    points.current.forEach((point, index) => {
      for (let i = index + 1; i < points.current.length; i++) {
        const other = points.current[i];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);

        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);

          // Check if both points have the common keyword
          if (
            point.keywords.includes(commonKeyword) &&
            other.keywords.includes(commonKeyword)
          ) {
            ctx.strokeStyle = "red"; // Red for connections based on the most common keyword

            // Add to permanent connections if not already included
            const connection = `${index}-${i}`;
            if (!permanentConnections.includes(connection)) {
              setPermanentConnections((prev) => [...prev, connection]);
            }
          } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"; // Default connection color
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
          background: "black", // Set canvas background color to black
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
          color: "white", // Set text color to white
          background: "rgba(0, 0, 0, 0.7)", // Set background color to black with opacity
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        {/* <h2>Analysis Data</h2>
          <p>Mood: {analysisData.Mood}</p>
          <p>Keywords: {analysisData.Keywords.join(", ")}</p> */}
      </div>
    </div>
  );
};

export default Dashboard;
