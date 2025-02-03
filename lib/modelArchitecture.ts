import * as tf from '@tensorflow/tfjs';

export const createDetectionModel = (outputType: 'regression' | 'detection' = 'detection') => {
  const model = tf.sequential();
  
  // Base feature extractor
  model.add(tf.layers.conv2d({
    inputShape: [224, 224, 3],
    filters: 32,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({poolSize: 2}));

  // Add more layers for detection
  model.add(tf.layers.conv2d({
    filters: 64,
    kernelSize: 3,
    activation: 'relu',
    padding: 'same'
  }));
  model.add(tf.layers.maxPooling2d({poolSize: 2}));

  // Final layers based on output type
  if (outputType === 'regression') {
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({units: 32, activation: 'relu'}));
    model.add(tf.layers.dense({units: 2, activation: 'sigmoid'}));
  } else {
    // Detection output: 5 values (x, y, width, height, confidence)
    model.add(tf.layers.conv2d({
      filters: 5,
      kernelSize: 3,
      activation: 'sigmoid',
      padding: 'same'
    }));
    model.add(tf.layers.globalAveragePooling2d({}));
  }

  // Use a fixed learning rate for older TF.js versions
  const learningRate = 0.0001; // Define the learning rate
  model.compile({
    optimizer: tf.train.adam(learningRate), // Use the fixed learning rate
    loss: 'meanSquaredError'
  });
  
  return model;
};

export const createHybridModel = () => {
  const model = tf.sequential();
  model.add(tf.layers.dense({units: 64, activation: 'relu', inputShape: [21 * 3]})); // 21 landmarks * (x,y,z)
  model.add(tf.layers.dense({units: 32, activation: 'relu'}));
  model.add(tf.layers.dense({units: 2, activation: 'sigmoid'})); // Output (x,y)
  
  model.compile({
    optimizer: 'adam',
    loss: 'meanSquaredError'
  });
  
  return model;
}; 