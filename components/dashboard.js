
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const Dashboard = () => {
  const mount = useRef(null);

  useEffect(() => {
    // Scene setup
    const width = mount.current.clientWidth;
    const height = mount.current.clientHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    mount.current.appendChild(renderer.domElement);

    // Camera position
    camera.position.set(0, 0, 100);

    // Nodes setup
    const nodes = [];
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const nodeGeometry = new THREE.SphereGeometry(1, 32, 32);
    const maxNodes = 30;

    // Create nodes
    for (let i = 0; i < maxNodes; i++) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      node.position.x = (Math.random() - 0.5) * 50;
      node.position.y = (Math.random() - 0.5) * 50;
      node.position.z = (Math.random() - 0.5) * 50;
      scene.add(node);
      nodes.push(node);
    }

    // Red thread setup
    const threadMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const threadGeometry = new THREE.BufferGeometry();
    const threadPositions = new Float32Array(maxNodes * 3); // 3 vertices per point
    threadGeometry.setAttribute('position', new THREE.BufferAttribute(threadPositions, 3));

    const redThread = new THREE.Line(threadGeometry, threadMaterial);
    scene.add(redThread);

    // Update thread to connect nodes dynamically
    const updateThread = () => {
      const positions = redThread.geometry.attributes.position.array;
      let index = 0;
      nodes.forEach((node, i) => {
        positions[index++] = node.position.x;
        positions[index++] = node.position.y;
        positions[index++] = node.position.z;
      });
      redThread.geometry.attributes.position.needsUpdate = true;
    };

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Rotate nodes for visual effect
      nodes.forEach(node => {
        node.rotation.x += 0.01;
        node.rotation.y += 0.01;
      });

      updateThread(); // Update thread positions based on nodes
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const width = mount.current.clientWidth;
      const height = mount.current.clientHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      mount.current.removeChild(renderer.domElement);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={mount} style={{ width: '100vw', height: '100vh' }} />;
};

export default Dashboard;