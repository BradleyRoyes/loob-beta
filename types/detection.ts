import * as tf from '@tensorflow/tfjs';

export interface Prediction {
  x: number;
  y: number;
  confidence: number;
  type: string;
  class: string;
  bbox?: number[];
  coordinates?: number[];
  timestamp: number;
}

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