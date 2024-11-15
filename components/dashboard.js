import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import * as d3 from "d3";
import cloud from "d3-cloud";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const connectionDistance = 100;
  const [keywordData, setKeywordData] = useState([]); // For word cloud
  const [moodData, setMoodData] = useState([]); // For mood distribution

  // Fetch data for moods and keywords from the server
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/root"); // Replace with your endpoint
        const data = await response.json();
        setMoodData(data.moodData);
        setKeywordData(data.keywordData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }
    fetchData();
  }, []);

  // Initialize Pusher for real-time updates
  useEffect(() => {
    const pusher = new Pusher("facc28e7df1eec1d7667", {
      cluster: "eu",
      encrypted: true,
    });

    const channel = pusher.subscribe("my-channel");
    channel.bind("my-event", (data) => {
      console.log("Real-time update received:", data);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  // Draw the word cloud
  const drawWordCloud = () => {
    const svgRef = document.querySelector("#wordcloud");
    if (!svgRef) return;

    const layout = cloud()
      .size([400, 300]) // Width x Height
      .words(
        keywordData.map(({ keyword, count }) => ({
          text: keyword,
          size: count * 10, // Scale font size by count
        }))
      )
      .padding(5)
      .rotate(() => (Math.random() > 0.5 ? 90 : 0)) // Rotate words randomly
      .font("sans-serif")
      .fontSize((d) => d.size) // Use calculated size
      .on("end", draw);

    layout.start();

    function draw(words) {
      const svg = d3.select(svgRef).attr("width", layout.size()[0]).attr("height", layout.size()[1]);
      svg.selectAll("*").remove(); // Clear previous word cloud

      svg
        .append("g")
        .attr(
          "transform",
          `translate(${layout.size()[0] / 2}, ${layout.size()[1] / 2})`
        )
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", (d) => `${d.size}px`)
        .style("font-family", "sans-serif")
        .style("fill", () => `hsl(${Math.random() * 360}, 100%, 50%)`)
        .attr("text-anchor", "middle")
        .attr("transform", (d) => `translate(${d.x}, ${d.y}) rotate(${d.rotate})`)
        .text((d) => d.text);
    }
  };

  // Draw the canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const drawPoints = () => {
      points.current.forEach((point) => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();

        point.x += point.vx;
        point.y += point.vy;

        if (point.x <= 0 || point.x >= canvas.width) point.vx *= -1;
        if (point.y <= 0 || point.y >= canvas.height) point.vy *= -1;
      });
    };

    const drawConnections = () => {
      points.current.forEach((point, index) => {
        for (let i = index + 1; i < points.current.length; i++) {
          const other = points.current[i];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(0, 0, 0, ${1 - distance / connectionDistance})`;
            ctx.stroke();
          }
        }
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawPoints();
      drawConnections();
      requestAnimationFrame(draw);
    };

    draw();
  };

  useEffect(() => {
    drawCanvas();
  }, []);

  useEffect(() => {
    drawWordCloud();
  }, [keywordData]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
      {/* Canvas Panel */}
      <div
        style={{
          gridColumn: "1 / 3",
          position: "relative",
          border: "2px solid black",
          borderRadius: "8px",
        }}
      >
        <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }}></canvas>
      </div>

      {/* Word Cloud Panel */}
      <div
        style={{
          border: "2px solid black",
          borderRadius: "8px",
          padding: "20px",
          background: "#f7f7f7",
        }}
      >
        <h2>Keyword Word Cloud</h2>
        <svg id="wordcloud"></svg>
      </div>

      {/* Mock Panel */}
      <div
        style={{
          border: "2px solid black",
          borderRadius: "8px",
          padding: "20px",
          background: "#f7f7f7",
        }}
      >
        <h2>Mock Panel</h2>
        <p>This is a mock panel for additional functionality.</p>
      </div>
    </div>
  );
};

export default Dashboard;
