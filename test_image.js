import fs from 'fs';
import path from 'path';

const imagePath = 'c:/Users/David/Desktop/QOUTA HIRE/public/images/login_human_3d.png';

try {
  const stats = fs.statSync(imagePath);
  console.log(`File exists. Size: ${stats.size} bytes`);
  
  const fd = fs.openSync(imagePath, 'r');
  const buffer = Buffer.alloc(8);
  fs.readSync(fd, buffer, 0, 8, 0);
  fs.closeSync(fd);
  
  // PNG header check
  const isPng = buffer.toString('hex') === '89504e470d0a1a0a';
  console.log(`Is valid PNG header: ${isPng} (${buffer.toString('hex')})`);
} catch (err) {
  console.error('Error reading file:', err);
}
