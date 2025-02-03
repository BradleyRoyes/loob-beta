import * as tf from "@tensorflow/tfjs";
import { loadDataset } from "./loadDataset";
import { MODEL_CONFIG } from "./model";

export async function prepareData(): Promise<{ xs: tf.Tensor4D, ys: tf.Tensor2D }> {
  try {
    console.log('Loading dataset...');
    const { images, labels } = await loadDataset();
    
    if (!images.length || !labels.length) {
      throw new Error('No images or labels found in dataset');
    }

    console.log(`Processing ${images.length} images and ${labels.length} labels...`);

    // Load and preprocess images in batches to prevent memory issues
    const batchSize = 10;
    const imageTensors: tf.Tensor3D[] = [];

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(images.length/batchSize)}`);
      
      const batchTensors = await Promise.all(
        batch.map(async (imgPath) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          
          try {
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = () => reject(new Error(`Failed to load image: ${imgPath}`));
              img.src = imgPath;
            });

            return tf.tidy(() => {
              // Convert image to tensor and normalize
              const tensor = tf.browser.fromPixels(img)
                .resizeNearestNeighbor([MODEL_CONFIG.inputShape[0], MODEL_CONFIG.inputShape[1]])
                .toFloat()
                .div(255.0) as tf.Tensor3D;  // Explicitly type as Tensor3D
              
              // Verify tensor shape
              if (tensor.shape.length !== 3 || 
                  tensor.shape[0] !== MODEL_CONFIG.inputShape[0] || 
                  tensor.shape[1] !== MODEL_CONFIG.inputShape[1] || 
                  tensor.shape[2] !== 3) {
                throw new Error(`Invalid tensor shape: ${tensor.shape}`);
              }
              
              return tensor;
            });
          } catch (error) {
            console.error(`Error processing image ${imgPath}:`, error);
            throw error;
          }
        })
      );

      imageTensors.push(...batchTensors);
      await tf.nextFrame(); // Prevent UI blocking
    }

    console.log('Processing labels...');
    // Process labels (assuming YOLO format: [class_id, x, y, width, height])
    const coordinates = labels.map(label => {
      const [classId, x, y, width, height] = label.map(Number);
      return [x, y, width, height];
    });

    console.log('Creating final tensors...');
    // Convert to final tensors
    return { 
      xs: tf.stack(imageTensors).reshape([-1, ...MODEL_CONFIG.inputShape]) as tf.Tensor4D,
      ys: tf.tensor2d(coordinates, [coordinates.length, 4])
    };
  } catch (error) {
    console.error('Error preparing data:', error);
    throw error;
  }
} 