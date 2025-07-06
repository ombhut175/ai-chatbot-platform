const fs = require('fs');
const path = require('path');

// Function to delete directory recursively
function deleteFolderRecursive(directoryPath) {
  if (fs.existsSync(directoryPath)) {
    fs.readdirSync(directoryPath).forEach((file) => {
      const curPath = path.join(directoryPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(directoryPath);
  }
}

// Clear .next directory
const nextDir = path.join(process.cwd(), '.next');
console.log('Clearing Next.js build cache...');
deleteFolderRecursive(nextDir);
console.log('✅ Next.js cache cleared');

// Clear node_modules/.cache if it exists
const nodeModulesCache = path.join(process.cwd(), 'node_modules', '.cache');
if (fs.existsSync(nodeModulesCache)) {
  console.log('Clearing node_modules cache...');
  deleteFolderRecursive(nodeModulesCache);
  console.log('✅ Node modules cache cleared');
}

console.log('\n🎉 All caches cleared successfully!');
console.log('Run "npm run dev" to start with fresh cache.');
