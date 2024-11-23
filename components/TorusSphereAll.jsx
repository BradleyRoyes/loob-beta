import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";

const FractalUniverse = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const fractalRefs = useRef([]);
  const [spawnedPixels, setSpawnedPixels] = useState(100);

  useEffect(() => {
    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    const createScene = () => {
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent background
      sceneRef.current = scene;

      // Camera setup
      const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI / 2,
        Math.PI / 3.5,
        120, // Increased zoom for closer view
        new BABYLON.Vector3(0, 0, 0),
        scene
      );
      camera.attachControl(canvasRef.current, true);

      // Lighting setup
      const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
      light.intensity = 0.7;

      // Create fractal patterns using torus knots and rotating planes
      for (let i = 0; i < 10; i++) {
        const torus = BABYLON.MeshBuilder.CreateTorusKnot(
          `torus${i}`,
          {
            radius: 10 + i * 2,
            tube: 2,
            radialSegments: 64,
            tubularSegments: 32,
            p: 3 + i,
            q: 5 + i,
          },
          scene
        );

        const material = new BABYLON.StandardMaterial(`material${i}`, scene);
        const gradientFactor = i / 10;
        material.diffuseColor = new BABYLON.Color3(1.0 - gradientFactor, 0.5 + gradientFactor * 0.5, 0.5);
        material.bumpTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/waterbump.png", scene);
        material.reflectionTexture = new BABYLON.CubeTexture("https://www.babylonjs-playground.com/textures/skybox", scene);
        material.reflectionTexture.coordinatesMode = BABYLON.Texture.SPHERICAL_MODE;
        material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        torus.material = material;

        // Add rotation animation for fractal objects
        scene.onBeforeRenderObservable.add(() => {
          torus.rotation.y += 0.005 * (i + 1) * 0.03;
          torus.rotation.x += 0.0025 * (i + 1) * 0.03;
        });

        fractalRefs.current.push(torus);
      }

      // Permanently spawned pixels
      for (let i = 0; i < spawnedPixels; i++) {
        const pixel = BABYLON.MeshBuilder.CreateBox(`pixel${i}`, { size: 0.5 }, scene);
        pixel.position = new BABYLON.Vector3(
          Math.random() * 200 - 100,
          Math.random() * 200 - 100,
          Math.random() * 200 - 100
        );
        fractalRefs.current.push(pixel);
      }

      // Fractal particle system
      const fractalParticleSystem = new BABYLON.ParticleSystem("fractalParticles", 2000, scene);
      fractalParticleSystem.particleTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png", scene);
      fractalParticleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
      fractalParticleSystem.minEmitBox = new BABYLON.Vector3(-50, -50, -50);
      fractalParticleSystem.maxEmitBox = new BABYLON.Vector3(50, 50, 50);
      fractalParticleSystem.color1 = new BABYLON.Color4(0.7, 0.2, 1.0, 1.0);
      fractalParticleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
      fractalParticleSystem.minSize = 0.1;
      fractalParticleSystem.maxSize = 0.7;
      fractalParticleSystem.emitRate = 500;
      fractalParticleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0);
      fractalParticleSystem.minLifeTime = 2;
      fractalParticleSystem.maxLifeTime = 4;
      fractalParticleSystem.updateSpeed = 0.01;

      fractalParticleSystem.start();

      return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    return () => {
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, [spawnedPixels]);

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", color: "white", fontSize: "20px", fontFamily: "Courier New, Courier, monospace" }}>
         
      </div>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", backgroundColor: "black" }} />
    </div>
  );
};

export default FractalUniverse;
