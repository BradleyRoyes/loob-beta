import * as tf from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mediapipe from '@mediapipe/tasks-vision';
import { Prediction } from '@/types/detection';
import { prepareData } from './prepareData';

// Custom error classes for better error handling
export class ModelError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ModelError';
  }
}

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

// Update model configuration
export const MODEL_CONFIG = {
  inputShape: [128, 128, 3] as [number, number, number],
  outputShape: 4,  // x, y, width, height
  batchSize: 32,
  epochs: 20,
  learningRate: 0.001,
  colorThreshold: 0.8
};

// Create a simple model architecture with error handling
async function createModel(): Promise<tf.LayersModel> {
  try {
    const model = tf.sequential();
    
    // Initial feature extraction - color and shape sensitive
    model.add(tf.layers.conv2d({
      inputShape: MODEL_CONFIG.inputShape,
      filters: 16,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    
    // Global features
    model.add(tf.layers.conv2d({
      filters: 32,
      kernelSize: 3,
      activation: 'relu',
      padding: 'same'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
    
    // Position-invariant features
    model.add(tf.layers.globalAveragePooling2d({}));
    
    // Dense layers for final prediction
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.2 }));
    model.add(tf.layers.dense({ units: MODEL_CONFIG.outputShape, activation: 'sigmoid' }));

    // Use Adam optimizer with custom learning rate
    const optimizer = tf.train.adam(MODEL_CONFIG.learningRate);
    
    model.compile({
      optimizer,
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });
    
    return model;
  } catch (error) {
    throw new ModelError(`Failed to create model: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
    // Initialize IndexedDB for model storage with error handling
    try {
      tf.setBackend('webgl').catch(err => {
        console.warn('WebGL backend not available, falling back to CPU:', err);
        return tf.setBackend('cpu');
      });
    } catch (error) {
      console.error('Failed to initialize TensorFlow backend:', error);
      throw new ModelError('Failed to initialize TensorFlow backend');
    }
  }

  // Improved error handling for model operations
  async setModel(model: tf.LayersModel) {
    try {
      if (this.model) {
        this.model.dispose();
      }
      this.model = model;
    } catch (error) {
      throw new ModelError(`Failed to set model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getModelList(): Promise<SavedModel[]> {
    try {
      const listJson = localStorage.getItem(this.modelListKey);
      return listJson ? JSON.parse(listJson) : [];
    } catch (err) {
      throw new StorageError(`Failed to get model list: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  private async saveModelList(models: SavedModel[]): Promise<void> {
    try {
      localStorage.setItem(this.modelListKey, JSON.stringify(models));
    } catch (err) {
      throw new StorageError(`Failed to save model list: ${err instanceof Error ? err.message : 'Unknown error'}`);
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

  // Add memory management
  private disposeAndCleanup() {
    try {
      if (this.model) {
        this.model.dispose();
        this.model = null;
      }
      // Clean up any dangling tensors
      tf.disposeVariables();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  // Add this to handle backend initialization
  private async ensureBackendInitialized() {
    if (!tf.getBackend()) {
      try {
        await tf.setBackend('webgl');
      } catch (err) {
        console.warn('WebGL backend failed, trying CPU:', err);
        await tf.setBackend('cpu');
      }
    }
  }

  // Improved model prediction with error handling
  async predictImage(
    image: HTMLImageElement | HTMLVideoElement
  ): Promise<{ x: number; y: number; width: number; height: number }> {
    try {
      await this.ensureBackendInitialized();
      
      if (!this.model) {
        throw new ModelError('No model loaded');
      }

      // Convert image to tensor
      const tensor = tf.tidy(() => {
        const img = tf.browser.fromPixels(image);
        const resized = tf.image.resizeBilinear(img, [MODEL_CONFIG.inputShape[0], MODEL_CONFIG.inputShape[1]]);
        return resized.expandDims(0).toFloat().div(255);
      });

      try {
        const prediction = await this.model.predict(tensor) as tf.Tensor;
        const [x, y, width, height] = Array.from(await prediction.data());
        
        // Cleanup
        tensor.dispose();
        prediction.dispose();

        return { x, y, width, height };
      } catch (error) {
        tensor.dispose();
        throw error;
      }
    } catch (error) {
      throw new ModelError(`Prediction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add destructor
  destroy() {
    this.disposeAndCleanup();
  }

  async clearCache(): Promise<void> {
    this.disposeAndCleanup();
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

// Export a singleton instance of ModelManager
export const modelManager = new ModelManager();

// Export the predictImage function
export const predictImage = async (image: HTMLImageElement | HTMLVideoElement) => {
  return modelManager.predictImage(image);
};

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
  if (!model) throw new Error('Model not initialized');
  
  let trainXs: tf.Tensor | null = null;
  let trainYs: tf.Tensor | null = null;
  let valXs: tf.Tensor | null = null;
  let valYs: tf.Tensor | null = null;
  
  try {
    console.log('🚀 Starting model training...');
    console.log('📊 Model configuration:', {
      inputShape: MODEL_CONFIG.inputShape,
      batchSize: MODEL_CONFIG.batchSize,
      epochs: MODEL_CONFIG.epochs,
      learningRate: MODEL_CONFIG.learningRate
    });

    const { xs, ys } = await prepareData();
    console.log('📈 Dataset loaded:', {
      totalSamples: xs.shape[0],
      inputShape: xs.shape,
      outputShape: ys.shape
    });
    
    // Update the data splitting to use integer counts
    const splitIdx = Math.floor(xs.shape[0] * 0.8);
    [trainXs, valXs] = tf.split(xs, [splitIdx, xs.shape[0] - splitIdx]);
    [trainYs, valYs] = tf.split(ys, [splitIdx, ys.shape[0] - splitIdx]);

    console.log('📊 Data split:', {
      trainingSamples: trainXs.shape[0],
      validationSamples: valXs.shape[0]
    });

    // Calculate total batches for progress tracking
    const totalBatches = Math.ceil(trainXs.shape[0] / MODEL_CONFIG.batchSize);
    let trainingStartTime = Date.now();
    let lastBatchTime = Date.now();
    let bestLoss = Infinity;

    await model.fit(trainXs as tf.Tensor, trainYs as tf.Tensor, {
      batchSize: MODEL_CONFIG.batchSize,
      epochs: MODEL_CONFIG.epochs,
      validationData: [valXs as tf.Tensor, valYs as tf.Tensor],
      shuffle: true,
      callbacks: {
        onBatchBegin: async (batch) => {
          const epoch = Math.floor(batch / totalBatches);
          const batchInEpoch = batch % totalBatches;
          const progress = (epoch * totalBatches + batchInEpoch) / (MODEL_CONFIG.epochs * totalBatches) * 100;
          onProgress?.(progress);
          await tf.nextFrame();
        },
        onBatchEnd: async (batch, logs) => {
          const now = Date.now();
          const batchTime = now - lastBatchTime;
          lastBatchTime = now;
          
          if (batch % 5 === 0) { // Log every 5 batches to avoid spam
            console.log(`🔄 Batch ${batch}:`, {
              loss: logs?.loss?.toFixed(5) ?? 'N/A',
              samplesPerSecond: (MODEL_CONFIG.batchSize / (batchTime / 1000)).toFixed(1),
              memoryUsage: `${(tf.memory().numBytes / 1024 / 1024).toFixed(1)} MB`
            });
          }
          
          callbacks?.onBatchEnd?.(batch, {
            ...logs,
            batchTime,
            memoryUsage: tf.memory().numBytes
          });
          await tf.nextFrame();
        },
        onEpochBegin: async (epoch, logs) => {
          console.log(`\n📈 Starting Epoch ${epoch + 1}/${MODEL_CONFIG.epochs}`);
          callbacks?.onEpochBegin?.(epoch, { ...logs, totalBatches });
          await tf.nextFrame();
        },
        onEpochEnd: async (epoch, logs) => {
          // Calculate validation metrics
          const valPreds = model.predict(valXs!) as tf.Tensor;
          const valLoss = tf.losses.meanSquaredError(valYs!, valPreds);
          const valLossValue = await valLoss.data();
          
          const epochTime = (Date.now() - trainingStartTime) / 1000;
          const currentLoss = valLossValue[0];
          
          if (currentLoss < bestLoss) {
            bestLoss = currentLoss;
            console.log('🌟 New best model!');
          }

          console.log(`\n✅ Epoch ${epoch + 1} completed:`, {
            trainingLoss: logs?.loss?.toFixed(5) ?? 'N/A',
            validationLoss: currentLoss.toFixed(5),
            bestLoss: bestLoss.toFixed(5),
            timeElapsed: `${epochTime.toFixed(1)}s`,
            timePerEpoch: `${(epochTime / (epoch + 1)).toFixed(1)}s`,
            memoryUsage: `${(tf.memory().numBytes / 1024 / 1024).toFixed(1)} MB`
          });
          
          callbacks?.onEpochEnd?.(epoch, {
            ...logs,
            val_loss: currentLoss,
            bestLoss,
            epochTime,
            totalBatches
          });
          
          tf.dispose([valPreds, valLoss]);
          await tf.nextFrame();
        }
      }
    });

    console.log('\n🎉 Training completed!', {
      finalLoss: bestLoss.toFixed(5),
      totalTime: `${((Date.now() - trainingStartTime) / 1000).toFixed(1)}s`,
      memoryUsage: `${(tf.memory().numBytes / 1024 / 1024).toFixed(1)} MB`
    });

    return model;
  } catch (error) {
    console.error('❌ Training error:', error);
    throw error;
  } finally {
    // Cleanup only initialized tensors
    const tensorsToDispose = [trainXs, trainYs, valXs, valYs].filter(t => t !== null) as tf.Tensor[];
    tf.dispose(tensorsToDispose);
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
        const result = await modelManager.predictImage(image);
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
