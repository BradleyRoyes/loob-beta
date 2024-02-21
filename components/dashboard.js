import React, { useEffect, useRef, useState } from "react";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const [theme, setTheme] = useState("dark");

  // Sample data entries
  const [dataEntries] = useState([
    {
      mood: "Negative",
      keywords: ["difficult time", "shrooms", "sad", "angry"],
    },
    {
      mood: "Positive",
      keywords: ["difficult time", "shrooms", "sad", "angry"],
    },
    // Add more entries as needed
  ]);

  // Function to map mood to a color
  const moodToColor = (mood) => {
    const moodColors = {
      Negative: "rgba(255, 0, 0, 0.5)", // Red for negative mood
      Positive: "rgba(0, 255, 0, 0.5)",
      // Define more mappings as needed
    };
    return moodColors[mood] || "rgba(0, 0, 0, 0.5)"; // Default color
  };

  const drawBranch = (ctx, startX, startY, length, angle, depth, maxDepth) => {
    if (depth > maxDepth) return;

    const endX = startX + length * Math.cos(angle);
    const endY = startY + length * Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = `rgba(0,0,0,${1 - depth / maxDepth})`; // Fade color with depth
    ctx.lineWidth = maxDepth - depth; // Thinner lines for branches farther away
    ctx.stroke();

    const newLength = length * 0.7; // Each branch is 70% the length of its parent
    const angleSpread = Math.PI / 6; // Angle between branches

    drawBranch(
      ctx,
      endX,
      endY,
      newLength,
      angle - angleSpread,
      depth + 1,
      maxDepth,
    );
    drawBranch(
      ctx,
      endX,
      endY,
      newLength,
      angle + angleSpread,
      depth + 1,
      maxDepth,
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      let maxDepth = 0; // Start with a small depth
      let animationFrameId;

      const render = () => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear canvas for each frame

        // Start drawing the fractal from the bottom center of the canvas
        drawBranch(
          ctx,
          canvas.width / 2,
          canvas.height,
          100,
          -Math.PI / 2,
          0,
          maxDepth,
        );

        maxDepth += 0.1; // Increase depth for animation effect
        if (maxDepth > 10) maxDepth = 10; // Limit the depth to prevent it from growing indefinitely

        animationFrameId = window.requestAnimationFrame(render);
      };

      render();

      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    }
  }, []);

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
