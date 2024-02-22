import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Dashboard = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let width = window.innerWidth;
    let height = window.innerHeight;
    let frameId;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 400;

    // Sphere (Planet)
    const sphereGeometry = new THREE.SphereGeometry(100, 32, 32);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x7777ff, wireframe: true });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(sphere);

    // Nodes
    const nodes = [];
    const nodeGeometry = new THREE.SphereGeometry(3, 32, 32);
    for (let i = 0; i < 20; i++) {
      const nodeMaterial = new THREE.MeshBasicMaterial({ color: new THREE.Color(`hsl(${Math.random() * 360}, 100%, 50%)`) });
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);

      // Position nodes randomly on the surface of the sphere
      const phi = Math.acos(-1 + (2 * i) / 20);
      const theta = Math.sqrt(20 * Math.PI) * phi;
      node.position.x = 100 * Math.sin(phi) * Math.cos(theta);
      node.position.y = 100 * Math.sin(phi) * Math.sin(theta);
      node.position.z = 100 * Math.cos(phi);

      scene.add(node);
      nodes.push(node);
    }

    // Add to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Animation Loop
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);

      // Rotate sphere
      sphere.rotation.x += 0.005;
      sphere.rotation.y += 0.005;

      // Optionally, rotate nodes or implement other animations

      renderer.render(scene, camera);
    };

    // Start animation
    animate();

    // Handle resize
    window.addEventListener("resize", () => {
      width = window.innerWidth;
      height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default Dashboard;
