const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SOURCE_DIR = path.join(ROOT_DIR, 'ais');
const TARGET_DIR = path.join(ROOT_DIR, 'AIS');

const DIRECTORIES_TO_COPY = [
  'reports',
  'memory',
  'governance',
  'aggregate',
  'snapshots',
  'history'
];

function copyFolderRecursiveSync(source, target) {
  let files = [];

  // Check if folder needs to be created or written
  const targetFolder = target;
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Copy
  if (fs.lstatSync(source).isDirectory()) {
    files = fs.readdirSync(source);
    files.forEach(function (file) {
      const curSource = path.join(source, file);
      const curTarget = path.join(targetFolder, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        copyFolderRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    });
  }
}

function runRestructuring() {
  console.log('=== Restructuring AIS Folders for Export ===');
  
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  DIRECTORIES_TO_COPY.forEach(dir => {
    const srcPath = path.join(SOURCE_DIR, dir);
    const destPath = path.join(TARGET_DIR, dir);

    if (fs.existsSync(srcPath)) {
      console.log(`Copying ${dir} to AIS/${dir}...`);
      copyFolderRecursiveSync(srcPath, destPath);
      console.log(`✓ Synchronized ${dir}`);
    } else {
      console.log(`⚠️ Source folder not found: ${srcPath}`);
    }
  });

  console.log('=== Restructuring completed successfully ===');
}

runRestructuring();
