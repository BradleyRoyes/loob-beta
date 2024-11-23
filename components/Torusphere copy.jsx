import React, { useEffect, useRef } from 'react';
import * as BABYLON from '@babylonjs/core';

const TorusSphere = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const engine = new BABYLON.Engine(canvasRef.current, true);

    const createScene = () => {
      const {
        Scene,
        ArcRotateCamera,
        HemisphericLight,
        MeshBuilder,
        Color4,
        Vector3,
      } = BABYLON;

      const scene = new Scene(engine);

      // Background color: black or transparent
      scene.clearColor = new Color4(0, 0, 0, 1); // Black. Change alpha to 0 for transparency.

      // Camera setup: positioned further back for smaller sphere
      const camera = new ArcRotateCamera(
        'camera',
        Math.PI / 2,
        Math.PI / 3.5,
        120, // Adjust distance for a smaller appearance
        new Vector3(0, 0, 0),
        scene
      );
      camera.attachControl(canvasRef.current, true);

      // Lighting
      const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
      light.intensity = 0.8;

      // Create a sphere
      const baseSphere = MeshBuilder.CreateIcoSphere('baseSphere', {
        radius: 15, // Reduced size for a smaller sphere
        subdivisions: 64,
      });

      // ShaderMaterial for the hair-like spikes
      const shaderMaterial = new BABYLON.ShaderMaterial(
        'shader',
        scene,
        {
          vertexSource: `
            precision highp float;

            // Uniforms
            uniform mat4 worldViewProjection;
            uniform float iTime;

            // Attributes
            attribute vec3 position;
            attribute vec3 normal;

            // Varyings
            varying vec3 vNormal;
            varying float vDepth; // Depth for shading

            float hash(float p) {
              p = fract(p * 0.1031);
              p *= p + 33.33;
              p *= p + p;
              return fract(p);
            }

            float noise(vec3 p) {
              vec3 i = floor(p);
              vec3 f = fract(p);

              f = f * f * (3.0 - 2.0 * f);

              return mix(
                mix(mix(hash(i.x + i.y * 57.0 + i.z * 113.0),
                        hash(i.x + 1.0 + i.y * 57.0 + i.z * 113.0), f.x),
                    mix(hash(i.x + (i.y + 1.0) * 57.0 + i.z * 113.0),
                        hash(i.x + 1.0 + (i.y + 1.0) * 57.0 + i.z * 113.0), f.x),
                    f.y),
                mix(mix(hash(i.x + i.y * 57.0 + (i.z + 1.0) * 113.0),
                        hash(i.x + 1.0 + i.y * 57.0 + (i.z + 1.0) * 113.0), f.x),
                    mix(hash(i.x + (i.y + 1.0) * 57.0 + (i.z + 1.0) * 113.0),
                        hash(i.x + 1.0 + (i.y + 1.0) * 57.0 + (i.z + 1.0) * 113.0), f.x),
                    f.y),
                f.z);
            }

            void main() {
              vNormal = normal;

              // Dynamic spike animation
              vec3 pos = position + normal * (noise(position * 3.0 + iTime * 1.0) * 8.0 + 3.0);

              // Calculate depth for fragment shader
              vDepth = length(normal * 0.5 + 0.5);

              gl_Position = worldViewProjection * vec4(pos, 1.0);
            }
          `,
          fragmentSource: `
            precision highp float;

            // Varyings
            varying vec3 vNormal;
            varying float vDepth; // Depth-based shading

            void main() {
              // Base color
              vec3 baseColor = vec3(1.0, 0.7, 0.6); // Pastel pink-orange

              // Adjust brightness based on depth
              vec3 color = baseColor * mix(0.8, 1.2, vDepth);

              // Add subtle shading based on normals
              color *= dot(normalize(vNormal), vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;

              gl_FragColor = vec4(color, 1.0);
            }
          `,
        },
        {
          attributes: ['position', 'normal'],
          uniforms: ['worldViewProjection', 'iTime'],
        }
      );

      // Animate the shader
      const startTime = Date.now();
      shaderMaterial.onBind = () => {
        const currentTime = (Date.now() - startTime) / 1000; // Time in seconds
        shaderMaterial.setFloat('iTime', currentTime);
      };

      // Assign ShaderMaterial to the sphere
      baseSphere.material = shaderMaterial;

      // Add slow rotation to the sphere
      baseSphere.rotation = new Vector3(0, 0, 0);
      scene.onBeforeRenderObservable.add(() => {
        baseSphere.rotation.y += 0.002; // Slow rotation
      });

      return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener('resize', () => {
      engine.resize();
    });

    return () => {
      engine.stopRenderLoop();
      scene.dispose();
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default TorusSphere;