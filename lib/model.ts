import * as tf from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mediapipe from '@mediapipe/tasks-vision';
import { Prediction } from '@/types/detection';

// Simple model configuration
export const MODEL_CONFIG = {
  inputShape: [224, 224, 3] as [number, number, number],
  outputShape: 2,
  batchSize: 16,
  epochs: 100,
  patience: 10,
  learningRate: 0.00005,
  validationSplit: 0.2,
  metrics: ['mse', 'mae']
};

// Create a simple model architecture
async function createModel(): Promise<tf.LayersModel> {
  const model = tf.sequential();
  
  // Deeper feature extraction
  model.add(tf.layers.conv2d({
    inputShape: MODEL_CONFIG.inputShape,
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'  // Add padding
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({poolSize: 2}));
  
  // Add more conv layers
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({poolSize: 2}));
  
  model.add(tf.layers.conv2d({
    filters: 128,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.maxPooling2d({poolSize: 2}));
  
  // Dense layers
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({units: 256, activation: 'relu'}));
  model.add(tf.layers.dropout({rate: 0.5}));
  model.add(tf.layers.dense({units: 128, activation: 'relu'}));
  model.add(tf.layers.dropout({rate: 0.3}));
  model.add(tf.layers.dense({units: MODEL_CONFIG.outputShape, activation: 'sigmoid'}));
  
  // Use a lower learning rate
  model.compile({
    optimizer: tf.train.adam(0.00005),  // Reduced learning rate
    loss: 'meanSquaredError',
    metrics: ['mse', 'mae']
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
        type: 'uploaded'
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
      try {
        await tf.ready();
        // Try to load most recent model
        const models = await this.getModelList();
        if (models.length > 0) {
          // Get most recent model
          const mostRecent = models.sort((a, b) => b.createdAt - a.createdAt)[0];
          console.log(`Loading most recent model: ${mostRecent.name}`);
          this.model = await tf.loadLayersModel(`indexeddb://${mostRecent.path}`);
        } else {
          console.log('No saved models found, creating new one');
          this.model = await createModel();
        }
      } catch (error) {
        console.error('Failed to load/create model:', error);
        // If there's an error, create a fresh model
        this.model = await createModel();
      }
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
        }
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
      try {
        this.model.dispose();
      } catch (error) {
        console.warn('Error disposing model:', error);
      }
      this.model = null;
    }
  }

  async clearCache(): Promise<void> {
    this.disposeModel();
    await tf.ready();
    // Clear the backend
    tf.engine().reset();
  }
}

export const modelManager = new ModelManager();

// Training function
export async function trainModel(
  onProgress?: (progress: number) => void,
  modelName: string = 'Trained Model',
  description: string = '',
  callbacks?: {
    onEpochEnd?: (epoch: number, logs: any) => void;
    onBatchEnd?: (batch: number, logs: any) => void;
  }
): Promise<tf.LayersModel> {
  try {
    await modelManager.clearCache();
    const model = await createModel();
    await modelManager.setModel(model);  // Use the new setModel method
    
    // Fix the manifest path
    const manifestResponse = await fetch('/api/dataset/manifest');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load manifest.json');
    }
    const manifest = await manifestResponse.json();

    // Calculate total steps for progress
    const totalImages = manifest.images.length;
    const totalBatches = Math.ceil((totalImages * 2) / MODEL_CONFIG.batchSize); // Account for augmented data
    const totalSteps = totalBatches * MODEL_CONFIG.epochs;
    let currentStep = 0;

    if (onProgress) {
      onProgress(0); // Initial progress
    }

    // Load all images and labels
    const imagePromises = manifest.images.map(async (imagePath: string, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      // Fix the image path
      img.src = `/dataset/images/${imagePath}`;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
      });

      if (onProgress) {
        const loadingProgress = (index / totalImages) * 20;
        onProgress(loadingProgress);
      }
      
      return tf.tidy(() => {
        return tf.browser.fromPixels(img)
          .resizeBilinear([MODEL_CONFIG.inputShape[0], MODEL_CONFIG.inputShape[1]])
          .toFloat()
          .div(255.0);
      });
    });

    const labelPromises = manifest.labels.map(async (labelPath: string) => {
      const response = await fetch(`/dataset/labels/${labelPath}`);
      const text = await response.text();
      const [x, y] = text.trim().split(' ').map(Number);
      return [x, y];
    });

    // Wait for all data to load
    const images = await Promise.all(imagePromises);
    const labels = await Promise.all(labelPromises);

    // Use tf.tidy for tensor operations
    const { xs, ys, augmentedXs, augmentedYs } = tf.tidy(() => {
      const xs = tf.stack(images);
      const ys = tf.tensor2d(labels);
      
      // Perform data augmentation
      const flipped = tf.image.flipLeftRight(xs as tf.Tensor4D);
      const augmentedXs = tf.concat([xs, flipped], 0);
      const augmentedYs = tf.concat([ys, ys], 0);
      
      return { xs, ys, augmentedXs, augmentedYs };
    });

    // Add early stopping callback
    const earlyStopping = {
      monitor: 'val_loss',
      minDelta: 0.001,
      patience: MODEL_CONFIG.patience,
      verbose: 1,
      mode: 'min',
      baseline: null,
      restoreBestWeights: true
    };

    // Train the model
    await model.fit(augmentedXs, augmentedYs, {
      batchSize: MODEL_CONFIG.batchSize,
      epochs: MODEL_CONFIG.epochs,
      validationData: [augmentedXs, augmentedYs],
      shuffle: true,
      callbacks: {
        onBatchEnd: async (batch, logs) => {
          callbacks?.onBatchEnd?.(batch, logs);
          currentStep++;
          if (onProgress && logs) {
            const trainingProgress = Math.min(
              20 + ((currentStep / totalSteps) * 80),
              100
            );
            onProgress(trainingProgress);
            if (logs.loss < 0.01) { // Add early convergence check
              model.stopTraining = true;
            }
            console.log(`Batch ${currentStep}/${totalSteps}, Loss: ${logs.loss.toFixed(4)}`);
          }
          // Reduce UI updates frequency
          if (currentStep % 5 === 0) {
            await tf.nextFrame();
          }
        },
        onEpochEnd: async (epoch, logs) => {
          callbacks?.onEpochEnd?.(epoch, logs);
          console.log(
            `Epoch ${epoch + 1}/${MODEL_CONFIG.epochs}`,
            `Loss: ${logs?.loss?.toFixed(4)}`,
            `MSE: ${logs?.mse?.toFixed(4)}`,
            `MAE: ${logs?.mae?.toFixed(4)}`,
            `Val Loss: ${logs?.val_loss?.toFixed(4)}`
          );
          
          // Log coordinate predictions for a sample image
          if (epoch % 5 === 0) {  // Every 5 epochs
            const samplePrediction = await model.predict(
              augmentedXs.slice([0, 0], [1, ...MODEL_CONFIG.inputShape])
            ) as tf.Tensor;
            const [x, y] = await samplePrediction.data();
            console.log(`Sample prediction: x=${x.toFixed(3)}, y=${y.toFixed(3)}`);
            samplePrediction.dispose();
          }
        },
        onTrainEnd: async () => {
          if (onProgress) {
            onProgress(100);
          }
        }
      }
    });

    // Cleanup
    tf.dispose([xs, ys, augmentedXs, augmentedYs]);
    images.forEach(tensor => tensor.dispose());

    // Save the trained model
    await modelManager.saveTrainedModel(modelName, description);

    return model;
  } catch (error) {
    console.error('Error training model:', error);
    throw new Error(`Failed to train model: ${error.message}`);
  }
}

// Prediction function
export async function predictImage(
  image: HTMLImageElement | HTMLVideoElement
): Promise<{ x: number; y: number }> {
  const model = await modelManager.getModel();
  
  const tensor = tf.tidy(() => {
    return tf.browser.fromPixels(image)
      .resizeBilinear([MODEL_CONFIG.inputShape[0], MODEL_CONFIG.inputShape[1]])
      .toFloat()
      .div(255.0)
      .expandDims(0);
  });
  
  try {
    const prediction = model.predict(tensor) as tf.Tensor<tf.Rank>;
    const values = await (Array.isArray(prediction) ? prediction[0].data() : prediction.data());
    const [x, y] = values;
    
    // Cleanup
    tensor.dispose();
    if (Array.isArray(prediction)) {
      prediction.forEach(p => p.dispose());
    } else {
      prediction.dispose();
    }
    
    return { x, y };
  } catch (error) {
    tensor.dispose();
    throw new Error(`Failed to make prediction: ${error.message}`);
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