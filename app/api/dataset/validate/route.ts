import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  details?: any;
  code?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  stats: {
    totalImages: number;
    totalLabels: number;
    imageResolutions: { width: number; height: number }[];
    averageFileSize: number;
  };
  files?: {
    images: string[];
    labels: string[];
  };
  debug?: {
    paths?: {
      publicDir: string;
      datasetDir: string;
      imagesDir: string;
      labelsDir: string;
    };
    dirExists?: {
      public: boolean;
      dataset: boolean;
      images: boolean;
      labels: boolean;
    };
  };
}

async function validateImage(imagePath: string): Promise<{ isValid: boolean; error?: string; metadata?: any }> {
  try {
    console.log('Validating image:', imagePath);
    const metadata = await sharp(imagePath).metadata();
    if (!metadata.width || !metadata.height) {
      console.error('Invalid image dimensions:', imagePath, metadata);
      return { isValid: false, error: 'Invalid image dimensions' };
    }
    return { isValid: true, metadata };
  } catch (error) {
    console.error('Image validation error:', imagePath, error);
    return { isValid: false, error: error.message };
  }
}

function validateLabel(labelPath: string): { isValid: boolean; error?: string } {
  try {
    console.log('Validating label:', labelPath);
    const content = fs.readFileSync(labelPath, 'utf-8').trim();
    const lines = content.split('\n');
    
    if (lines.length === 0) {
      console.error('Empty label file:', labelPath);
      return { isValid: false, error: 'Empty label file' };
    }

    for (const line of lines) {
      const values = line.trim().split(' ').map(Number);
      if (values.length !== 5) {
        console.error('Invalid label format (wrong number of values):', labelPath, line);
        return { isValid: false, error: 'Invalid label format: must have 5 values per line' };
      }
      if (values.some(v => isNaN(v))) {
        console.error('Invalid label format (non-numeric values):', labelPath, line);
        return { isValid: false, error: 'Invalid label format: all values must be numbers' };
      }
      const [classId, x, y, w, h] = values;
      if (x < 0 || x > 1 || y < 0 || y > 1 || w < 0 || w > 1 || h < 0 || h > 1) {
        console.error('Invalid label coordinates:', labelPath, values);
        return { isValid: false, error: 'Invalid label format: coordinates must be normalized (0-1)' };
      }
    }
    return { isValid: true };
  } catch (error) {
    console.error('Label validation error:', labelPath, error);
    return { isValid: false, error: error.message };
  }
}

export async function GET() {
  console.log('Starting dataset validation');
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const datasetDir = path.join(publicDir, 'dataset');
    const imagesDir = path.join(datasetDir, 'images');
    const labelsDir = path.join(datasetDir, 'labels');

    console.log('Checking directories:', {
      publicDir,
      datasetDir,
      imagesDir,
      labelsDir
    });

    const validationResult: ValidationResult = {
      isValid: true,
      errors: [],
      stats: {
        totalImages: 0,
        totalLabels: 0,
        imageResolutions: [],
        averageFileSize: 0
      },
      files: {
        images: [],
        labels: []
      },
      debug: {
        paths: {
          publicDir,
          datasetDir,
          imagesDir,
          labelsDir
        },
        dirExists: {
          public: fs.existsSync(publicDir),
          dataset: fs.existsSync(datasetDir),
          images: fs.existsSync(imagesDir),
          labels: fs.existsSync(labelsDir)
        }
      }
    };

    // Check directory existence
    [
      { dir: publicDir, name: 'public' },
      { dir: datasetDir, name: 'dataset' },
      { dir: imagesDir, name: 'images' },
      { dir: labelsDir, name: 'labels' }
    ].forEach(({ dir, name }) => {
      if (!fs.existsSync(dir)) {
        console.error(`Directory not found: ${name} (${dir})`);
        validationResult.errors.push({
          type: 'error',
          message: `Directory not found: ${name}`,
          details: { path: dir },
          code: 'DIR_NOT_FOUND'
        });
        validationResult.isValid = false;
      }
    });

    if (!validationResult.isValid) {
      console.log('Validation failed due to missing directories:', validationResult);
      return NextResponse.json(validationResult);
    }

    // Get file listings
    console.log('Reading directory contents');
    const imageFiles = fs.readdirSync(imagesDir)
      .filter(f => f.endsWith('.jpg') && !f.startsWith('.'));
    const labelFiles = fs.readdirSync(labelsDir)
      .filter(f => f.endsWith('.txt') && !f.startsWith('.'));

    console.log('File counts:', {
      images: imageFiles.length,
      labels: labelFiles.length
    });

    validationResult.stats.totalImages = imageFiles.length;
    validationResult.stats.totalLabels = labelFiles.length;
    validationResult.files = {
      images: imageFiles,
      labels: labelFiles
    };

    // Check file count match
    if (imageFiles.length !== labelFiles.length) {
      validationResult.errors.push({
        type: 'error',
        message: `File count mismatch: ${imageFiles.length} images vs ${labelFiles.length} labels`,
        code: 'COUNT_MISMATCH'
      });
      validationResult.isValid = false;
    }

    // Validate each image and its corresponding label
    let totalSize = 0;
    for (const imageFile of imageFiles) {
      const baseName = path.basename(imageFile, '.jpg');
      const labelFile = `${baseName}.txt`;
      const imagePath = path.join(imagesDir, imageFile);
      const labelPath = path.join(labelsDir, labelFile);

      // Check if label exists
      if (!fs.existsSync(labelPath)) {
        console.error(`Missing label for image: ${imageFile}`);
        validationResult.errors.push({
          type: 'error',
          message: `Missing label for image: ${imageFile}`,
          details: { imagePath, expectedLabelPath: labelPath },
          code: 'MISSING_LABEL'
        });
        validationResult.isValid = false;
        continue;
      }

      // Validate image
      const imageValidation = await validateImage(imagePath);
      if (!imageValidation.isValid) {
        validationResult.errors.push({
          type: 'error',
          message: `Invalid image ${imageFile}: ${imageValidation.error}`,
          details: { path: imagePath, error: imageValidation.error },
          code: 'INVALID_IMAGE'
        });
        validationResult.isValid = false;
      } else if (imageValidation.metadata) {
        validationResult.stats.imageResolutions.push({
          width: imageValidation.metadata.width,
          height: imageValidation.metadata.height
        });
      }

      // Validate label
      const labelValidation = validateLabel(labelPath);
      if (!labelValidation.isValid) {
        validationResult.errors.push({
          type: 'error',
          message: `Invalid label ${labelFile}: ${labelValidation.error}`,
          details: { path: labelPath, error: labelValidation.error },
          code: 'INVALID_LABEL'
        });
        validationResult.isValid = false;
      }

      // Calculate average file size
      const stats = fs.statSync(imagePath);
      totalSize += stats.size;
    }

    validationResult.stats.averageFileSize = totalSize / imageFiles.length;

    console.log('Validation completed:', validationResult);
    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Validation failed with error:', error);
    return NextResponse.json({
      isValid: false,
      errors: [{
        type: 'error',
        message: 'Validation failed',
        details: {
          error: error.message,
          stack: error.stack
        },
        code: 'VALIDATION_ERROR'
      }],
      stats: null,
      debug: {
        error: {
          message: error.message,
          stack: error.stack
        }
      }
    }, { status: 500 });
  }
} 