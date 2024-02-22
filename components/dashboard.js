import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Dashboard = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setClearColor("#000000"); // Black background
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = 500;

    // Add renderer to the DOM
    mountRef.current.appendChild(renderer.domElement);

    // Create nodes
    const nodes = [];
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // White nodes
    const nodeGeometry = new THREE.SphereGeometry(5, 32, 32); // Small sphere geometry for nodes

    // Invisible Sphere to guide node movement
    const invisibleSphere = new THREE.SphereGeometry(200, 32, 32);

    for (let i = 0; i < 20; i++) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      const vertex = invisibleSphere.vertices[Math.floor(Math.random() * invisibleSphere.vertices.length)];
      node.position.set(vertex.x, vertex.y, vertex.z);
      scene.add(node);
      nodes.push(node);
    }

    // Relationships (Lines)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF }); // White lines for initial relationships
    const relationships = [];

    // Animate Nodes
    const animate = () => {
      requestAnimationFrame(animate);

      // Move nodes and update relationships
      nodes.forEach(node => {
        const speed = 0.5;
        const direction = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
        node.position.add(direction.multiplyScalar(speed)).clampLength(0, 200); // Keep nodes within invisible sphere
      });

      // Clear old relationships
      relationships.forEach(line => {
        scene.remove(line);
      });
      relationships.length = 0;

      // Create new relationships based on proximity
      nodes.forEach((node, index) => {
        for (let j = index + 1; j < nodes.length; j++) {
          const distance = node.position.distanceTo(nodes[j].position);
          if (distance < 100) { // Threshold for connection
            const geometry = new THREE.Geometry();
            geometry.vertices.push(node.position);
            geometry.vertices.push(nodes[j].position);
            const line = new THREE.Line(geometry, lineMaterial);
            scene.add(line);
            relationships.push(line);
          }
        }
      });

      renderer.render(scene, camera);
    };

    // Handle window resizing
    window.addEventListener("resize", onWindowResize, false);
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate();

    // Cleanup
    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("resize", onWindowResize, false);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default Dashboard;
