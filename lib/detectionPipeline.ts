import { Prediction, DetectionModel } from '@/types/detection';

export class DetectionPipeline {
  private predictions: Prediction[] = [];
  private activeModel: DetectionModel;
  private frameProcessor?: (predictions: Prediction[]) => void;

  constructor(initialModel: DetectionModel) {
    this.activeModel = initialModel;
  }

  async processFrame(video: HTMLVideoElement): Promise<void> {
    // Implementation would call the appropriate model detection
    // and process the results into Prediction format
  }

  registerFrameProcessor(processor: (predictions: Prediction[]) => void) {
    this.frameProcessor = processor;
  }

  setModel(model: DetectionModel) {
    this.activeModel = model;
  }

  dispose() {
    // Cleanup resources
  }
} 