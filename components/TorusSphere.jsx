import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import Pusher from "pusher-js";

const TorusSphere = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const sphereRef = useRef(null);
  const [evolutionState, setEvolutionState] = useState({
    complexity: 1,
    energy: 0.5,
    harmony: 0.5,
    mutations: [],
  });
  const pixelsRef = useRef([]);
  const materialsRef = useRef({});

  useEffect(() => {
    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });

    const createScene = () => {
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
      sceneRef.current = scene;

      // Enhanced camera setup
      const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI / 2,
        Math.PI / 3.5,
        160,
        new BABYLON.Vector3(0, 10, 0),
        scene
      );
      camera.attachControl(canvasRef.current, true);
      camera.lowerRadiusLimit = 100;
      camera.upperRadiusLimit = 300;

      // Dynamic lighting system
      const mainLight = new BABYLON.HemisphericLight("mainLight", new BABYLON.Vector3(0, 1, 0), scene);
      mainLight.intensity = 0.5;

      const spotLights = [];
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const spotLight = new BABYLON.PointLight(
          `spotLight${i}`,
          new BABYLON.Vector3(
            Math.cos(angle) * 50,
            20,
            Math.sin(angle) * 50
          ),
          scene
        );
        spotLight.intensity = 0.3;
        spotLights.push(spotLight);
      }

      // Create base torus with fractal potential
      const torusSphere = BABYLON.MeshBuilder.CreateTorusKnot(
        "torusSphere",
        {
          radius: 30,
          tube: 8,
          radialSegments: 128,
          tubularSegments: 64,
          p: 2,
          q: 3,
        },
        scene
      );
      sphereRef.current = torusSphere;

      // Advanced material system
      const material = new BABYLON.StandardMaterial("material", scene);
      const swirlTexture = new BABYLON.NoiseProceduralTexture("swirlTexture", 512, scene);
      swirlTexture.animationSpeedFactor = 2.0;
      swirlTexture.persistence = evolutionState.harmony;
      swirlTexture.brightness = 0.7;
      
      material.diffuseTexture = swirlTexture;
      material.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/waterbump.png", scene);
      material.specularColor = new BABYLON.Color3(1, 1, 1);
      material.specularPower = 256;
      material.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
      material.reflectionTexture.level = 0.8;
      
      materialsRef.current = {
        main: material,
        swirl: swirlTexture,
      };
      
      torusSphere.material = material;

      // Fractal evolution system
      const applyFractalEvolution = () => {
        const vertexData = torusSphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        const originalPositions = vertexData.slice();
        
        scene.onBeforeRenderObservable.add(() => {
          const time = performance.now() * 0.001;
          const updatedPositions = originalPositions.map((value, index) => {
            const evolutionFactor = evolutionState.complexity;
            const energyFactor = evolutionState.energy;
            
            if (index % 3 === 1) {
              const noise = Math.sin(value * 0.3 * evolutionFactor + time) * 1.8 * energyFactor +
                          Math.sin(value * 0.2 * evolutionFactor - time) * 1.4 * energyFactor;
              return value + noise;
            } else if (index % 3 === 0) {
              const noise = Math.sin(value * 0.15 * evolutionFactor + time) * energyFactor;
              return value + noise;
            } else if (index % 3 === 2) {
              const noise = Math.cos(value * 0.25 * evolutionFactor - time) * 0.9 * energyFactor;
              return value + noise;
            }
            return value;
          });

          torusSphere.updateVerticesData(BABYLON.VertexBuffer.PositionKind, updatedPositions);
        });
      };

      applyFractalEvolution();

      return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    const pusher = new Pusher("facc28e7df1eec1d7667", {
      cluster: "eu",
    });

    const channel = pusher.subscribe("my-channel");
    channel.bind("my-event", (data) => {
      const { analysis, actionName } = data;
      if (!sphereRef.current || !sceneRef.current || !materialsRef.current) return;

      // Process chat analysis
      const mood = analysis.mood || "neutral";
      const keywords = analysis.keywords || [];
      const drink = analysis.drink;
      
      // Update evolution state based on analysis
      setEvolutionState(prev => {
        const newState = { ...prev };
        
        // Adjust complexity based on keyword length and variety
        newState.complexity = Math.min(3, prev.complexity + keywords.length * 0.1);
        
        // Adjust energy based on mood
        if (mood === "positive") {
          newState.energy = Math.min(1, prev.energy + 0.1);
        } else if (mood === "negative") {
          newState.energy = Math.max(0.2, prev.energy - 0.1);
        }
        
        // Adjust harmony based on conversation flow
        newState.harmony = Math.min(1, prev.harmony + (analysis.joinCyberdelicSociety === "yes" ? 0.15 : 0.05));
        
        // Add mutation if significant event
        if (drink || analysis.joinCyberdelicSociety === "yes") {
          newState.mutations.push({
            type: drink ? "drink" : "join",
            timestamp: Date.now(),
          });
        }
        
        return newState;
      });

      // Apply visual effects based on action
      switch (actionName) {
        case "scaleTorus":
          sphereRef.current.scaling.scaleInPlace(1.1);
          setTimeout(() => sphereRef.current.scaling.scaleInPlace(1/1.1), 1000);
          break;
        case "rotateFaster":
          materialsRef.current.swirl.animationSpeedFactor += 0.5;
          break;
        case "changeColor":
          const spotLight = sceneRef.current.getLightByName("spotLight0");
          if (spotLight) {
            spotLight.diffuse = new BABYLON.Color3(
              Math.random(),
              Math.random(),
              Math.random()
            );
          }
          break;
        case "increaseGloss":
          materialsRef.current.main.specularPower = Math.min(512, materialsRef.current.main.specularPower * 1.2);
          break;
        case "addGrowth":
          addPixel(sceneRef.current, mood);
          break;
      }
    });

    const addPixel = (scene, mood) => {
      const pixel = BABYLON.MeshBuilder.CreateBox("pixel", { size: 1 }, scene);
      const material = new BABYLON.StandardMaterial("pixelMat", scene);
      
      // Color based on mood
      switch(mood) {
        case "positive":
          material.emissiveColor = new BABYLON.Color3(0, 1, 0.5);
          break;
        case "negative":
          material.emissiveColor = new BABYLON.Color3(1, 0, 0.3);
          break;
        default:
          material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 1);
      }
      
      pixel.material = material;
      pixel.position = new BABYLON.Vector3(
        Math.random() * 300 - 150,
        Math.random() * 150 - 75,
        Math.random() * 300 - 150
      );
      
      const velocity = mood === "positive" ? 0.05 : 0.01;
      pixelsRef.current.push({ pixel, velocity });

      // Particle trail effect
      const particleSystem = new BABYLON.ParticleSystem("particles", 100, scene);
      particleSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png");
      particleSystem.emitter = pixel;
      particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
      particleSystem.maxEmitBox = new BABYLON.Vector3(1, 0, 1);
      particleSystem.color1 = material.emissiveColor;
      particleSystem.color2 = material.emissiveColor.scale(0.5);
      particleSystem.minSize = 0.1;
      particleSystem.maxSize = 0.5;
      particleSystem.minLifeTime = 0.3;
      particleSystem.maxLifeTime = 1.5;
      particleSystem.emitRate = 50;
      particleSystem.start();

      scene.onBeforeRenderObservable.add(() => {
        const time = performance.now() * 0.001;
        pixelsRef.current.forEach(({ pixel, velocity }) => {
          pixel.position.x += Math.sin(time + pixel.uniqueId * 0.1) * velocity;
          pixel.position.y += Math.cos(time * 0.5 + pixel.uniqueId * 0.15) * velocity;
          pixel.position.z += Math.sin(time + pixel.uniqueId * 0.2) * velocity;
        });

        // Create connections between nearby pixels
        for (let i = 0; i < pixelsRef.current.length; i++) {
          for (let j = i + 1; j < pixelsRef.current.length; j++) {
            const pixelA = pixelsRef.current[i].pixel;
            const pixelB = pixelsRef.current[j].pixel;
            const distance = BABYLON.Vector3.Distance(pixelA.position, pixelB.position);

            if (distance < 5) {
              const line = BABYLON.MeshBuilder.CreateLines(
                "line",
                {
                  points: [pixelA.position, pixelB.position],
                },
                scene
              );
              line.color = material.emissiveColor;
              setTimeout(() => {
                line.dispose();
              }, 500);
            }
          }
        }
      });
    };

    return () => {
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
      pusher.unsubscribe("my-channel");
    };
  }, []);

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", backgroundColor: "black" }} />
    </div>
  );
};

export default TorusSphere;