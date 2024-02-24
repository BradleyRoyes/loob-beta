  import React, { useEffect, useRef, useState } from "react";
  import Pusher from "pusher-js";
  import { Noise } from "noisejs";

  const Dashboard = () => {
    const canvasRef = useRef(null);
    const points = useRef([]);
    const maxNodes = 10;
    const connectionDistance = 100;
    const [analysisData, setAnalysisData] = useState({ Mood: "", Keywords: [] });
    const [mostCommonKeyword, setMostCommonKeyword] = useState("");
    const [permanentLine, setPermanentLine] = useState([]);
    const squigglyLine = useRef({ points: [] });

    useEffect(() => {
      const globalErrorHandler = (message, source, lineno, colno, error) => {
        console.log(
          "Caught an error:",
          message,
          "from",
          source,
          "line",
          lineno,
          "column",
          colno
        );
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

      console.log("Attempting to subscribe to Pusher channel");
      const channel = pusher.subscribe("my-channel");

      channel.bind("my-event", function (data) {
        console.log("Received data:", data.analysis);
        setAnalysisData((prevAnalysisData) => {
          const updatedData = {
            Mood: data.analysis.Mood,
            Keywords: [
              ...prevAnalysisData.Keywords,
              ...(data.analysis.Keywords || []),
            ],
          };

          console.log("Updated analysis data:", updatedData);

          addNewPoint(updatedData.Mood.toLowerCase());

          return updatedData;
        });
      });

      channel.bind("pusher:subscription_succeeded", function () {
        console.log("Successfully subscribed to 'my-channel'");
      });

      channel.bind("pusher:subscription_error", function (statusCode) {
        console.error(
          `Failed to subscribe to 'my-channel'. Status code: ${statusCode}`
        );
        console.log("subscription failed");
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

      const noiseGen = new Noise(Math.random());

      const draw = () => {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        updatePoints(noiseGen);
        drawPoints(ctx);
        drawConnections(ctx);
        drawSquigglyLine(ctx);
        requestAnimationFrame(draw);
      };

      draw();
    }, []);

    useEffect(() => {
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
          ["", 0]
        );

        console.log(`Most common keyword: ${mostCommon[0]}`, mostCommon[1]);
        setMostCommonKeyword(mostCommon[0]);
      };

      const intervalId = setInterval(calculateMostCommonKeyword, 60000);

      return () => clearInterval(intervalId);
    }, [analysisData.Keywords]);

    useEffect(() => {
      if (points.current.length >= 2 && permanentLine.length === 0) {
        let startIndexes = [];
        while (startIndexes.length < 2) {
          let newIndex = Math.floor(Math.random() * points.current.length);
          if (!startIndexes.includes(newIndex)) {
            startIndexes.push(newIndex);
          }
        }
        setPermanentLine(startIndexes);
      }

      const intervalId = setInterval(() => {
        if (points.current.length > permanentLine.length) {
          let nextPoint;
          do {
            nextPoint = Math.floor(Math.random() * points.current.length);
          } while (permanentLine.includes(nextPoint));

          setPermanentLine((prevLine) => [...prevLine, nextPoint]);
        }
      }, 60000);

      return () => clearInterval(intervalId);
    }, [permanentLine]);

    const addNewPoint = (mood) => {
      const canvas = canvasRef.current;

      let velocityRange;
      switch (mood) {
        case "positive":
          velocityRange = { min: 1.5, max: 2.0 };
          break;
        case "neutral":
          velocityRange = { min: 0.75, max: 1.25 };
          break;
        case "negative":
          velocityRange = { min: 0.25, max: 0.5 };
          break;
        default:
          velocityRange = { min: 0.75, max: 1.25 };
      }

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
        trail: [],
      });
    };

    const updatePoints = (noiseGen) => {
      points.current.forEach((point, index) => {
        let isPartOfPermanentLine = false;

        if (permanentLine.includes(index)) {
          isPartOfPermanentLine = true;
        }

        if (!isPartOfPermanentLine) {
          const noiseX = noiseGen.simplex2(point.x * 0.01, point.y * 0.01);
          const noiseY = noiseGen.simplex2(point.y * 0.01, point.x * 0.01);

          point.vx += noiseX * 0.03;
          point.vy += noiseY * 0.03;
        } else {
          point.vx *= 0.95;
          point.vy *= 0.95;
        }

        point.x += point.vx;
        point.y += point.vy;

        if (point.x <= 0 || point.x >= canvasRef.current.width) {
          point.vx *= -1;
        }
        if (point.y <= 0 || point.y >= canvasRef.current.height) {
          point.vy *= -1;
        }

        point.trail.push({ x: point.x, y: point.y });
        if (point.trail.length > 10) {
          point.trail.shift();
        }
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
      points.current.forEach((point, index) => {
        for (let i = index + 1; i < points.current.length; i++) {
          const other = points.current[i];
          const distance = Math.hypot(point.x - other.x, point.y - other.y);
          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
            ctx.stroke();
          }
        }
      });

      for (let i = 0; i < permanentLine.length - 1; i++) {
        const pointIndex = permanentLine[i];
        const nextPointIndex = permanentLine[i + 1];
        const point = points.current[pointIndex];
        const nextPoint = points.current[nextPointIndex];

        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(nextPoint.x, nextPoint.y);
        ctx.strokeStyle = "red";
        ctx.stroke();
      }
    };

    const drawSquigglyLine = (ctx) => {
      const { width, height } = ctx.canvas;

      let posX = width; // Start from the right side of the canvas
      let posY = height; // Start from the bottom of the canvas
      let velX = -1; // Move towards the left
      let velY = -1; // Move upwards

      // Add some randomness to the vertical velocity to create a squiggle effect
      velY += Math.random() * 4 - 2;

      // Update the position of the line endpoint
      posX += velX;
      posY += velY;

      // Add the new point to the points array
      squigglyLine.current.points.push({ x: posX, y: posY });

      // Set the stroke color to red
      ctx.strokeStyle = 'red';

      // Begin drawing the squiggly line
      ctx.beginPath();
      ctx.moveTo(squigglyLine.current.points[0].x, squigglyLine.current.points[0].y);
      for (let i = 1; i < squigglyLine.current.points.length; i++) {
        const point = squigglyLine.current.points[i];
        ctx.lineTo(point.x, point.y);
      }
      ctx.lineWidth = 2;
      ctx.stroke();
    };

      // Reset the global composite operation to its default value
      ctx.globalCompositeOperation = 'source-over';
    };


    return (
      <div>
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            background: "black",
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
            color: "white",
            background: "rgba(0, 0, 0, 0.7)",
            padding: "10px",
            borderRadius: "8px",
          }}
        >
          <p>Most Common Keyword: {mostCommonKeyword}</p>
        </div>
      </div>
    );
  };

  export default Dashboard;
