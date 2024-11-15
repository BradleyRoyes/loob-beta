import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import WordCloud from "react-wordcloud";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const connectionDistance = 100;
  const maxNodes = 10;
  const [analysisData, setAnalysisData] = useState({ Mood: "", Keywords: [] });
  const [mostCommonKeyword, setMostCommonKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [moodData, setMoodData] = useState([]); // For pie chart
  const [keywordData, setKeywordData] = useState([]); // For word cloud

  // Fetch data from the server (moods and keywords)
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/root"); // Adjust this to your endpoint
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
      setAnalysisData((prev) => ({
        Mood: data.analysis.Mood,
        Keywords: [...prev.Keywords, ...(data.analysis.Keywords || [])],
      }));
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  const wordCloudWords = keywordData.map(({ keyword, count }) => ({
    text: keyword,
    value: count,
  }));

  const moodChartData = {
    labels: moodData.map((m) => m.mood),
    datasets: [
      {
        data: moodData.map((m) => m.count),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"], // Example colors
        hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"],
      },
    ],
  };

  const addNewPoint = (mood) => {
    const canvas = canvasRef.current;
    const velocity = mood === "positive" ? 1 : mood === "neutral" ? 0.5 : 0.25;

    points.current.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * velocity,
      vy: (Math.random() - 0.5) * velocity,
      mood: mood,
      radius: Math.random() * 2 + 1,
    });
  };

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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
      {/* Canvas Panel */}
      <div
        style={{
          gridColumn: "1 / 3",
          position: "relative",
          border: "2px solid black",
          borderRadius: "8px",
          overflow: "hidden",
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
        {wordCloudWords.length > 0 ? (
          <WordCloud
            words={wordCloudWords}
            options={{ fontSizes: [15, 50], rotations: 2, rotationAngles: [0, 90] }}
          />
        ) : (
          <p>Loading word cloud...</p>
        )}
      </div>

      {/* Mood Chart Panel */}
      <div
        style={{
          border: "2px solid black",
          borderRadius: "8px",
          padding: "20px",
          background: "#f7f7f7",
        }}
      >
        <h2>Mood Distribution</h2>
        {moodData.length > 0 ? (
          <Pie data={moodChartData} />
        ) : (
          <p>Loading mood distribution...</p>
        )}
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
