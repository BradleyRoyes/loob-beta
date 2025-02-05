import * as tf from '@tensorflow/tfjs';
import * as tflite from '@tensorflow/tfjs-tflite';
import * as poseDetection from '@tensorflow-models/pose-detection';

export type MLBackend = 'tflite' | 'tfjs';

export interface MLServiceConfig {
  backend: MLBackend;
  modelType: 'MoveNet' | 'BlazePose';
  enableTracking?: boolean;
  minPoseScore?: number;
  useWebGPU?: boolean;
}

export interface ColorDetectionResult {
  x: number;
  y: number;
  confidence: number;
}

export class MLService {
  private detector: poseDetection.PoseDetector | null = null;
  private tfliteModel: tflite.TFLiteModel | null = null;
  private isInitialized = false;

  constructor(private config: MLServiceConfig) {
    this.config = {
      backend: 'tflite',
      modelType: 'MoveNet',
      enableTracking: true,
      minPoseScore: 0.3,
      useWebGPU: true,
      ...config
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      if (this.config.backend === 'tflite') {
        await this.initializeTFLite();
      } else {
        await this.initializeTFJS();
      }

      this.isInitialized = true;
      console.log(`ML Service initialized using ${this.config.backend}`);
    } catch (error) {
      console.error('Error initializing ML Service:', error);
      throw error;
    }
  }

  private async initializeTFLite() {
    // Initialize TFLite
    await tflite.setWasmPath(
      'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-tflite@0.0.1-alpha.9/dist/'
    );

    // Load the appropriate model based on config
    const modelUrl = this.config.modelType === 'MoveNet'
      ? 'https://tfhub.dev/tensorflow/lite-model/movenet/singlepose/lightning/tflite/float16/4'
      : 'https://tfhub.dev/tensorflow/lite-model/blazepose/3d/full/1';

    this.tfliteModel = await tflite.loadTFLiteModel(modelUrl);
  }

  private async initializeTFJS() {
    // Initialize TensorFlow.js
    if (this.config.useWebGPU && tf.backend().name !== 'webgpu') {
      try {
        await tf.setBackend('webgpu');
      } catch (e) {
        console.warn('WebGPU not available, falling back to WebGL');
        await tf.setBackend('webgl');
      }
    } else if (tf.backend().name !== 'webgl') {
      await tf.setBackend('webgl');
    }
    await tf.ready();

    // Configure detector
    const detectorConfig = this.config.modelType === 'MoveNet' 
      ? {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          enableTracking: this.config.enableTracking,
          trackerType: poseDetection.TrackerType.BoundingBox,
        }
      : {
          runtime: 'mediapipe',
          enableSegmentation: true,
          smoothSegmentation: true,
        };

    this.detector = await poseDetection.createDetector(
      this.config.modelType === 'MoveNet' 
        ? poseDetection.SupportedModels.MoveNet
        : poseDetection.SupportedModels.BlazePose,
      detectorConfig
    );
  }

  async detectPose(image: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
    if (!this.isInitialized) {
      throw new Error('ML Service not initialized. Call initialize() first.');
    }

    try {
      if (this.config.backend === 'tflite' && this.tfliteModel) {
        return await this.detectPoseTFLite(image);
      } else if (this.detector) {
        return await this.detectPoseTFJS(image);
      }
      throw new Error('No model available');
    } catch (error) {
      console.error('Error detecting pose:', error);
      throw error;
    }
  }

  private async detectPoseTFLite(image: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
    if (!this.tfliteModel) throw new Error('TFLite model not loaded');

    // Convert input to tensor
    const tensor = tf.tidy(() => {
      let imageTensor = tf.browser.fromPixels(image);
      // Normalize and resize image according to model requirements
      return tf.image.resizeBilinear(imageTensor, [192, 192])
        .div(255.0)
        .expandDims(0);
    });

    // Run inference
    const predictions = await this.tfliteModel.predict(tensor) as tf.Tensor;
    const poses = this.decodePoses(predictions);
    
    // Cleanup
    tf.dispose([tensor, predictions]);

    return poses;
  }

  private async detectPoseTFJS(image: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
    if (!this.detector) throw new Error('TFJS detector not initialized');

    const poses = await this.detector.estimatePoses(image, {
      flipHorizontal: false,
      maxPoses: 1,
    });

    return poses.filter(pose => (pose.score || 0) > (this.config.minPoseScore || 0.3));
  }

  private decodePoses(predictions: tf.Tensor): poseDetection.Pose[] {
    // Implement pose decoding based on model output format
    // This will vary depending on the specific TFLite model being used
    const poses = [];
    // ... decoding logic ...
    return poses;
  }

  async detectColor(
    image: tf.Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    targetColor: [number, number, number],
    threshold = 30
  ): Promise<ColorDetectionResult | null> {
    try {
      // Convert input to tensor if needed
      let tensor = image instanceof tf.Tensor ? image : tf.browser.fromPixels(image);
      
      // Use tf.tidy for automatic memory management
      return tf.tidy(() => {
        // Normalize the image
        const normalizedImage = tf.cast(tensor, 'float32').div(255);
        
        // Create target color tensor
        const targetColorTensor = tf.tensor1d(targetColor.map(v => v / 255));
        
        // Calculate color distance and create mask
        const distances = normalizedImage.sub(targetColorTensor).pow(2).sum(-1).sqrt();
        const mask = distances.less(threshold / 255);
        
        // Find matching pixels
        const coords = this.findMatchingPixels(mask);
        
        if (coords.length === 0) return null;
        
        // Calculate centroid
        const centroid = coords.reduce(
          (acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }),
          { x: 0, y: 0 }
        );
        
        return {
          x: centroid.x / coords.length,
          y: centroid.y / coords.length,
          confidence: coords.length / (mask.shape[0] * mask.shape[1])
        };
      });
    } catch (error) {
      console.error('Error detecting color:', error);
      throw error;
    }
  }

  private findMatchingPixels(mask: tf.Tensor2D): Array<[number, number]> {
    const coords: Array<[number, number]> = [];
    const maskData = mask.dataSync();
    const [height, width] = mask.shape;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (maskData[y * width + x]) {
          coords.push([x, y]);
        }
      }
    }
    
    return coords;
  }

  dispose() {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
    if (this.tfliteModel) {
      this.tfliteModel.dispose();
      this.tfliteModel = null;
    }
    this.isInitialized = false;
  }
} 