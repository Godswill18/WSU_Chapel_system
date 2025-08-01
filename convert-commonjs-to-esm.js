import fs from 'fs';
import path from 'path';

const backendDir = './Backend'; // Change if your backend folder has a different name

function getAllJsFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllJsFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.js')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Convert module.exports = something -> export default something
  if (/module\.exports\s*=/.test(content)) {
    content = content.replace(/module\.exports\s*=\s*/g, 'export default ');
    updated = true;
  }

  // Convert exports.something = value -> export const something = value
  if (/exports\.[a-zA-Z0-9_$]+\s*=/.test(content)) {
    content = content.replace(/exports\.([a-zA-Z0-9_$]+)\s*=\s*/g, 'export const $1 = ');
    updated = true;
  }

  // Convert require() -> import (basic conversion)
  if (/const\s+\w+\s*=\s*require\(['"].+['"]\)/.test(content)) {
    content = content.replace(/const\s+(\w+)\s*=\s*require\(['"](.+)['"]\)/g, 'import $1 from \'$2\'');
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✔ Converted: ${filePath}`);
  }
}

const files = getAllJsFiles(backendDir);
files.forEach(convertFile);

console.log('✅ CommonJS → ES Modules conversion complete!');
