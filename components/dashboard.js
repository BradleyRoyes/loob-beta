import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import { Noise } from "noisejs"; // Import the Noise object from noisejs

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const maxNodes = 10;
  const connectionDistance = 100;
  const [analysisData, setAnalysisData] = useState({ Mood: "", Keywords: [] });
  const [mostCommonKeyword, setMostCommonKeyword] = useState("");
  const [permanentLine, setPermanentLine] = useState([]);
  const [showModal, setShowModal] = useState(false);

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
      // console.log("Raw received data:", data);
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
      console.error(
        `Failed to subscribe to 'my-channel'. Status code: ${statusCode}`,
      );
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
    const noiseGen = new Noise(Math.random());

    const draw = () => {
      ctx.fillStyle = "black"; // Set background color to black
      ctx.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with black color
      updatePoints(noiseGen); // Pass the noise generator to the update function
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
        ["", 0],
      );

      console.log(`Most common keyword: ${mostCommon[0]}`, mostCommon[1]);
      setMostCommonKeyword(mostCommon[0]); // Update state with the most common keyword
    };

    // Interval to calculate the most common keyword every minute
    const intervalId = setInterval(calculateMostCommonKeyword, 30000); // Adjust to 60000 for 1 minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [analysisData.Keywords]);
  
  const updatePoints = (noiseGen) => {
    points.current.forEach((point) => {
      // Omit the noise-based velocity adjustment to maintain consistent speed
      // Simply update the point position based on its current velocity
      point.x += point.vx;
      point.y += point.vy;

      // Boundary check to reverse the velocity if the point hits the canvas edge
      if (point.x <= 0 || point.x >= canvasRef.current.width) point.vx *= -1;
      if (point.y <= 0 || point.y >= canvasRef.current.height) point.vy *= -1;

      // Manage the trail for visual effect
      point.trail.push({ x: point.x, y: point.y });
      if (point.trail.length > 10) point.trail.shift();
    });
  };


    const addNewPoint = (mood) => {
      const canvas = canvasRef.current;
      let velocityRange;
      switch (mood) {
        case "positive":
          velocityRange = { min: 1.5, max: 2.0 }; // Fast
          break;
        case "neutral":
        default: // Neutral serves as default
          velocityRange = { min: 0.75, max: 1.25 }; // Medium
          break;
        case "negative":
          velocityRange = { min: 0.25, max: 0.5 }; // Slow
          break;
      }

      const vx = (Math.random() * (velocityRange.max - velocityRange.min) + velocityRange.min) * (Math.random() < 0.5 ? -1 : 1);
      const vy = (Math.random() * (velocityRange.max - velocityRange.min) + velocityRange.min) * (Math.random() < 0.5 ? -1 : 1);

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
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: vx,
      vy: vy,
      radius: Math.random() * 2 + 1,
      trail: [], // Store previous positions for the trailing effect
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
      ctx.strokeStyle = "rgba(255, 255, 255, 0.07)"; // Adjust the opacity of the trail
      ctx.stroke();
    });
  };

  // Draw connections between close points
  // Adjust drawConnections to draw the permanent line based on the sequence of points in permanentLine
  // Draw connections between close points with fading effect
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
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
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
          background: "rgba(0, 0, 0, 0.9)", // Set background color to black with opacity
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        {/* <h2>Analysis Data</h2>
          <p>Mood: {analysisData.Mood}</p>
          <p>Keywords: {analysisData.Keywords.join(", ")}</p> */}
        <p>Most Common Keyword: {mostCommonKeyword}</p>{" "}
        {/* Display the most common keyword */}
      </div>
      {/* Modal Overlay */}
      <div className={`modal-overlay ${showModal ? 'show' : ''}`}>
        <div className="modal-content">
          {mostCommonKeyword}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;