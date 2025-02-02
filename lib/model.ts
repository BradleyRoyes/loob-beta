import * as tf from '@tensorflow/tfjs';
import { v4 as uuidv4 } from 'uuid';

// Simple model configuration
export const MODEL_CONFIG = {
  inputShape: [128, 128, 3] as [number, number, number],
  outputShape: 2,
  batchSize: 16,
  epochs: 50
};

// Create a simple model architecture
function createModel(): tf.LayersModel {
  const model = tf.sequential();
  
  // Input convolutional layer
  model.add(tf.layers.conv2d({
    inputShape: MODEL_CONFIG.inputShape,
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  
  // Second convolutional layer
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
  
  // Flatten and dense layers
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
  model.add(tf.layers.dense({ units: MODEL_CONFIG.outputShape, activation: 'sigmoid' }));
  
  // Compile model
  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError',
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
}

export class ModelManager {
  private model: tf.LayersModel | null = null;
  private readonly storagePrefix = 'loobricate-models';
  private readonly modelListKey = `${this.storagePrefix}-list`;

  constructor() {
    // Initialize IndexedDB for model storage
    tf.setBackend('webgl');
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
        const modelJson = await modelFile.text();
        const weightsArrayBuffer = await weightsFile.arrayBuffer();
        const weights = new Uint8Array(weightsArrayBuffer);
        
        model = await tf.loadLayersModel(tf.io.fromMemory(JSON.parse(modelJson), weights));
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

  async clearCache(): Promise<void> {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    await tf.ready();
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
          // Add indexeddb:// prefix to path
          this.model = await tf.loadLayersModel(`indexeddb://${mostRecent.path}`);
        } else {
          console.log('No saved models found, creating new one');
          this.model = createModel();
        }
      } catch (error) {
        console.error('Failed to load/create model:', error);
        throw error;
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
      this.model.dispose();
      this.model = null;
    }
  }
}

export const modelManager = new ModelManager();

// Training function
export async function trainModel(
  onProgress?: (progress: number) => void,
  modelName: string = 'Trained Model',
  description: string = '',
): Promise<tf.LayersModel> {
  try {
    const model = await modelManager.getModel();

    // Load manifest
    const manifestResponse = await fetch('/dataset/manifest.json');
    if (!manifestResponse.ok) {
      throw new Error('Failed to load manifest.json');
    }
    const manifest = await manifestResponse.json();

    // Calculate total steps for progress
    const totalImages = manifest.images.length;
    const totalBatches = Math.ceil(totalImages / MODEL_CONFIG.batchSize);
    const totalSteps = totalBatches * MODEL_CONFIG.epochs;
    let currentStep = 0;

    if (onProgress) {
      onProgress(0); // Initial progress
    }

    // Load all images and labels
    const imagePromises = manifest.images.map(async (imagePath: string, index) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `/dataset/images/${imagePath}`;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
      });

      // Update loading progress (first 20% of total progress)
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
      if (!response.ok) {
        throw new Error(`Failed to load label file: ${labelPath}`);
      }
      const text = await response.text();
      const [, x, y] = text.trim().split(' ').map(Number);
      return [x, y];
    });

    // Wait for all data to load
    const images = await Promise.all(imagePromises);
    const labels = await Promise.all(labelPromises);

    // Convert to tensors
    const xs = tf.stack(images);
    const ys = tf.tensor2d(labels);

    // Train the model
    await model.fit(xs, ys, {
      batchSize: MODEL_CONFIG.batchSize,
      epochs: MODEL_CONFIG.epochs,
      shuffle: true,
      callbacks: {
        onBatchEnd: async (batch, logs) => {
          currentStep++;
          if (onProgress && logs) {
            // Training progress (remaining 80% of total progress)
            const trainingProgress = 20 + ((currentStep / totalSteps) * 80);
            onProgress(Math.min(trainingProgress, 99)); // Cap at 99% until fully complete
            console.log(`Batch ${currentStep}/${totalSteps}, Loss: ${logs.loss.toFixed(4)}`);
          }
          await tf.nextFrame();
        },
        onEpochEnd: async (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}/${MODEL_CONFIG.epochs} complete. Loss: ${logs?.loss.toFixed(4)}`);
        }
      }
    });

    // Final cleanup
    xs.dispose();
    ys.dispose();
    images.forEach(tensor => tensor.dispose());

    // Save model with metadata after training
    await modelManager.saveTrainedModel(modelName, description);

    if (onProgress) {
      onProgress(100);
    }

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
    const prediction = model.predict(tensor) as tf.Tensor;
    const [x, y] = await prediction.data();
    
    // Cleanup
    tensor.dispose();
    prediction.dispose();
    
    return { x, y };
  } catch (error) {
    tensor.dispose();
    throw new Error(`Failed to make prediction: ${error.message}`);
  }
} 