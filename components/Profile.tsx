'use client';

import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

const Profile = ({ onClose }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const createScene = () => {
      const scene = new BABYLON.Scene(engine);
      scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

      const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI / 2,
        Math.PI / 3.5,
        80,
        new BABYLON.Vector3(0, 0, 0),
        scene
      );
      camera.attachControl(canvasRef.current, true);

      const light = new BABYLON.HemisphericLight(
        "light",
        new BABYLON.Vector3(0, 1, 0),
        scene
      );
      light.intensity = 0.8;

      const sphere = BABYLON.MeshBuilder.CreateSphere(
        "sphere",
        { diameter: 50, segments: 32 },
        scene
      );
      const waterMaterial = new BABYLON.StandardMaterial("waterMaterial", scene);
      waterMaterial.diffuseTexture = new BABYLON.Texture(
        "https://www.babylonjs-playground.com/textures/waterbump.png",
        scene
      );
      waterMaterial.bumpTexture = new BABYLON.Texture(
        "https://www.babylonjs-playground.com/textures/waterbump.png",
        scene
      );
      waterMaterial.reflectionTexture = new BABYLON.CubeTexture(
        "https://www.babylonjs-playground.com/textures/skybox",
        scene
      );
      waterMaterial.reflectionTexture.coordinatesMode =
        BABYLON.Texture.SPHERICAL_MODE;
      waterMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      sphere.material = waterMaterial;

      scene.onBeforeRenderObservable.add(() => {
        sphere.rotation.y += 0.02;
        sphere.rotation.x += 0.01;
      });

      return scene;
    };

    const scene = createScene();
    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => engine.resize());

    return () => {
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
      <div className="p-6 rounded-md shadow-md bg-gray-900 w-full max-w-md relative">
        <h1 className="text-3xl font-bold mb-4 text-center">Your Profile</h1>
        <p className="text-lg mb-4">
          Anonymous Identifier: <span className="font-mono">0xA1B2C3D4</span>
        </p>
        <p className="text-lg mb-4">List of chosen integrations:</p>
        <ul className="list-disc list-inside mb-6">
          <li>Poi</li>
          <li>ISO stick</li>
          <li>Watch</li>
          <li>LoobLab</li>
        </ul>
        <div className="w-full flex items-center justify-center mb-6">
          <canvas ref={canvasRef} style={{ width: "200px", height: "200px" }} />
        </div>
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default Profile;
