import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

const FractalPoints = () => {
  const meshRef = useRef();
  const [points] = useState(() => {
    const pts = [];
    for (let i = 0; i < 10000; i++) {
      pts.push([Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1]);
    }
    return pts;
  });

  useFrame(() => {
    meshRef.current.rotation.x += 0.001;
    meshRef.current.rotation.y += 0.001;
  });

  return (
    <Points ref={meshRef} positions={points} frustumCulled={false}>
      <PointMaterial color="#00ff00" size={0.005} />
    </Points>
  );
};

const NeuronVisual = () => {
  return (
    <Canvas>
      <ambientLight intensity={0.5} />
      <directionalLight position={[0, 0, 5]} intensity={1} />
      <FractalPoints />
    </Canvas>
  );
};

export default NeuronVisual;
