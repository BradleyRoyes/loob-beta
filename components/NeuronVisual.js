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
    const ambientLight = new THREE.AmbientLight(0xFFA07A); // Light coral color
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xFF5733, 0.5); // Dark salmon color
    scene.add(directionalLight);

    // Neuron Points
    const points = [];
    const neuronColor = new THREE.Color(0xFF9966); // Pastel orange color

    for (let i = 0; i < 1000; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;

      const neuronPoint = new THREE.Vector3(x, y, z);
      points.push(neuronPoint);
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.PointsMaterial({ color: neuronColor, size: 0.02 });

    const neuronPoints = new THREE.Points(geometry, material);
    scene.add(neuronPoints);

    camera.position.z = 5;

    // Animation Loop
    const animate = function () {
      requestAnimationFrame(animate);

      // Rotate the neuron
      neuronPoints.rotation.x += 0.002;
      neuronPoints.rotation.y += 0.002;

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
