import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import Pusher from "pusher-js";

export interface TorusSphereProps {
  loobricate_id: string;
}

interface EvolutionState {
  complexity: number;
  energy: number;
  harmony: number;
  mutations: Array<{
    type: string;
    timestamp: number;
  }>;
  quaternion: {
    x: number;
    y: number;
    z: number;
    w: number;
  };
  material_state: {
    specularPower: number;
    swirlSpeed: number;
    persistence: number;
  };
}

interface PixelData {
  pixel: BABYLON.Mesh;
  velocity: number;
}

interface MaterialRefs {
  main?: BABYLON.StandardMaterial;
  swirl?: BABYLON.NoiseProceduralTexture;
}

// Default states for fallback and initialization
const DEFAULT_EVOLUTION_STATE: EvolutionState = {
  complexity: 1,
  energy: 0.5,
  harmony: 0.5,
  mutations: [],
  quaternion: { x: 0, y: 0, z: 0, w: 1 },
  material_state: {
    specularPower: 256,
    swirlSpeed: 2.0,
    persistence: 0.7,
  }
};

const TorusSphere: React.FC<TorusSphereProps> = ({ loobricate_id }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const sphereRef = useRef<BABYLON.Mesh | null>(null);
  const [evolutionState, setEvolutionState] = useState<EvolutionState>(DEFAULT_EVOLUTION_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pixelsRef = useRef<PixelData[]>([]);
  const materialsRef = useRef<MaterialRefs>({});
  const initializationAttempts = useRef(0);

  // Load persisted state
  useEffect(() => {
    const loadVibeEntity = async () => {
      if (!loobricate_id) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/vibe_entities?loobricate_id=${loobricate_id}`);
        
        if (response.status === 404) {
          // Not found is okay - we'll use default state
          setEvolutionState(DEFAULT_EVOLUTION_STATE);
          setIsLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to load vibe entity: ${response.statusText}`);
        }
        
        const data = await response.json();
        if (data.visual_state) {
          setEvolutionState(prevState => ({
            ...DEFAULT_EVOLUTION_STATE,  // Always include defaults
            ...prevState,
            ...data.visual_state
          }));
        }
      } catch (error) {
        console.error('Error loading vibe entity:', error);
        setError('Failed to load visualization state. Using defaults.');
        setEvolutionState(DEFAULT_EVOLUTION_STATE);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadVibeEntity();
  }, [loobricate_id]);

  const updateQuaternionState = () => {
    if (sphereRef.current?.rotationQuaternion) {
      setEvolutionState(prev => ({
        ...prev,
        quaternion: {
          x: sphereRef.current!.rotationQuaternion!.x,
          y: sphereRef.current!.rotationQuaternion!.y,
          z: sphereRef.current!.rotationQuaternion!.z,
          w: sphereRef.current!.rotationQuaternion!.w,
        }
      }));
    }
  };

  const createScene = (engine: BABYLON.Engine) => {
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
    sceneRef.current = scene;

    // Enhanced camera setup with automatic rotation
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
    camera.useAutoRotationBehavior = true;
    camera.autoRotationBehavior!.idleRotationSpeed = 0.1;

    // Dynamic lighting system
    const mainLight = new BABYLON.HemisphericLight("mainLight", new BABYLON.Vector3(0, 1, 0), scene);
    mainLight.intensity = 0.5;

    const spotLights: BABYLON.PointLight[] = [];
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

    // Apply persisted rotation
    if (evolutionState.quaternion) {
      torusSphere.rotationQuaternion = new BABYLON.Quaternion(
        evolutionState.quaternion.x,
        evolutionState.quaternion.y,
        evolutionState.quaternion.z,
        evolutionState.quaternion.w
      );
    }

    // Advanced material system with persisted state
    const material = new BABYLON.StandardMaterial("material", scene);
    const swirlTexture = new BABYLON.NoiseProceduralTexture("swirlTexture", 512, scene);
    swirlTexture.animationSpeedFactor = evolutionState.material_state.swirlSpeed;
    swirlTexture.persistence = evolutionState.material_state.persistence;
    swirlTexture.brightness = 0.7;
    
    material.diffuseTexture = swirlTexture;
    material.bumpTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/waterbump.png", scene);
    material.specularColor = new BABYLON.Color3(1, 1, 1);
    material.specularPower = evolutionState.material_state.specularPower;
    material.reflectionTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene);
    material.reflectionTexture.level = 0.8;
    
    materialsRef.current = {
      main: material,
      swirl: swirlTexture,
    };
    
    torusSphere.material = material;

    // Recreate persisted pixels
    if (evolutionState.mutations) {
      evolutionState.mutations.forEach(mutation => {
        addPixel(scene, mutation.type === 'drink' ? 'positive' : 'neutral');
      });
    }

    // Fractal evolution system
    const applyFractalEvolution = () => {
      const vertexData = torusSphere.getVerticesData(BABYLON.VertexBuffer.PositionKind);
      if (!vertexData) return;
      
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

  useEffect(() => {
    if (!canvasRef.current) return;

    const initializeScene = () => {
      try {
        const engine = new BABYLON.Engine(canvasRef.current, true, {
          preserveDrawingBuffer: true,
          stencil: true,
        });

        const scene = createScene(engine);
        
        if (!scene || !sphereRef.current) {
          throw new Error('Failed to initialize 3D scene');
        }

        engine.runRenderLoop(() => {
          try {
            scene.render();
            updateQuaternionState();
          } catch (error) {
            console.error('Render error:', error);
            engine.stopRenderLoop();
          }
        });

        const handleResize = () => {
          try {
            engine.resize();
          } catch (error) {
            console.error('Resize error:', error);
          }
        };

        window.addEventListener("resize", handleResize);

        const pusher = new Pusher("facc28e7df1eec1d7667", {
          cluster: "eu",
        });

        const channel = pusher.subscribe("my-channel");
        channel.bind("my-event", (data: { analysis: any; actionName: string }) => {
          if (!loobricate_id) return;
          const { analysis, actionName } = data;
          if (!sphereRef.current || !sceneRef.current || !materialsRef.current.main || !materialsRef.current.swirl) return;

          // Process chat analysis and update state
          handleChatAnalysis(analysis, actionName);
        });

        // Add automatic evolution for testing
        let testEvolutionInterval: NodeJS.Timeout | null = null;
        if (!loobricate_id) {
          testEvolutionInterval = setInterval(() => {
            setEvolutionState(prev => ({
              ...prev,
              complexity: Math.min(3, prev.complexity + 0.05),
              energy: 0.3 + Math.abs(Math.sin(Date.now() * 0.001) * 0.5),
              harmony: 0.3 + Math.abs(Math.cos(Date.now() * 0.0005) * 0.5),
              material_state: {
                ...prev.material_state,
                swirlSpeed: 1.5 + Math.sin(Date.now() * 0.001),
                persistence: 0.5 + Math.abs(Math.sin(Date.now() * 0.0008) * 0.3)
              }
            }));
          }, 1000);
        }

        return () => {
          if (testEvolutionInterval) {
            clearInterval(testEvolutionInterval);
          }
          window.removeEventListener("resize", handleResize);
          engine.stopRenderLoop();
          scene.dispose();
          engine.dispose();
          pusher.unsubscribe("my-channel");
        };
      } catch (error) {
        console.error('Scene initialization error:', error);
        setError('Failed to initialize visualization. Retrying...');
        
        if (initializationAttempts.current < 3) {
          initializationAttempts.current++;
          setTimeout(initializeScene, 1000);
        } else {
          setError('Failed to initialize visualization after multiple attempts.');
        }
        return () => {};
      }
    };

    return initializeScene();
  }, [
    evolutionState.complexity,
    evolutionState.energy,
    evolutionState.harmony,
    evolutionState.material_state.persistence,
    evolutionState.material_state.specularPower,
    evolutionState.material_state.swirlSpeed,
    evolutionState.mutations,
    evolutionState.quaternion,
    loobricate_id
  ]);

  // Render loading state
  if (isLoading) {
    return (
      <div style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "black",
        color: "white"
      }}>
        <div className="loading-spinner">
          <div>Initializing visualization...</div>
          <div style={{ fontSize: "0.8em", marginTop: "10px" }}>
            Loading vibe state for {loobricate_id}
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        backgroundColor: "black",
        color: "white",
        flexDirection: "column",
        padding: "20px",
        textAlign: "center"
      }}>
        <div style={{ marginBottom: "20px" }}>⚠️ {error}</div>
        <div style={{ fontSize: "0.8em", opacity: 0.7 }}>
          The visualization will continue with default settings
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", backgroundColor: "black" }} />
      {/* Optional debug overlay */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          fontSize: '12px',
          borderRadius: '4px',
        }}>
          <div>Complexity: {evolutionState.complexity.toFixed(2)}</div>
          <div>Energy: {evolutionState.energy.toFixed(2)}</div>
          <div>Harmony: {evolutionState.harmony.toFixed(2)}</div>
          <div>Mutations: {evolutionState.mutations.length}</div>
        </div>
      )}
    </div>
  );
};

export default TorusSphere; 