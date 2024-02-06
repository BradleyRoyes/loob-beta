// TestVisual.js
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const TestVisual = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const sampleData = {
      analysisResult: "Keyword1, Keyword2, Keyword3, Keyword4, Keyword5",
    };

    const generateWordCloud = (keywords) => {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      mountRef.current.appendChild(renderer.domElement);

      keywords.forEach((keyword, index) => {
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.x = Math.random() * 5 - 2.5; // Spread the words out
        cube.position.y = Math.random() * 5 - 2.5;
        scene.add(cube);

        const loader = new THREE.FontLoader();

        loader.load('fonts/helvetiker_regular.typeface.json', function (font) {
          const textGeometry = new THREE.TextGeometry(keyword, {
            font: font,
            size: 0.5,
            height: 0.1,
          });
          const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          textMesh.position.x = cube.position.x;
          textMesh.position.y = cube.position.y;
          scene.add(textMesh);
        });
      });

      camera.position.z = 5;

      const animate = function () {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };

      animate();
    };

    generateWordCloud(sampleData.analysisResult.split(',').map(keyword => keyword.trim()));

    return () => {
      mountRef.current && mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef}></div>;
};

export default TestVisual;
