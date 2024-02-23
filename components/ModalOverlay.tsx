import React, { useRef, useEffect } from "react";
import { CSSProperties } from "react";
import * as THREE from "three";

// Import FontLoader and TextGeometry from separate modules
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

interface ModalOverlayProps {
  onClose: () => void;
}

const ModalOverlay: React.FC<ModalOverlayProps> = ({ onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Three.js initialization
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Grid creation
    const gridSize = 10;
    const gridStep = 1;
    const grid = new THREE.GridHelper(gridSize, gridSize, 0xffffff, 0x000000);
    grid.position.y = -0.5;
    scene.add(grid);

    // Text creation
    const fontLoader = new FontLoader();
    fontLoader.load("https://cdn.jsdelivr.net/gh/mrdoob/three.js/examples/fonts/helvetiker_regular.typeface.json", (font) => {
      const textGeometry = new TextGeometry("To be relevant in a living system is to generate vitality.", {
        font: font,
        size: 0.3,
        height: 0.1,
      });
      const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(-2, 1, -5);
      scene.add(textMesh);
    });

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

  const modalOverlayStyle: CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999, // Ensures the modal is displayed above other content
  };

  const modalContentStyle: CSSProperties = {
    textAlign: "center",
    position: "absolute",
    zIndex: 10000, // Ensure the content is above the Three.js background
  };

  const buttonStyle: CSSProperties = {
    background: "linear-gradient(to left, #ac38cc, #753a88)", // Gradient similar to bubbles
    border: "none",
    borderRadius: "4px",
    color: "#FFFFFF",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "16px", // Global font size
    fontFamily: "'Nunito', sans-serif", // Global font family
    margin: "20px",
  };

  // Function to insert line breaks every 7 words
  const insertLineBreaks = (text: string): JSX.Element => {
    const words = text.split(" ");
    const chunks = [];
    let i = 0;
    while (i < words.length) {
      chunks.push(words.slice(i, i + 7).join(" "));
      i += 7;
    }
    return (
      <>
        {chunks.map((chunk, index) => (
          <React.Fragment key={index}>
            {chunk}
            <br />
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div className="modal-content" style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        <p style={{ margin: 0 }}>{insertLineBreaks("To be relevant in a living system is to generate vitality.")}</p>
        <button style={buttonStyle} onClick={onClose}>
          New Chat
        </button>
      </div>
      <div ref={containerRef}></div>
    </div>
  );
};

export default ModalOverlay;
