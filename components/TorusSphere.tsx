import React, { useEffect, useRef } from "react";
import {
  Scene,
  Engine,
  Vector3,
  Color3,
  Color4,
  HemisphericLight,
  ArcRotateCamera,
  MeshBuilder,
  StandardMaterial,
  Mesh,
} from "@babylonjs/core";

export interface TorusSphereProps {
  loobricateId: string;
}

const TorusSphere: React.FC<TorusSphereProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);

  useEffect(() => {
    if (!canvasRef.current || engineRef.current) return;

    // Initialize engine
    engineRef.current = new Engine(canvasRef.current, true);
    const scene = new Scene(engineRef.current);
    
    // Transparent background
    scene.clearColor = new Color4(0, 0, 0, 0);

    // Camera
    const camera = new ArcRotateCamera(
      "camera",
      0,
      Math.PI / 3,
      20,
      Vector3.Zero(),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.useAutoRotationBehavior = true;

    // Light
    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Create three tori
    const torus1 = MeshBuilder.CreateTorus("torus1", {
      diameter: 8,
      thickness: 0.5,
      tessellation: 32
    }, scene);

    const torus2 = MeshBuilder.CreateTorus("torus2", {
      diameter: 8,
      thickness: 0.5,
      tessellation: 32
    }, scene);
    torus2.rotation.x = Math.PI / 2;

    const torus3 = MeshBuilder.CreateTorus("torus3", {
      diameter: 8,
      thickness: 0.5,
      tessellation: 32
    }, scene);
    torus3.rotation.z = Math.PI / 2;

    // Materials
    const createMaterial = (color: Color3) => {
      const material = new StandardMaterial("material", scene);
      material.emissiveColor = color;
      material.alpha = 0.8;
      return material;
    };

    torus1.material = createMaterial(new Color3(0.98, 0.8, 0.9));  // Pink
    torus2.material = createMaterial(new Color3(1, 0.85, 0.7));    // Orange
    torus3.material = createMaterial(new Color3(0.98, 0.85, 0.8)); // Peach

    // Simple animation
    scene.registerBeforeRender(() => {
      torus1.rotation.y += 0.002;
      torus2.rotation.z += 0.002;
      torus3.rotation.x += 0.002;
    });

    // Start rendering
    engineRef.current.runRenderLoop(() => {
      scene.render();
    });

    // Handle resize
    const handleResize = () => engineRef.current?.resize();
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      scene.dispose();
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        width: "100%", 
        height: "100%", 
        display: "block",
        background: "transparent",
      }} 
    />
  );
};

export default TorusSphere;
