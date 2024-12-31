import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import Pusher from "pusher-js";

const TorusSphere = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const sphereRef = useRef(null);
  const [joinCounter, setJoinCounter] = useState(0);
  const pixelsRef = useRef([]);

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
        160, // Increased zoom to show more area
        new BABYLON.Vector3(0, 10, 0), // Centered vertically in frame
        scene
      );
      camera.attachControl(canvasRef.current, true);

      // Lighting
      const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
      light.intensity = 0.5; // Reduced intensity for a softer look

      // Spot light for warmth/cold effect
      const spotLight = new BABYLON.PointLight("spotLight", new BABYLON.Vector3(50, 50, -50), scene);
      spotLight.intensity = 1.0;
      spotLight.diffuse = new BABYLON.Color3(1.0, 0.6, 0.6); // More pinkish color

      // Create a torus sphere
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

      // Material for the sphere with realistic swirling texture
      const material = new BABYLON.StandardMaterial("material", scene);
      const swirlTexture = new BABYLON.NoiseProceduralTexture("swirlTexture", 512, scene);
      swirlTexture.animationSpeedFactor = 2.0;
      swirlTexture.persistence = 1.0;
      swirlTexture.brightness = 0.7;
      material.diffuseTexture = swirlTexture;
      material.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/waterbump.png", scene);
      material.specularColor = new BABYLON.Color3(1, 1, 1); // Add gloss effect
      material.specularPower = 256; // Increase glossiness
      material.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
      material.reflectionTexture.level = 0.8;
      torusSphere.material = material;

      // Add rotation animation
      scene.registerBeforeRender(() => {
        torusSphere.rotation.y += 0.007;
        torusSphere.rotation.x += 0.004;
      });

      // Add noise for pulsing/breathing effect
      const vertexData = torusSphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      const originalPositions = vertexData.slice();

      scene.onBeforeRenderObservable.add(() => {
        const time = performance.now() * 0.001;
        const updatedPositions = originalPositions.map((value, index) => {
          if (index % 3 === 1) { // Displace y-coordinate for more noticeable undulation
            const noise = Math.sin(value * 0.3 + time) * 1.8 + Math.sin(value * 0.2 - time) * 1.4;
            return value + noise;
          } else if (index % 3 === 0) { // Add slight x-coordinate displacement for organic look
            const noise = Math.sin(value * 0.15 + time) * 1.0;
            return value + noise;
          } else if (index % 3 === 2) { // Add slight z-coordinate displacement for organic look
            const noise = Math.cos(value * 0.25 - time) * 0.9;
            return value + noise;
          }
          return value;
        });

        torusSphere.updateVerticesData(BABYLON.VertexBuffer.PositionKind, updatedPositions);
      });

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
      const sphere = sphereRef.current;
      if (!sphere || !sceneRef.current) return;

      const scene = sceneRef.current;
      const spotLight = scene.getLightByName("spotLight");

      // Update join counter if user wants to join the Cyberdelic Society
      if (data.analysis.joinCyberdelicSociety === "yes") {
        setJoinCounter((prevCount) => prevCount + 1);
        addPixel(scene, data.analysis.mood);
      }

      // Adjust swirl speed based on mood
      if (data.analysis.mood === "positive") {
        swirlTexture.animationSpeedFactor += 0.2;
      } else if (data.analysis.mood === "neutral" || data.analysis.mood === "negative") {
        swirlTexture.animationSpeedFactor = Math.max(0.5, swirlTexture.animationSpeedFactor - 0.1);
      }
    });

    const addPixel = (scene, mood) => {
      const pixel = BABYLON.MeshBuilder.CreateBox("pixel", { size: 1 }, scene);
      pixel.position = new BABYLON.Vector3(
        Math.random() * 300 - 150, // Increased range for x
        Math.random() * 150 - 75, // Increased range for y
        Math.random() * 300 - 150 // Increased range for z
      );
      const velocity = mood === "low" ? 0.01 : 0.05;

      pixelsRef.current.push({ pixel, velocity });

      scene.onBeforeRenderObservable.add(() => {
        const time = performance.now() * 0.001;
        pixelsRef.current.forEach(({ pixel, velocity }) => {
          pixel.position.x += Math.sin(time + pixel.uniqueId * 0.1) * velocity;
          pixel.position.y += Math.cos(time * 0.5 + pixel.uniqueId * 0.15) * velocity;
          pixel.position.z += Math.sin(time + pixel.uniqueId * 0.2) * velocity;
        });

        // Check for proximity and create temporary connections
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
              line.color = new BABYLON.Color3(1, 1, 1);
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
