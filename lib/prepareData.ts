import * as tf from "@tensorflow/tfjs";
import { loadDataset } from "./loadDataset";
import { MODEL_CONFIG } from "./model";

interface YOLOLabel {
  ball1: { x: number; y: number };
  ball2: { x: number; y: number };
}

export const preprocessImage = async (imageData: string): Promise<tf.Tensor3D> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const tensor = tf.tidy(() => {
          const processed = tf.browser.fromPixels(img)
            .resizeBilinear([224, 224])
            .div(255.0);
          return processed.as3D(224, 224, 3);
        });
        resolve(tensor);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageData;
  });
};

export const preprocessLabel = (label: YOLOLabel): tf.Tensor1D => {
  return tf.tidy(() => tf.tensor1d([
    label.ball1.x,
    label.ball1.y,
    0.05, // width
    0.05, // height
    1.0,  // confidence
    label.ball2.x,
    label.ball2.y,
    0.05, // width
    0.05, // height
    1.0,  // confidence
  ]));
};

export const augmentData = (image: tf.Tensor3D, label: tf.Tensor1D): [tf.Tensor3D, tf.Tensor1D] => {
  return tf.tidy(() => {
    // Verify input tensor shapes
    const [height, width, channels] = image.shape;
    if (height !== 224 || width !== 224 || channels !== 3) {
      throw new Error(`Invalid image tensor shape: [${height}, ${width}, ${channels}]`);
    }
    if (label.shape[0] !== 10) {
      throw new Error(`Invalid label tensor shape: ${label.shape[0]}`);
    }

    // Random horizontal flip with 50% probability
    if (Math.random() > 0.5) {
      const flippedImage = tf.image.flipLeftRight(
        tf.expandDims(image, 0) as tf.Tensor4D
      ).squeeze([0]).as3D(224, 224, 3);

      // Flip x coordinates for both balls
      const flippedLabel = tf.concat([
        tf.tensor1d([1 - label.gather(0).dataSync()[0]]), // ball1 x
        label.slice(1, 1), // ball1 y
        label.slice(2, 3), // ball1 width, height, conf
        tf.tensor1d([1 - label.gather(5).dataSync()[0]]), // ball2 x
        label.slice(6, 1), // ball2 y
        label.slice(7, 3), // ball2 width, height, conf
      ]);
      
      return [flippedImage, flippedLabel];
    }

    // Random brightness adjustment
    const brightness = tf.randomUniform([], -0.2, 0.2);
    const adjustedImage = tf.add(image, brightness).clipByValue(0, 1).as3D(224, 224, 3);
    
    return [adjustedImage, label];
  }) as [tf.Tensor3D, tf.Tensor1D];
};

export const createDataset = async (
  images: string[],
  labels: YOLOLabel[],
  batchSize: number
): Promise<tf.data.Dataset<[tf.Tensor3D, tf.Tensor1D]>> => {
  if (images.length !== labels.length) {
    throw new Error(`Mismatched number of images (${images.length}) and labels (${labels.length})`);
  }

  try {
    // Process all images and labels
    const processedData = await Promise.all(
      images.map(async (img, i) => {
        const image = await preprocessImage(img);
        const label = preprocessLabel(labels[i]);
        
        try {
          // Apply augmentation
          const [augImage, augLabel] = augmentData(image, label);
          return [augImage, augLabel];
        } finally {
          // Cleanup original tensors after augmentation
          tf.dispose([image, label]);
        }
      })
    );

    // Create TensorFlow dataset
    return tf.data.array(processedData)
      .shuffle(1000)
      .batch(batchSize)
      .prefetch(2) as tf.data.Dataset<[tf.Tensor3D, tf.Tensor1D]>;
  } catch (error) {
    // Ensure cleanup on error
    console.error('Error creating dataset:', error);
    throw error;
  }
};

export async function prepareData(): Promise<{ xs: tf.Tensor4D, ys: tf.Tensor2D }> {
  const tensors: tf.Tensor[] = [];
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

            const tensor = tf.tidy(() => {
              const processed = tf.browser.fromPixels(img)
                .resizeNearestNeighbor([MODEL_CONFIG.inputShape[0], MODEL_CONFIG.inputShape[1]])
                .toFloat()
                .div(255.0);
              
              // Verify tensor shape
              const shape = processed.shape;
              if (shape.length !== 3 || 
                  shape[0] !== MODEL_CONFIG.inputShape[0] || 
                  shape[1] !== MODEL_CONFIG.inputShape[1] || 
                  shape[2] !== 3) {
                throw new Error(`Invalid tensor shape: [${shape}]`);
              }
              
              return processed as tf.Tensor3D;
            });
            tensors.push(tensor);
            return tensor;
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
      if (!Array.isArray(label) || label.length !== 5) {
        throw new Error(`Invalid label format: ${JSON.stringify(label)}`);
      }
      const [classId, x, y, width, height] = label.map(Number);
      if ([x, y, width, height].some(isNaN)) {
        throw new Error(`Invalid label values: ${JSON.stringify(label)}`);
      }
      return [x, y, width, height];
    });

    console.log('Creating final tensors...');
    const xs = tf.stack(imageTensors).reshape([-1, ...MODEL_CONFIG.inputShape]) as tf.Tensor4D;
    const ys = tf.tensor2d(coordinates, [coordinates.length, 4]);
    tensors.push(xs, ys);
    
    return { xs, ys };
  } catch (error) {
    // Cleanup on error
    tf.dispose(tensors);
    throw error;
  }
} 