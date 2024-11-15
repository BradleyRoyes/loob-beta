import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Pusher from "pusher-js";

const Dashboard = () => {
  const canvasRef = useRef(null);
  const plantRef = useRef();
  const points = useRef([]);
  const [mostCommonKeyword, setMostCommonKeyword] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [analysisData, setAnalysisData] = useState({ Mood: "", Keywords: [] });

  useEffect(() => {
    const globalErrorHandler = (message, source, lineno, colno, error) => {
      console.log("Caught an error:", message, "from", source, "line", lineno, "column", colno);
      console.error(error);
      return true;
    };

    window.onerror = globalErrorHandler;
    return () => (window.onerror = null);
  }, []);

  useEffect(() => {
    // Initialize Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFE4C4);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Plant material with high gloss
    const plantMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ff00,
      roughness: 0.1,
      metalness: 0.5,
    });

    // Initialize plant structure
    plantRef.current = new THREE.Group();
    scene.add(plantRef.current);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (mostCommonKeyword) {
      setShowModal(true);
      const timer = setTimeout(() => setShowModal(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [mostCommonKeyword]);

  useEffect(() => {
    const pusher = new Pusher("facc28e7df1eec1d7667", { cluster: "eu", encrypted: true });
    const channel = pusher.subscribe("my-channel");

    channel.bind("my-event", (data) => {
      setAnalysisData((prev) => ({
        Mood: data.analysis.Mood,
        Keywords: [...prev.Keywords, ...(data.analysis.Keywords || [])],
      }));
      addPlantSegment(data.analysis.Mood.toLowerCase());
    });

    channel.bind("pusher:subscription_succeeded", () =>
      console.log("Successfully subscribed to 'my-channel'")
    );

    channel.bind("pusher:subscription_error", (statusCode) =>
      console.error(`Subscription error: Status code ${statusCode}`)
    );

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const calculateMostCommonKeyword = () => {
      const keywordFrequency = {};
      analysisData.Keywords.forEach((keyword) => {
        keywordFrequency[keyword] = (keywordFrequency[keyword] || 0) + 1;
      });
      const [mostCommon] = Object.entries(keywordFrequency).reduce(
        (acc, curr) => (curr[1] > acc[1] ? curr : acc),
        ["", 0]
      );
      setMostCommonKeyword(mostCommon);
    };

    const intervalId = setInterval(calculateMostCommonKeyword, 1200000);
    return () => clearInterval(intervalId);
  }, [analysisData.Keywords]);

  const addPlantSegment = (mood) => {
    const segmentHeight = mood === "positive" ? 0.6 : mood === "negative" ? 0.3 : 0.5;
    const segmentGeometry = new THREE.CylinderGeometry(0.1, 0.1, segmentHeight, 8);

    const segmentMaterial = new THREE.MeshStandardMaterial({
      color: mood === "positive" ? 0x88ff88 : mood === "negative" ? 0x5555ff : 0x00ff00,
      roughness: mood === "positive" ? 0.2 : 0.5,
      metalness: 0.5,
    });

    const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
    segment.position.set(0, plantRef.current.children.length * segmentHeight, 0);
    segment.rotation.z = Math.random() * 0.1 - 0.05;
    plantRef.current.add(segment);
  };

  return (
    <div>
      <div ref={canvasRef} style={{ width: "100vw", height: "100vh", position: "absolute", top: 0, left: 0 }}></div>
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 1,
          color: "black",
          background: "rgba(255, 255, 255, 0.9)",
          padding: "10px",
          borderRadius: "8px",
        }}
      >
        <p>Most Common Keyword: {mostCommonKeyword}</p>
      </div>
      <div className={`modal-overlay ${showModal ? "show" : ""}`}>
        <div className="modal-content">{mostCommonKeyword}</div>
      </div>
    </div>
  );
};

export default Dashboard;
