import * as tf from "@tensorflow/tfjs";
import { loadDataset } from "./loadDataset";

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
                .resizeNearestNeighbor([128, 128])
                .toFloat()
                .div(tf.scalar(255));
              
              // Verify tensor shape
              if (tensor.shape.length !== 3 || 
                  tensor.shape[0] !== 128 || 
                  tensor.shape[1] !== 128 || 
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
    const coordinates = labels.map((label, index) => {
      if (!Array.isArray(label) || label.length < 5) {
        throw new Error(`Invalid label format at index ${index}`);
      }
      
      // Extract and validate center coordinates
      const x = Number(label[1]);
      const y = Number(label[2]);
      
      if (isNaN(x) || isNaN(y) || x < 0 || x > 1 || y < 0 || y > 1) {
        throw new Error(`Invalid coordinates at index ${index}: x=${x}, y=${y}`);
      }
      
      return [x, y];
    });

    console.log('Creating final tensors...');
    // Convert to final tensors
    const xs = tf.stack(imageTensors) as tf.Tensor4D;
    const ys = tf.tensor2d(coordinates, [coordinates.length, 2]);

    // Verify final tensor shapes
    console.log('Final tensor shapes:', {
      xs: xs.shape,
      ys: ys.shape
    });

    if (xs.shape[0] !== ys.shape[0]) {
      throw new Error(`Mismatch between number of images (${xs.shape[0]}) and labels (${ys.shape[0]})`);
    }

    // Cleanup intermediate tensors
    imageTensors.forEach(t => t.dispose());

    return { xs, ys };
  } catch (error) {
    console.error('Error preparing data:', error);
    throw error;
  }
} 