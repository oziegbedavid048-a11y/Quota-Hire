const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walk(dirPath, callback) : 
      (dirPath.endsWith('.tsx') && callback(dirPath));
  });
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Text sizes
  content = content.replace(/text-5xl/g, 'text-3xl md:text-4xl');
  content = content.replace(/text-4xl/g, 'text-2xl md:text-3xl');
  content = content.replace(/text-3xl/g, 'text-xl md:text-2xl');
  
  // Button padding
  content = content.replace(/px-8 py-3\.5/g, 'px-6 py-2.5 text-sm');
  content = content.replace(/px-8 py-3/g, 'px-6 py-2.5 text-sm');
  content = content.replace(/py-4 px-8 text-lg/g, 'px-6 py-2.5 text-base');
  
  // Card padding
  content = content.replace(/p-8 md:p-12/g, 'p-6 md:p-8');
  content = content.replace(/p-6 md:p-10/g, 'p-5 md:p-8');
  content = content.replace(/p-12 text-center/g, 'p-8 text-center');

  // Fix 3D illustration in Dashboard
  content = content.replace(/hidden md:block relative w-64 h-64 shrink-0/g, 'block relative w-40 h-40 md:w-56 md:h-56 shrink-0 mx-auto md:mx-0 mt-6 md:mt-0');

  // Any other illustration hidden on mobile
  content = content.replace(/hidden md:flex relative/g, 'flex relative w-full justify-center md:justify-end mt-6 md:mt-0');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

walk(path.join(__dirname, 'src', 'pages'), processFile);
walk(path.join(__dirname, 'src', 'components'), processFile);

console.log('Layout scaling complete.');
