import React, { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import { Noise } from "noisejs";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const points = useRef([]);
  const [analysisData, setAnalysisData] = useState({ Mood: "", Keywords: [] });
  const [mostCommonKeyword, setMostCommonKeyword] = useState("");

  const spawnTestPoints = () => {
    const canvas = canvasRef.current;
    const mockMoods = ['positive', 'neutral', 'negative'];
    const mockKeywords = ['happy', 'content', 'sad'];

    for (let i = 0; i < 20; i++) {
      const randomMood = mockMoods[Math.floor(Math.random() * mockMoods.length)];
      const randomKeyword = mockKeywords[Math.floor(Math.random() * mockKeywords.length)];
      points.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() * 2 - 1) * 2,
        vy: (Math.random() * 2 - 1) * 2,
        radius: Math.random() * 2 + 1,
        trail: [],
        mood: randomMood,
        keywords: [randomKeyword],
      });
    }
  };

  useEffect(() => {
    const globalErrorHandler = (message, source, lineno, colno, error) => {
      console.log("Caught an error:", message, "from", source, "line", lineno, "column", colno);
      console.error(error);
      return true;
    };

    window.onerror = globalErrorHandler;

    return () => {
      window.onerror = null;
    };
  }, []);

  useEffect(() => {
    const pusher = new Pusher("facc28e7df1eec1d7667", {
      cluster: "eu",
      encrypted: true,
    });

    const channel = pusher.subscribe("my-channel");

    channel.bind("my-event", (data) => {
      setAnalysisData((prevAnalysisData) => ({
        Mood: data.analysis.Mood,
        Keywords: [...prevAnalysisData.Keywords, ...(data.analysis.Keywords || [])],
      }));

      // Add a new point for every new data received
      addNewPoint(data.analysis.Mood.toLowerCase());
    });

    channel.bind("pusher:subscription_succeeded", () => {
      console.log("Successfully subscribed to 'my-channel'");
    });

    channel.bind("pusher:subscription_error", (statusCode) => {
      console.error(`Failed to subscribe to 'my-channel'. Status code: ${statusCode}`);
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    spawnTestPoints();

    const noiseGen = new Noise(Math.random());

    const draw = () => {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      updatePoints(noiseGen);
      drawPoints(ctx);
      drawConnections(ctx);
      requestAnimationFrame(draw);
    };

    draw();
  }, []);

  useEffect(() => {
    const calculateMostCommonKeyword = () => {
      const keywordFrequency = analysisData.Keywords.reduce((acc, keyword) => {
        acc[keyword] = (acc[keyword] || 0) + 1;
        return acc;
      }, {});

      const mostCommon = Object.entries(keywordFrequency).reduce(
        (a, b) => (a[1] > b[1] ? a : b),
        ["", 0]
      );

      setMostCommonKeyword(mostCommon[0]);
    };

    const intervalId = setInterval(calculateMostCommonKeyword, 60000);

    return () => clearInterval(intervalId);
  }, [analysisData.Keywords]);

  const addNewPoint = (mood) => {
    const canvas = canvasRef.current;
    let velocityRange;
    switch (mood) {
      case "positive":
        velocityRange = { min: 0.5, max: 0.67 };
        break;
      case "neutral":
        velocityRange = { min: 0.25, max: 0.42 };
        break;
      case "negative":
        velocityRange = { min: 0.08, max: 0.17 };
        break;
      default:
        velocityRange = { min: 0.25, max: 0.42 };
    }

    const vx = (Math.random() * (velocityRange.max - velocityRange.min) + velocityRange.min) * (Math.random() < 0.5 ? -1 : 1);
    const vy = (Math.random() * (velocityRange.max - velocityRange.min) + velocityRange.min) * (Math.random() < 0.5 ? -1 : 1);

    points.current.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: vx,
      vy: vy,
      radius: Math.random() * 2 + 1,
      trail: [],
      mood: mood,
      keywords: analysisData.Keywords,
    });
  };

  const updatePoints = (noiseGen) => {
    points.current.forEach((point) => {
      point.trail.push({ x: point.x, y: point.y });

      if (point.trail.length > 20) {
        point.trail.shift();
      }

      const noiseX = noiseGen.simplex2(point.x * 0.01, point.y * 0.01);
      const noiseY = noiseGen.simplex2(point.y * 0.01, point.x * 0.01);

      point.vx += noiseX * 0.01;
      point.vy += noiseY * 0.01;

      point.x += point.vx;
      point.y += point.vy;

      if (point.x <= 0 || point.x >= canvas.width) point.vx *= -1;
      if (point.y <= 0 || point.y >= canvas.height) point.vy *= -1;
    });
  };

  const drawPoints = (ctx) => {
    points.current.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(point.trail[0].x, point.trail[0].y);
      for (let i = 1; i < point.trail.length; i++) {
        const p = point.trail[i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
      ctx.stroke();
    });
  };

  const drawConnections = (ctx) => {
    const connectionDistance = 100;
    points.current.forEach((point, index) => {
      for (let i = index + 1; i < points.current.length; i++) {
        const other = points.current[i];
        const distance = Math.hypot(point.x - other.x, point.y - other.y);
        if (distance < connectionDistance) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(other.x, other.y);
          const shareCommonKeyword = point.keywords.includes(mostCommonKeyword) && other.keywords.includes(mostCommonKeyword);
          ctx.strokeStyle = shareCommonKeyword ? "red" : "rgba(255, 255, 255, 0.1)";
          ctx.stroke();
        }
      }
    });
  };

  return (
    <div>
      <canvas ref={canvasRef} style={{ display: "block", background: "black", position: "absolute", zIndex: -1 }}></canvas>
      <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 1, color: "white", background: "rgba(0, 0, 0, 0.7)", padding: "10px", borderRadius: "8px" }}>
        <p>Most Common Keyword: {mostCommonKeyword}</p>
      </div>
    </div>
  );
};

export default Dashboard;
