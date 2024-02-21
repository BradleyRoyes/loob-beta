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
    // Add more entries as needed
  ]);

  // Function to map mood to a color
  const moodToColor = (mood) => {
    const moodColors = {
      Negative: "rgba(255, 0, 0, 0.5)", // Red for negative mood
      // Define more mappings as needed
    };
    return moodColors[mood] || "rgba(0, 255, 0, 0.5)"; // Default color
  };

  // Function to draw moving pixels
  const drawMovingPixel = (ctx, frameCount, color) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear canvas for each animation frame
    ctx.fillStyle = color; // Use color based on mood
    // Dynamic movement based on frameCount
    const x = ctx.canvas.width / 2 + Math.sin(frameCount * 0.05) * 200; // Horizontal movement
    const y = ctx.canvas.height / 2 + Math.cos(frameCount * 0.05) * 200; // Vertical movement
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI); // Draw circle as moving pixel
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let frameCount = 0;
    let animationFrameId;

    // Animation function
    const render = () => {
      frameCount++;
      const currentEntryIndex = frameCount % dataEntries.length; // Loop through data entries
      const currentEntry = dataEntries[currentEntryIndex];
      const color = moodToColor(currentEntry.mood); // Determine color based on current entry's mood
      drawMovingPixel(ctx, frameCount, color); // Pass color to drawing function
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [dataEntries]); // Dependency on dataEntries to update the drawing when entries change

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
