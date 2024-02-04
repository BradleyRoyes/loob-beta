// app/components/NeuronVisual.js

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NeuronVisual = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    scene.add(directionalLight);

    // Neuron Points
    const points = [];
    for (let i = 0; i < 100; i++) {
      points.push(new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1));
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({ color: 0x00ff00, size: 0.05 });
    const neuronPoints = new THREE.Points(geometry, material);
    scene.add(neuronPoints);

    camera.position.z = 5;

    // Animation Loop
    const animate = function () {
      requestAnimationFrame(animate);

      neuronPoints.rotation.x += 0.01;
      neuronPoints.rotation.y += 0.01;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default NeuronVisual;
