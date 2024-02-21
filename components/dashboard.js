import React, { useEffect, useRef, useState } from "react";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState("dark");

  // Enhanced sample data entries with starting points
  const [dataEntries] = useState([
    {
      mood: "Negative",
      keywords: ["difficult time", "shrooms", "sad", "angry"],
      startX: 200, // Starting X position for the entry
      startY: 300, // Starting Y position for the entry
    },
    {
      mood: "Positive",
      keywords: ["happy", "joy", "success"],
      startX: 600,
      startY: 400,
    },
    {
      mood: "Neutral",
      keywords: ["routine", "everyday"],
      startX: 400,
      startY: 500,
    },
    // Add more entries as needed
  ]);

  // Function to map mood to a color
  const moodToColor = (mood) => {
    const moodColors = {
      Negative: "rgba(255, 0, 0, 0.5)",
      Positive: "rgba(0, 255, 0, 0.5)",
      Neutral: "rgba(100, 100, 100, 0.5)",
    };
    return moodColors[mood] || "rgba(0, 0, 0, 0.5)";
  };

  const drawBranch = (
    ctx,
    startX,
    startY,
    length,
    angle,
    depth,
    maxDepth,
    color,
  ) => {
    if (depth > maxDepth) return;

    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = maxDepth - depth;
    ctx.stroke();

    if (depth === maxDepth) {
      // At each final branch, consider spawning a new growth with a slight chance
      if (Math.random() < 0.1) {
        // Adjust probability to control density
        setTimeout(() => {
          drawBranch(
            ctx,
            endX,
            endY,
            length * 0.7,
            angle - Math.random() * 0.4,
            0,
            maxDepth + Math.random() * 2,
            color,
          ); // Slightly vary angle and maxDepth for new growth
        }, 200); // Delay before starting a new growth
      }
    } else {
      const newLength = length * 0.7;
      const angleSpread = Math.PI / 6;
      drawBranch(
        ctx,
        endX,
        endY,
        newLength,
        angle - angleSpread,
        depth + 1,
        maxDepth,
        color,
      );
      drawBranch(
        ctx,
        endX,
        endY,
        newLength,
        angle + angleSpread,
        depth + 1,
        maxDepth,
        color,
      );
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Start with a clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Loop through each data entry to start a new growth point
      dataEntries.forEach((entry) => {
        const color = moodToColor(entry.mood);
        // Begin drawing the fractal from each entry's starting point
        drawBranch(
          ctx,
          entry.startX,
          entry.startY,
          50, // Initial branch length
          -Math.PI / 2, // Initial angle, pointing upwards
          0, // Starting depth
          5, // Max depth to start with; adjust based on desired complexity
          color,
        );
      });
    }
  }, [dataEntries]); // Redraw when dataEntries changes to react to dynamic data updates

  return (
    <main
      className={`flex flex-col items-center justify-center min-h-screen py-4 ${
        theme === "dark" ? "dark" : "light"
      }`}
    >
      <section className="chatbot-section max-w-4xl w-full overflow-hidden rounded-md shadow-lg">
        <div className="p-4">
          <h1 className="chatbot-text-primary text-3xl font-bold">Dashboard</h1>
          <div className="visualization-container mb-4">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
