import fs from 'fs';
import path from 'path';

const backendDir = './Backend';

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

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Find import statements without .js extension
  const regex = /import\s+.*?from\s+['"](\..+?)(?<!\.js)['"]/g;
  content = content.replace(regex, (match, p1) => {
    updated = true;
    return match.replace(p1, `${p1}.js`);
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✔ Fixed imports: ${filePath}`);
  }
}

const files = getAllJsFiles(backendDir);
files.forEach(fixImports);

console.log('✅ Added .js extensions to imports!');
