import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';

export interface PoseDetectionConfig {
  modelType?: 'MoveNet' | 'BlazePose';
  enableTracking?: boolean;
  minPoseScore?: number;
  multiPoseMode?: boolean;
}

export class PoseDetectionService {
  private detector: poseDetection.PoseDetector | null = null;
  private isInitialized = false;
  
  constructor(private config: PoseDetectionConfig = {}) {
    this.config = {
      modelType: 'MoveNet',
      enableTracking: true,
      minPoseScore: 0.3,
      multiPoseMode: false,
      ...config
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Ensure TensorFlow backend is ready
      await tf.ready();
      console.log('TensorFlow backend:', tf.getBackend());

      // Configure detector based on model type
      const detectorConfig = this.config.modelType === 'MoveNet' 
        ? {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableTracking: this.config.enableTracking,
            trackerType: poseDetection.TrackerType.BoundingBox,
            multiPoseMode: this.config.multiPoseMode,
          }
        : {
            runtime: 'mediapipe',
            enableSegmentation: true,
            smoothSegmentation: true,
          };

      // Create detector
      this.detector = await poseDetection.createDetector(
        this.config.modelType === 'MoveNet' 
          ? poseDetection.SupportedModels.MoveNet
          : poseDetection.SupportedModels.BlazePose,
        detectorConfig
      );

      this.isInitialized = true;
      console.log('Pose detection model initialized');
    } catch (error) {
      console.error('Error initializing pose detection:', error);
      throw error;
    }
  }

  async detectPose(image: ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement) {
    if (!this.detector) {
      throw new Error('Detector not initialized. Call initialize() first.');
    }

    try {
      const poses = await this.detector.estimatePoses(image, {
        flipHorizontal: false,
        maxPoses: this.config.multiPoseMode ? 5 : 1,
      });

      // Filter poses by score
      return poses.filter(pose => (pose.score || 0) > (this.config.minPoseScore || 0.3));
    } catch (error) {
      console.error('Error detecting poses:', error);
      throw error;
    }
  }

  // Color detection in RGB space using TensorFlow.js
  async detectColor(
    image: tf.Tensor3D | ImageData | HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    targetColor: [number, number, number],
    threshold = 30
  ) {
    try {
      // Convert input to tensor if needed
      let tensor = image instanceof tf.Tensor ? image : tf.browser.fromPixels(image);
      
      // Normalize the image
      const normalizedImage = tf.tidy(() => {
        return tf.cast(tensor, 'float32').div(255);
      });

      // Create target color tensor
      const targetColorTensor = tf.tensor1d(targetColor.map(v => v / 255));

      // Calculate color distance for each pixel
      const colorDistances = tf.tidy(() => {
        // Compute Euclidean distance between each pixel and target color
        const distances = normalizedImage.sub(targetColorTensor).pow(2).sum(-1).sqrt();
        // Create mask where distance is less than threshold
        return distances.less(threshold / 255);
      });

      // Find centroid of matching pixels
      const mask = await colorDistances.array();
      const coords = [];
      
      for (let y = 0; y < mask.length; y++) {
        for (let x = 0; x < mask[0].length; x++) {
          if (mask[y][x]) {
            coords.push([x, y]);
          }
        }
      }

      // Clean up tensors
      tf.dispose([normalizedImage, colorDistances, targetColorTensor]);
      if (!tensor.isDisposed) tensor.dispose();

      if (coords.length === 0) return null;

      // Calculate centroid
      const centroid = coords.reduce(
        (acc, [x, y]) => ({ x: acc.x + x, y: acc.y + y }),
        { x: 0, y: 0 }
      );

      return {
        x: centroid.x / coords.length,
        y: centroid.y / coords.length,
        confidence: coords.length / (mask.length * mask[0].length)
      };
    } catch (error) {
      console.error('Error detecting color:', error);
      throw error;
    }
  }

  dispose() {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.isInitialized = false;
    }
  }
} 