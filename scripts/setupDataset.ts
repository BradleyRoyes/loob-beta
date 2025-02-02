import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const sourcePublicDir = path.join(projectRoot, 'app', 'public');
const targetPublicDir = path.join(projectRoot, 'public');

function createDirectoryStructure() {
  try {
    console.log('🔍 Checking current setup...');
    
    // Check if public folder is in app directory
    if (fs.existsSync(sourcePublicDir)) {
      console.log('📁 Found public folder in app directory');
      
      // Create new public directory if it doesn't exist
      if (!fs.existsSync(targetPublicDir)) {
        fs.mkdirSync(targetPublicDir);
        console.log('✅ Created new public directory at project root');
      }

      // Move contents
      fs.readdirSync(sourcePublicDir).forEach(item => {
        const sourcePath = path.join(sourcePublicDir, item);
        const targetPath = path.join(targetPublicDir, item);
        
        fs.renameSync(sourcePath, targetPath);
        console.log(`📦 Moved ${item} to root public folder`);
      });

      // Remove old public directory
      fs.rmdirSync(sourcePublicDir);
      console.log('🗑️ Removed old public directory from app folder');
    } else {
      console.log('ℹ️ Public folder already in correct location');
    }

    // Ensure dataset structure exists
    const datasetDir = path.join(targetPublicDir, 'dataset');
    const imagesDir = path.join(datasetDir, 'images');
    const labelsDir = path.join(datasetDir, 'labels');

    [datasetDir, imagesDir, labelsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created ${path.relative(projectRoot, dir)}`);
      }
    });

    console.log('\n✅ Setup complete! Directory structure:');
    console.log(`
${projectRoot}/
├── public/
│   ├── dataset/
│   │   ├── images/    (put your frame_001.jpg, frame_002.jpg here)
│   │   └── labels/    (put your frame_001.txt, frame_002.txt here)
│   ├── fonts/
│   └── other files...
└── app/
    └── ...
`);

  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
}

createDirectoryStructure(); 