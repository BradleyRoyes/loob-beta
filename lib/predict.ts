import * as tf from '@tensorflow/tfjs';

type Prediction = [number, number];

let model: tf.LayersModel | null = null;

export async function setModel(loadedModel: tf.LayersModel) {
  model = loadedModel;
}

export async function loadModel(modelFiles?: FileList): Promise<tf.LayersModel> {
  try {
    if (modelFiles) {
      const files = Array.from(modelFiles);
      console.log('Received files:', files.map(f => ({ name: f.name, size: f.size })));
      
      // Find model.json and weights files
      const jsonFile = files.find(file => file.name.endsWith('.json'));
      const weightsFiles = files.filter(file => file.name.endsWith('.bin'));
      
      if (!jsonFile) {
        throw new Error('model.json file not found. Please select the .json file saved from training.');
      }
      
      if (weightsFiles.length === 0) {
        throw new Error('No weights (.bin) files found. Please select the .bin file saved from training.');
      }

      console.log('Found model files:', {
        model: jsonFile.name,
        weights: weightsFiles.map(f => f.name)
      });

      // Load and parse the model.json first to verify it's valid
      const jsonContent = await jsonFile.text();
      try {
        JSON.parse(jsonContent); // Verify JSON is valid
        console.log('Model JSON is valid');
      } catch (e) {
        throw new Error('Invalid model.json file. The file might be corrupted.');
      }

      // Create a map of files for tf.io.browserFiles
      const fileMap = new Map<string, File>();
      fileMap.set('model.json', jsonFile);
      weightsFiles.forEach(weightsFile => {
        fileMap.set(weightsFile.name, weightsFile);
      });

      console.log('Loading model...');
      model = await tf.loadLayersModel(tf.io.browserFiles([...fileMap.values()]));
      
      // Verify model architecture
      const inputShape = model.inputs[0].shape;
      const outputShape = model.outputs[0].shape;
      console.log('Model architecture:', {
        inputShape,
        outputShape,
        layers: model.layers.map(l => ({
          name: l.name,
          className: l.getClassName(),
          outputShape: l.outputShape
        }))
      });

      if (inputShape[1] !== 128 || inputShape[2] !== 128 || inputShape[3] !== 3) {
        throw new Error('Invalid model input shape. Expected [null, 128, 128, 3]');
      }

      if (outputShape[1] !== 2) {
        throw new Error('Invalid model output shape. Expected [null, 2]');
      }

      // Warm up the model
      console.log('Warming up model...');
      const dummyInput = tf.zeros([1, 128, 128, 3]);
      const warmupResult = await model.predict(dummyInput).data();
      console.log('Warmup prediction:', warmupResult);
      dummyInput.dispose();

      console.log('Model loaded and ready');
      return model;
    } else if (!model) {
      throw new Error('No model loaded. Please load a model first.');
    }
    
    return model;
  } catch (error) {
    console.error('Model loading failed:', error);
    throw new Error(`Model loading failed: ${error.message}`);
  }
}

export async function predictImage(imageElement: HTMLImageElement | HTMLVideoElement): Promise<Prediction> {
  try {
    if (!model) {
      throw new Error('No model loaded. Please load a model first.');
    }
    
    return tf.tidy(() => {
      // Preprocess image to match training format
      const imageTensor = tf.browser.fromPixels(imageElement)
        .resizeNearestNeighbor([128, 128])
        .toFloat()
        .div(tf.scalar(255))
        .expandDims(0);

      // Make prediction
      const prediction = model.predict(imageTensor) as tf.Tensor;
      const result = Array.from(prediction.dataSync()) as Prediction;
      
      if (result.length !== 2) {
        throw new Error('Invalid prediction output shape');
      }
      
      return result;
    });
  } catch (error) {
    console.error('Prediction failed:', error);
    throw error;
  }
} 