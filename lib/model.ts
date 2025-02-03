import * as tf from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mediapipe from '@mediapipe/tasks-vision';
import { Prediction } from '@/types/detection';
import { prepareData } from './prepareData';

// Update model configuration
export const MODEL_CONFIG = {
  inputShape: [224, 224, 3] as [number, number, number],
  outputShape: 4,  // x, y, width, height
  batchSize: 16,
  epochs: 50,
  learningRate: 0.0001,
  colorThreshold: 0.8  // For color-based attention
};

// Create a simple model architecture
async function createModel(): Promise<tf.LayersModel> {
  const model = tf.sequential();
  
  // Color-sensitive convolutional layers
  model.add(tf.layers.conv2d({
    inputShape: MODEL_CONFIG.inputShape,
    filters: 32,
    kernelSize: 5,  // Larger kernel for better color blob detection
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.batchNormalization());  // Normalize color features
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Color blob detection layers
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Deep feature extraction
  model.add(tf.layers.conv2d({
    filters: 128,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));

  // Dense layers with dropout for robustness
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 256, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.4 }));  // Increased dropout for better generalization
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.3 }));
  model.add(tf.layers.dense({ units: MODEL_CONFIG.outputShape, activation: 'sigmoid' }));

  // Use Huber loss for better robustness to outliers
  model.compile({
    optimizer: tf.train.adam(MODEL_CONFIG.learningRate),
    loss: tf.losses.huberLoss,
    metrics: ['mse']
  });
  
  return model;
}

interface SavedModel {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  path: string;
  type: 'custom' | 'uploaded';
  metadata?: {
    trainedOn?: string;
    accuracy?: number;
    notes?: string;
  };
  version: string;       // Model architecture version
  frameworkVersion: string;  // TF.js version
}

interface BenchmarkResults {
  inferenceSpeed: number;
  accuracy: number;
  memoryUsage: number;
}

export class ModelManager {
  private model: tf.LayersModel | null = null;
  private readonly storagePrefix = 'loobricate-models';
  private readonly modelListKey = `${this.storagePrefix}-list`;

  constructor() {
    // Initialize IndexedDB for model storage
    tf.setBackend('webgl');
  }

  // Add setModel method
  async setModel(model: tf.LayersModel) {
    this.model = model;
  }

  private async getModelList(): Promise<SavedModel[]> {
    try {
      const listJson = localStorage.getItem(this.modelListKey);
      return listJson ? JSON.parse(listJson) : [];
    } catch (err) {
      console.error('Failed to get model list:', err);
      return [];
    }
  }

  private async saveModelList(models: SavedModel[]): Promise<void> {
    try {
      localStorage.setItem(this.modelListKey, JSON.stringify(models));
    } catch (err) {
      console.error('Failed to save model list:', err);
      throw new Error('Failed to save model list');
    }
  }

  async listModels(): Promise<SavedModel[]> {
    return this.getModelList();
  }

  async uploadModel(
    modelFile: File,
    weightsFile: File | null,
    name: string,
    description: string = ''
  ): Promise<SavedModel> {
    try {
      const modelId = uuidv4();
      const modelPath = `${this.storagePrefix}-${modelId}`;
      
      // Load the model from files
      let model: tf.LayersModel;
      if (weightsFile) {
        // Handle separate model and weights files
        model = await tf.loadLayersModel(
          tf.io.browserFiles([modelFile, weightsFile])
        );
      } else {
        // Handle combined model file
        const modelJson = await modelFile.text();
        model = await tf.loadLayersModel(tf.io.fromMemory(JSON.parse(modelJson)));
      }

      // Save the model to IndexedDB
      await model.save(`indexeddb://${modelPath}`);

      // Create model metadata
      const savedModel: SavedModel = {
        id: modelId,
        name,
        description,
        createdAt: Date.now(),
        path: modelPath,
        type: 'uploaded',
        version: '1.0',
        frameworkVersion: '2.0'
      };

      // Update model list
      const models = await this.getModelList();
      models.push(savedModel);
      await this.saveModelList(models);

      return savedModel;
    } catch (err) {
      console.error('Failed to upload model:', err);
      throw new Error('Failed to upload model: ' + err.message);
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    try {
      const models = await this.getModelList();
      const model = models.find(m => m.id === modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Remove from IndexedDB
      await tf.io.removeModel(`indexeddb://${model.path}`);

      // Update model list
      const updatedModels = models.filter(m => m.id !== modelId);
      await this.saveModelList(updatedModels);

      // If current model was deleted, clear it
      if (this.model && model.path === this.getCurrentModelPath()) {
        this.model = null;
      }
    } catch (err) {
      console.error('Failed to delete model:', err);
      throw new Error('Failed to delete model');
    }
  }

  async switchModel(modelId: string): Promise<void> {
    if (this.model) {
      this.model.dispose();
    }
    try {
      const models = await this.getModelList();
      const model = models.find(m => m.id === modelId);
      if (!model) {
        throw new Error('Model not found');
      }

      // Load the model from IndexedDB
      this.model = await tf.loadLayersModel(`indexeddb://${model.path}`);
    } catch (err) {
      console.error('Failed to switch model:', err);
      throw new Error('Failed to switch model');
    }
  }

  private getCurrentModelPath(): string | null {
    if (!this.model) return null;
    const modelArtifacts = (this.model as any).modelTopology;
    if (!modelArtifacts) return null;
    return modelArtifacts.modelPath;
  }

  async getModel(): Promise<tf.LayersModel> {
    if (!this.model) {
      this.model = await createModel();
    }
    return this.model;
  }

  async saveTrainedModel(name: string, description: string = ''): Promise<SavedModel> {
    if (!this.model) {
      throw new Error('No model to save');
    }

    try {
      const modelId = uuidv4();
      const modelPath = `${this.storagePrefix}-${modelId}`;

      // Save the model to IndexedDB
      await this.model.save(`indexeddb://${modelPath}`);

      // Create model metadata
      const savedModel: SavedModel = {
        id: modelId,
        name,
        description,
        createdAt: Date.now(),
        path: modelPath,
        type: 'custom',
        metadata: {
          trainedOn: new Date().toISOString(),
        },
        version: '1.0',
        frameworkVersion: '2.0'
      };

      // Update model list
      const models = await this.getModelList();
      models.push(savedModel);
      await this.saveModelList(models);

      return savedModel;
    } catch (err) {
      console.error('Failed to save trained model:', err);
      throw new Error('Failed to save trained model');
    }
  }

  disposeModel() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }

  async clearCache(): Promise<void> {
    this.disposeModel();
    await tf.ready();
    // Clear the backend
    tf.engine().reset();
  }

  async benchmarkModel(modelId: string): Promise<BenchmarkResults> {
    const testData = await prepareTestData();
    const model = await this.getModel();
    
    // Measure inference speed
    const startTime = performance.now();
    const predictions = model.predict(testData as tf.Tensor4D) as tf.Tensor;
    await predictions.data(); // Wait for async operations
    const inferenceSpeed = performance.now() - startTime;

    // Measure memory usage
    const memoryUsage = tf.memory().numBytes;
    
    // Cleanup
    predictions.dispose();
    testData.dispose();

    return {
      inferenceSpeed,
      accuracy: 0.95, // Replace with actual accuracy calculation
      memoryUsage
    };
  }
}

export const modelManager = new ModelManager();

// Training function
export async function trainModel(
  onProgress?: (progress: number) => void,
  callbacks?: {
    onBatchEnd?: (batch: number, logs: any) => void;
    onEpochEnd?: (epoch: number, logs: any) => void;
    onEpochBegin?: (epoch: number, logs: any) => void;
  }
): Promise<tf.LayersModel> {
  const model = await modelManager.getModel();
  
  try {
    // Load and prepare data
    const { xs, ys } = await prepareData();
    
    // Split into train/validation
    const splitIdx = Math.floor(xs.shape[0] * 0.8);
    const [trainXs, valXs] = tf.split(xs, [splitIdx, xs.shape[0] - splitIdx]);
    const [trainYs, valYs] = tf.split(ys, [splitIdx, ys.shape[0] - splitIdx]);

    // Train the model
    await model.fit(trainXs, trainYs, {
      batchSize: MODEL_CONFIG.batchSize,
      epochs: MODEL_CONFIG.epochs,
      validationData: [valXs, valYs],
      shuffle: true,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          const progress = Math.round((epoch + 1) / MODEL_CONFIG.epochs * 100);
          onProgress?.(progress);
          callbacks?.onEpochEnd?.(epoch, logs);
          await tf.nextFrame();
        }
      }
    });

    return model;
  } catch (error) {
    console.error('Training error:', error);
    throw error;
  } finally {
    tf.engine().startScope(); // Clean up tensors
  }
}

// Update prediction function to handle color information
export async function predictImage(
  image: HTMLImageElement | HTMLVideoElement
): Promise<{ x: number; y: number; width: number; height: number }> {
  const model = await modelManager.getModel();
  
  const tensor = tf.tidy(() => {
    // Enhanced preprocessing for color detection
    const imageTensor = tf.browser.fromPixels(image);
    
    // Color normalization to make detection more robust
    const normalized = imageTensor
      .resizeBilinear([MODEL_CONFIG.inputShape[0], MODEL_CONFIG.inputShape[1]])
      .toFloat()
      .div(255.0);

    // Add batch dimension
    return normalized.expandDims(0) as tf.Tensor4D;
  });
  
  try {
    const prediction = model.predict(tensor) as tf.Tensor2D;
    const [x, y, width, height] = await prediction.data();
    
    return { x, y, width, height };
  } finally {
    tf.dispose([tensor]);
  }
}

// First, ensure you have this type definition in your types
type ModelHandler = {
  init: () => Promise<any>;
  detect: (input: HTMLImageElement | HTMLVideoElement, context?: any) => Promise<Prediction[]>;
};

export function createModelHandlers(): Record<string, ModelHandler> {
  return {
    'custom': {
      init: async () => modelManager.getModel(),
      detect: async (image) => {
        const result = await predictImage(image);
        return [{
          x: result.x,
          y: result.y,
          confidence: 1,
          type: 'custom-target',
          class: 'custom-target',
          bbox: [result.x, result.y, 0, 0],
          coordinates: [result.x, result.y],
          timestamp: Date.now()
        }];
      }
    },
    'coco-ssd': {
      init: async () => cocoSsd.load(),
      detect: async (image) => {
        const model = await cocoSsd.load();
        const detections = await model.detect(image);
        return detections.map(d => ({
          x: d.bbox[0] + d.bbox[2]/2,
          y: d.bbox[1] + d.bbox[3]/2,
          confidence: d.score,
          type: d.class,
          class: d.class,
          bbox: d.bbox,
          coordinates: [d.bbox[0] + d.bbox[2]/2, d.bbox[1] + d.bbox[3]/2],
          timestamp: Date.now()
        }));
      }
    },
    'mediapipe': {
      init: async () => {
        const vision = await mediapipe.FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        return mediapipe.ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
            delegate: "GPU"
          },
          scoreThreshold: 0.5,
          runningMode: "VIDEO"
        });
      },
      detect: async (image, detector) => {
        if (!detector) throw new Error('Mediapipe detector not initialized');
        const result = await detector.detectForVideo(image, Date.now());
        return result.detections.map(d => ({
          x: d.boundingBox!.originX + d.boundingBox!.width/2,
          y: d.boundingBox!.originY + d.boundingBox!.height/2,
          confidence: d.categories[0].score,
          type: d.categories[0].categoryName,
          class: d.categories[0].categoryName,
          coordinates: [d.boundingBox!.originX + d.boundingBox!.width/2, d.boundingBox!.originY + d.boundingBox!.height/2],
          timestamp: Date.now()
        }));
      }
    }
  };
}

async function prepareTestData(): Promise<tf.Tensor4D> {
  const { xs } = await prepareData();
  return xs;
} 
