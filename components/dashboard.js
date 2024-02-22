import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Dashboard = () => {
  const mountRef = useRef(null);
  const nodes = [];
  const connections = [];
  const maxDistance = 50; // Max distance for forming a connection
  let frameId;

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 500;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Create nodes
    const nodeGeometry = new THREE.SphereGeometry(5, 32, 32);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let i = 0; i < 20; i++) {
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeMesh.position.x = Math.random() * 400 - 200;
      nodeMesh.position.y = Math.random() * 400 - 200;
      nodeMesh.position.z = Math.random() * 400 - 200;
      nodeMesh.userData = {
        velocity: new THREE.Vector3(-0.5 + Math.random(), -0.5 + Math.random(), -0.5 + Math.random()),
        connectedness: Math.ceil(Math.random() * 10) // Random connectedness score from 1 to 10
      };
      scene.add(nodeMesh);
      nodes.push(nodeMesh);
    }

    // Animation loop
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);

      // Move nodes and update connections
      nodes.forEach((node, index) => {
        // Simple movement logic (replace with Perlin noise or another algorithm for organic movement)
        node.position.add(node.userData.velocity);
        // Keep nodes within a spherical boundary
        if (node.position.length() > 250) {
          node.userData.velocity.negate();
        }

        // Update connections based on proximity and connectedness
        for (let j = index + 1; j < nodes.length; j++) {
          const otherNode = nodes[j];
          const distance = node.position.distanceTo(otherNode.position);
          if (distance < maxDistance) {
            // Optionally, use connectedness score here to influence connection strength or visibility
            let material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
            let geometry = new THREE.Geometry();
            geometry.vertices.push(node.position);
            geometry.vertices.push(otherNode.position);
            let line = new THREE.Line(geometry, material);
            scene.add(line);
            connections.push(line);
          }
        }
      });

      // Remove old connections
      while (connections.length) {
        let line = connections.pop();
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize
    window.addEventListener('resize', onWindowResize, false);
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      mountRef.current.removeChild(renderer.domElement);
      nodes.forEach(node => scene.remove(node));
      connections.forEach(line => {
        scene.remove(line);
        line.geometry.dispose();
        line.material.dispose();
      });
    };
  }, []);

  return <div ref={mountRef} />;
};

export default Dashboard;
