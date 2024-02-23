import React, { useEffect } from "react";
import * as THREE from "three";

const ModalOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  useEffect(() => {
    // Three.js initialization
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Grid creation
    const gridSize = 10;
    const gridStep = 1;
    const grid = new THREE.GridHelper(gridSize, gridSize, 0xffffff, 0x000000);
    grid.position.y = -0.5;
    scene.add(grid);

    // Text creation
    const fullText = "To be relevant in a living system is to generate vitality. What is that? Its relationships that build relationships that build relationships: 3rd & 4th order relational process is real systemic work. No KPI can measure it. This is #WarmData";
    const words = fullText.split(" ");
    const lines = [];
    for (let i = 0; i < words.length; i += 7) {
      lines.push(words.slice(i, i + 7).join(" "));
    }
    const textGeometry = new THREE.TextGeometry(lines.join("\n"), {
      size: 0.3,
      height: 0.1,
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 0, -5);
    scene.add(textMesh);

    // Camera positioning
    camera.position.z = 5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Clean up
    return () => {
      scene.remove(grid);
      renderer.dispose();
    };
  }, []);

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%" }} onClick={onClose}>
      <button style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }} onClick={onClose}>
        Close Modal
      </button>
    </div>
  );
};

export default ModalOverlay;
