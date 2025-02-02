import * as tf from "@tensorflow/tfjs";

export async function loadDataset() {
  const images: string[] = [];
  const labels: number[][] = [];

  try {
    console.log('\n🔍 Starting Dataset Loading Process');
    console.log('=====================================');
    
    // Check dataset structure via API
    const response = await fetch('/api/dataset/validate');
    if (!response.ok) {
      throw new Error('Failed to check dataset structure');
    }

    const data = await response.json();
    console.log('\n📁 Dataset Validation:', data);

    if (!data.isValid) {
      throw new Error(
        '❌ Dataset validation failed:\n' +
        data.errors.map(e => `- [${e.code}] ${e.message}`).join('\n')
      );
    }

    if (!data.files || !data.files.images || data.files.images.length === 0) {
      throw new Error('No image files found in dataset');
    }

    // Load files
    console.log('\n📥 Loading Dataset Files:');
    const imageFiles = data.files.images;
    console.log(`Found ${imageFiles.length} images to process`);
    
    for (const imageFile of imageFiles) {
      // Use the actual image filename from validation
      const imagePath = `/dataset/images/${imageFile}`;
      const baseName = imageFile.replace('.jpg', '');
      const labelPath = `/dataset/labels/${baseName}.txt`;

      console.log(`\nProcessing image: ${imageFile}`);
      console.log(`🖼️  Image path: ${imagePath}`);
      console.log(`📝 Label path: ${labelPath}`);

      try {
        // Load and verify image
        const img = new Image();
        const imageLoadPromise = new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
          // Add timestamp to prevent caching
          img.src = `${imagePath}?t=${Date.now()}`;
        });

        // Add timeout to image loading
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Image loading timed out')), 5000);
        });

        await Promise.race([imageLoadPromise, timeoutPromise]);

        if (img.width === 0 || img.height === 0) {
          throw new Error(
            `Invalid image dimensions: ${img.width}x${img.height}\n` +
            'Image file may be corrupted'
          );
        }

        images.push(imagePath);
        console.log(`✅ Image verified: ${img.width}x${img.height}px`);

        // Load and verify label
        const labelContent = await fetch(labelPath)
          .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return res.text();
          });

        // Remove any trailing % and clean up whitespace
        const cleanContent = labelContent.replace(/%$/, '').trim();
        const coordinates = cleanContent.split(/\s+/).map(Number);

        if (coordinates.length !== 5 || coordinates.some(isNaN)) {
          throw new Error(
            `Invalid label format in ${labelPath}\n` +
            `Found: "${cleanContent}"\n` +
            'Expected format: "class_id x y width height"\n' +
            'Make sure:\n' +
            '1. File contains exactly five numbers\n' +
            '2. Numbers are separated by spaces\n' +
            '3. Coordinates are normalized (0-1)\n' +
            '4. No extra characters or whitespace'
          );
        }

        // Validate coordinate ranges
        const [classId, x, y, w, h] = coordinates;
        if (x < 0 || x > 1 || y < 0 || y > 1 || w < 0 || w > 1 || h < 0 || h > 1) {
          throw new Error(
            `Invalid coordinates in ${labelPath}\n` +
            `Found: class=${classId}, x=${x}, y=${y}, w=${w}, h=${h}\n` +
            'All coordinates must be normalized (between 0 and 1)'
          );
        }

        labels.push(coordinates);
        console.log(`✅ Label verified: class=${classId}, x=${x}, y=${y}, w=${w}, h=${h}`);

      } catch (error) {
        console.error(`\n❌ Error processing ${imageFile}:`, error);
        console.error('Full error:', error);
        throw new Error(
          `Failed to process ${imageFile}\n\n` +
          'Please check:\n' +
          '1. Image file exists and is a valid JPEG\n' +
          '2. Label file exists with valid coordinates\n' +
          '3. Coordinates are normalized (0-1)\n' +
          '4. Files are in the correct location\n\n' +
          `Detailed error: ${error.message}`
        );
      }
    }

    console.log('\n✅ Dataset Loading Complete!');
    console.log(`📊 Summary:`);
    console.log(`- Total frames loaded: ${images.length}`);
    console.log(`- Total labels loaded: ${labels.length}`);
    
    if (images.length === 0) {
      throw new Error('No valid image/label pairs were loaded');
    }

    console.log('\n📈 Dataset Statistics:');
    const ysTensor = tf.tensor2d(labels);
    console.log(`- Average X: ${ysTensor.slice([0, 1], [ysTensor.shape[0], 1]).mean().dataSync()[0].toFixed(3)}`);
    console.log(`- Average Y: ${ysTensor.slice([0, 2], [ysTensor.shape[0], 1]).mean().dataSync()[0].toFixed(3)}`);
    console.log(`- X Range: [${ysTensor.slice([0, 1], [ysTensor.shape[0], 1]).min().dataSync()[0].toFixed(3)}, 
                   ${ysTensor.slice([0, 1], [ysTensor.shape[0], 1]).max().dataSync()[0].toFixed(3)}]`);
    console.log(`- Y Range: [${ysTensor.slice([0, 2], [ysTensor.shape[0], 1]).min().dataSync()[0].toFixed(3)}, 
                   ${ysTensor.slice([0, 2], [ysTensor.shape[0], 1]).max().dataSync()[0].toFixed(3)}]`);
    ysTensor.dispose();

    return { images, labels };

  } catch (error) {
    console.error('\n❌ Dataset Loading Failed!');
    console.error('=========================');
    console.error(error.message);
    console.error('\nFull error:', error);
    console.error('\n📋 Troubleshooting Checklist:');
    console.error('1. Verify directory structure:');
    console.error('   /public/');
    console.error('     └── dataset/');
    console.error('         ├── images/  (*.jpg files)');
    console.error('         └── labels/  (*.txt files)');
    console.error('\n2. Check file naming:');
    console.error('   - Images: Must end with .jpg');
    console.error('   - Labels: Must end with .txt');
    console.error('   - Names must match between images and labels');
    console.error('\n3. Verify label format:');
    console.error('   - Each .txt file should contain: class_id x y width height');
    console.error('   - All values must be normalized (between 0 and 1)');
    console.error('   - Example: "0 0.5 0.5 0.1 0.2"');
    throw error;
  }
} 