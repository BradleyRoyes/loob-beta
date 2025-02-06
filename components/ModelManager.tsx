import { useEffect, useState } from 'react';
import { DetectionModel, ModelHandler, Prediction } from '@/types/detection';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import * as mediapipe from '@mediapipe/tasks-vision';
import { modelManager, predictImage } from '@/lib/model';
import * as tf from '@tensorflow/tfjs';

// The hook returns the active model, a setter for it, the detection handlers, and a loading flag.
export const useModelManager = (initialModel: DetectionModel) => {
  const [activeModel, setActiveModel] = useState<DetectionModel>(initialModel);
  const [handlers, setHandlers] = useState<Record<DetectionModel, ModelHandler>>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let customModel: tf.LayersModel | null = null;
    let cocoModel: cocoSsd.ObjectDetection | null = null;

    const loadHandlers = async () => {
      console.group('Model Initialization');
      const modelStates = { custom: false, 'coco-ssd': false };

      // Load custom model (if available)
      try {
        console.log('Loading custom model...');
        customModel = await modelManager.getModel();
        
        if (!customModel) {
          throw new Error('Model loaded but is null');
        }

        // Verify input shape
        const inputShape = customModel.inputs[0].shape;
        console.log('Model input shape:', inputShape);
        
        if (inputShape[1] !== 224 || inputShape[2] !== 224) {
          throw new Error(`Invalid input shape: expected [null,224,224,3] but got [${inputShape}]`);
        }

        // Test with correct shape
        const dummyInput = tf.zeros([1, 224, 224, 3]);
        const testOutput = customModel.predict(dummyInput) as tf.Tensor;
        console.log('Test prediction shape:', testOutput.shape);
        
        dummyInput.dispose();
        testOutput.dispose();

        modelStates.custom = true;
        console.log('✓ Custom model loaded successfully');
      } catch (e) {
        console.error('Custom model load error:', e);
        modelStates.custom = false;
      }

      // Load COCO-SSD
      try {
        console.log('Loading COCO-SSD...');
        await tf.ready();
        cocoModel = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        modelStates['coco-ssd'] = true;
        console.log('✓ COCO-SSD loaded successfully');
      } catch (e) {
        console.error('COCO-SSD load failed:', e);
      }

      console.groupEnd();

      if (!mounted) return;

      // Define handlers for each model.
      const modelHandlers: Record<DetectionModel, ModelHandler> = {
        custom: {
          init: async () => {
            if (!customModel) throw new Error('Custom model not loaded');
            return customModel;
          },
          detect: async (input: HTMLImageElement | HTMLVideoElement): Promise<Prediction[]> => {
            if (!customModel) throw new Error('Custom model not loaded');
            
            const tensor = tf.tidy(() => {
              return tf.browser.fromPixels(input)
                .resizeBilinear([128, 128])
                .toFloat()
                .div(255.0)
                .expandDims(0);
            });
            
            const prediction = await customModel.predict(tensor) as tf.Tensor;
            const [x, y] = prediction.dataSync();
            
            // Calculate confidence based on prediction stability
            const confidence = 1 - Math.sqrt(
              Math.pow(prediction.dataSync()[0] - 0.5, 2) +
              Math.pow(prediction.dataSync()[1] - 0.5, 2)
            );
            
            return [{
              x: x,
              y: y,
              bbox: [x - 0.05, y - 0.05, 0.1, 0.1], // 10% box around point
              confidence: Math.min(Math.max(confidence, 0), 1),
              class: 'ball',
              type: 'stick',
              timestamp: Date.now()
            }];
          },
          getRawPredictions: async (tensor: tf.Tensor3D) => {
            if (!customModel) throw new Error('Custom model not loaded');
            
            try {
              const processed = tf.tidy(() => 
                tensor.resizeBilinear([128, 128])
                  .toFloat()
                  .div(255.0)
                  .expandDims(0)
              );
              
              const predictions = await customModel.predict(processed) as tf.Tensor;
              processed.dispose();
              
              return predictions;
            } catch (err) {
              console.error('Model prediction error:', err);
              throw err;
            }
          }
        },
        'coco-ssd': {
          init: async () => cocoModel,
          detect: async (input: HTMLImageElement | HTMLVideoElement): Promise<Prediction[]> => {
            if (!cocoModel) throw new Error('COCO-SSD model not loaded');
            
            // Get input dimensions
            const width = input instanceof HTMLVideoElement ? input.videoWidth : input.width;
            const height = input instanceof HTMLVideoElement ? input.videoHeight : input.height;
            
            // Run detection with lower confidence threshold
            const detections = await cocoModel.detect(input, 20); // Limit to top 20 objects
            
            return detections
              .filter(d => d.score > 0.2) // Lower threshold to see more objects
              .map(d => ({
                x: (d.bbox[0] + d.bbox[2]/2) / width,  // center x
                y: (d.bbox[1] + d.bbox[3]/2) / height, // center y
                bbox: [
                  d.bbox[0] / width,                    // x_min
                  d.bbox[1] / height,                   // y_min
                  (d.bbox[0] + d.bbox[2]) / width,     // x_max
                  (d.bbox[1] + d.bbox[3]) / height     // y_max
                ],
                confidence: d.score,
                class: d.class,
                type: d.class,
                timestamp: Date.now()
              }));
          }
        }
      };

      if (mounted) {
        setHandlers(modelHandlers);
        setIsLoading(false);
      }
    };

    loadHandlers();
    return () => { mounted = false; };
  }, []);

  return { activeModel, setActiveModel, handlers, isLoading };
};