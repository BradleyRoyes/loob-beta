import * as tf from '@tensorflow/tfjs';

export const createStickDetectionModel = () => {
  const model = tf.sequential();
  
  // Optimized for small datasets
  model.add(tf.layers.conv2d({
    inputShape: [128, 128, 3],
    filters: 16,
    kernelSize: 3,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({l2: 0.01})
  }));
  model.add(tf.layers.maxPooling2d({poolSize: 2}));

  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({l2: 0.01})
  }));
  model.add(tf.layers.dropout({rate: 0.5}));
  model.add(tf.layers.dense({units: 2, activation: 'sigmoid'}));

  // Use a fixed learning rate for older TF.js versions
  const learningRate = 0.0001; // Define the learning rate
  model.compile({
    optimizer: tf.train.adam(learningRate), // Use the fixed learning rate
    loss: 'meanSquaredError'
  });
  
  return model;
}; 