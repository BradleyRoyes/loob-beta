import React, { useEffect, useRef, useState } from "react";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState("dark");

  // Sample data - You might want to fetch or dynamically update this
  const [dataEntries] = useState([
    {
      mood: "Negative",
      keywords: ["difficult time", "shrooms", "sad", "angry"],
    },
    // Add more sample data entries as needed
  ]);

  // Function to map mood to a pastel color
  const moodToColor = (mood) => {
    const pastelColors = {
      Negative: "#f6dfeb", // Example pastel purple
      // Define more mappings as needed
    };
    return pastelColors[mood] || "#ffffff"; // Default to white
  };

  // Recursive function to draw fractal (simplified example)
  const drawFractal = (ctx, startX, startY, length, angle, depth, color) => {
    if (depth === 0) return;

    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = depth;
    ctx.stroke();

    // Recursively draw the next branches
    drawFractal(ctx, endX, endY, length * 0.7, angle - 0.2, depth - 1, color);
    drawFractal(ctx, endX, endY, length * 0.7, angle + 0.2, depth - 1, color);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth; // Adjust as needed
    canvas.height = window.innerHeight; // Adjust as needed

    // Clear canvas before redrawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw a fractal for each data entry
    dataEntries.forEach((entry, index) => {
      const color = moodToColor(entry.mood);
      // Example starting parameters for the fractal
      drawFractal(
        ctx,
        canvas.width / 2,
        canvas.height - 20,
        60,
        -Math.PI / 2,
        10,
        color,
      );
    });
  }, [dataEntries]); // Redraw when dataEntries changes

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
            {/* Canvas for generative art */}
            <canvas ref={canvasRef} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
