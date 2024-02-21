import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import ThemeButton from "./ThemeButton";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Dashboard = () => {
  const [theme, setTheme] = useState("dark");
  const [data, setData] = useState({ mood: [], keywords: [] });
  const visualRef = useRef();
  const [scene, setScene] = useState(null); // Store the scene object

  useEffect(() => {
    fetchData();
    // Update data every minute
    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/chat/DataPull");
      setData(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (data.keywords.length > 0) {
      initThreeJS();
    }
  }, [data]);

  const initThreeJS = () => {
    if (scene) {
      while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
      }
    } else {
      const newScene = new THREE.Scene();
      setScene(newScene);
    }

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    visualRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);

    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    const animate = function () {
      requestAnimationFrame(animate);

      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      renderer.render(scene, camera);
    };

    animate();

    // Adjust this part to incorporate your data into the visualization
    // For example, you could adjust the color or size of the cube based on mood
    // Or add more objects based on the keywords array
  };

  return (
    <main
      className={`flex flex-col items-center justify-center min-h-screen py-4 ${
        theme === "dark" ? "dark" : "light"
      }`}
    >
      <section className="chatbot-section max-w-4xl w-full overflow-hidden rounded-md shadow-lg">
        <div className="p-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="chatbot-text-primary text-3xl font-bold">
              Dashboard
            </h1>
            <ThemeButton theme={theme} setTheme={setTheme} />
          </div>
          <div className="flex flex-wrap justify-around">
            <div className="visualization-container mb-4" style={{ width: '100%', height: '500px' }}>
              <h2 className="chatbot-text-primary text-xl mb-2">
                Mood and Keywords Visualization
              </h2>
              <div ref={visualRef} style={{ width: '100%', height: '100%' }} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Dashboard;
