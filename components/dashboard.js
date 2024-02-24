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
    const intervalId = setInterval(calculateMostCommonKeyword, 60000); // Adjust to 60000 for 1 minute

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [analysisData.Keywords]);

  useEffect(() => {
    // Assuming points are already added to points.current
    if (points.current.length >= 2) {
      // Randomly select two distinct points
      const index1 = Math.floor(Math.random() * points.current.length);
      let index2 = Math.floor(Math.random() * points.current.length);
      while (index1 === index2) {
        // Ensure they are distinct
        index2 = Math.floor(Math.random() * points.current.length);
      }

      // Form the initial permanent connection
      const initialConnection = `${index1}-${index2}`;
      setPermanentConnections([initialConnection]);
    }
  }, []);

  useEffect(() => {
    // Only attempt to update permanentLine if there are enough points and no permanent connections have been set
    if (points.current.length >= 2 && permanentLine.length < 2) {
      let startIndexes = [];
      while (startIndexes.length < 2) {
        let newIndex = Math.floor(Math.random() * points.current.length);
        if (!startIndexes.includes(newIndex)) {
          startIndexes.push(newIndex);
        }
      }
      setPermanentLine(startIndexes);
    }
  }, [points.current.length]); // Depend on the number of points


    // Periodically add a new point to the permanentLine every 15 minutes
    const intervalId = setInterval(() => {
      if (points.current.length > permanentLine.length) {
        let nextPoint;
        do {
          nextPoint = Math.floor(Math.random() * points.current.length);
        } while (permanentLine.includes(nextPoint));

        setPermanentLine(prevLine => [...prevLine, nextPoint]);
      }
    }, 60000);//900000); // 15 minutes in milliseconds

    return () => clearInterval(intervalId);
  }, [permanentLine]);
  const updatePoints = (noiseGen) => {
      points.current.forEach((point, index) => {
          // Initially assume the point is not part of a permanent connection
          let isPartOfPermanentLine = false;

          // Check if the current point's index is in the permanentLine array
          if (permanentLine.includes(index)) {
              isPartOfPermanentLine = true;
          }

          if (!isPartOfPermanentLine) {
              // Apply Perlin noise for natural movement if not part of a permanent line
              const noiseX = noiseGen.simplex2(point.x * 0.01, point.y * 0.01);
              const noiseY = noiseGen.simplex2(point.y * 0.01, point.x * 0.01);

              point.vx += noiseX * 0.02; // Adjust velocity based on Perlin noise
              point.vy += noiseY * 0.02;
          } else {
              // For points that are part of the permanent line, you might want to 
              // apply a different logic or skip the update to maintain the line integrity
              // For now, let's slightly reduce their velocity to demonstrate this concept
              point.vx *= 0.95;
              point.vy *= 0.95;
          }

          // Update point position
          point.x += point.vx;
          point.y += point.vy;

          // Boundary check to reverse the velocity if the point hits the canvas edge
          if (point.x <= 0 || point.x >= canvasRef.current.width) {
              point.vx *= -1;
          }
          if (point.y <= 0 || point.y >= canvasRef.current.height) {
              point.vy *= -1;
          }

          // Manage the trail for visual effect
          point.trail.push({ x: point.x, y: point.y });
          if (point.trail.length > 10) {
              point.trail.shift();
          }
      });
  };

  // Function to add a new point with velocity based on the mood
  const addNewPoint = (mood) => {
    const canvas = canvasRef.current;

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
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: vx,
      vy: vy,
      radius: Math.random() * 2 + 1,
      trail: [], // Store previous positions for the trailing effect
    });
  };
  
  const drawPoints = (ctx) => {
    points.current.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = "white"; // Set point color to white
      ctx.fill();

      // Draw whispy, fading trail
      for (let i = 0; i < point.trail.length; i++) {
        const p = point.trail[i];
        const opacity = (i + 1) / point.trail.length; // Gradually decrease opacity
        ctx.beginPath();
        ctx.arc(p.x, p.y, point.radius * (1 - opacity), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.5})`; // Adjust opacity for ethereal effect
        ctx.fill();
      }
    });
  };


  // Draw connections between close points
  // Adjust drawConnections to draw the permanent line based on the sequence of points in permanentLine
// Inside drawConnections function
// Additionally, draw the permanent line based on points in permanentLine
for (let i = 0; i < permanentLine.length - 1; i++) {
  const pointIndex = permanentLine[i];
  const nextPointIndex = permanentLine[i + 1];
  // Ensure these points exist before attempting to draw
  if (points.current[pointIndex] && points.current[nextPointIndex]) {
    const point = points.current[pointIndex];
    const nextPoint = points.current[nextPointIndex];

    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.strokeStyle = "red"; // Red for the permanent line
    ctx.stroke();
  }
}


    // Draw permanent lines with a distinct color and opacity
    for (let i = 0; i < permanentLine.length - 1; i++) {
      const pointIndex = permanentLine[i];
      const nextPointIndex = permanentLine[i + 1];
      const point = points.current[pointIndex];
      const nextPoint = points.current[nextPointIndex];

      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.lineTo(nextPoint.x, nextPoint.y);
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"; // Use a red color with some opacity for permanent lines
      ctx.stroke();
    }
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
        <p>Most Common Keyword: {mostCommonKeyword}</p>{" "}
        {/* Display the most common keyword */}
      </div>
    </div>
  );
};

export default Dashboard;