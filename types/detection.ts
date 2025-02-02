import * as tf from '@tensorflow/tfjs';

export type Prediction = {
  bbox: [number, number, number, number]; // [x_min, y_min, x_max, y_max]
  confidence: number;
  class: string;
  type: string;
  timestamp: number;
};

export type DetectionModel = 'custom' | 'coco-ssd';

export interface ModelHandler {
  init: () => Promise<any>;
  detect: (input: HTMLImageElement | HTMLVideoElement) => Promise<Prediction[]>;
  getRawPredictions?: (tensor: tf.Tensor3D) => Promise<tf.Tensor>;
}

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
}; 