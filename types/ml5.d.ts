declare module 'ml5' {
  interface PoseNetOptions {
    architecture?: string;
    imageScaleFactor?: number;
    outputStride?: number;
    flipHorizontal?: boolean;
    minConfidence?: number;
    maxPoseDetections?: number;
    scoreThreshold?: number;
    nmsRadius?: number;
    detectionType?: string;
    inputResolution?: number;
  }

  interface Keypoint {
    position: {
      x: number;
      y: number;
    };
    score: number;
    part: string;
  }

  interface Pose {
    pose: {
      keypoints: Keypoint[];
      score: number;
    };
  }

  interface PoseNet {
    on(event: 'pose', callback: (poses: Pose[]) => void): void;
  }

  function poseNet(
    video: HTMLVideoElement,
    options?: PoseNetOptions
  ): Promise<PoseNet>;

  export { PoseNet, PoseNetOptions, Pose, Keypoint };
  export default { poseNet };
} 