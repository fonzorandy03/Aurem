import fs from 'fs';
import path from 'path';

// Check various possible paths
const candidates = [
  '/vercel/share/v0-project/public/images/hero-black-coat.jpg',
  '/home/user/public/images/hero-black-coat.jpg',
  '/home/public/images/hero-black-coat.jpg',
  './public/images/hero-black-coat.jpg',
  '../public/images/hero-black-coat.jpg',
];

console.log('CWD:', process.cwd());
console.log('__dirname equivalent:', path.dirname(new URL(import.meta.url).pathname));
console.log('');

for (const p of candidates) {
  const abs = path.resolve(p);
  console.log(`${fs.existsSync(abs) ? 'FOUND' : 'MISS '} ${abs}`);
}

// Also try listing the images directory from various roots
const imgDirs = [
  '/vercel/share/v0-project/public/images',
  '/home/user/public/images',
  '/home/public/images',
  './public/images',
];

console.log('');
for (const d of imgDirs) {
  const abs = path.resolve(d);
  if (fs.existsSync(abs)) {
    const files = fs.readdirSync(abs);
    console.log(`DIR ${abs}: ${files.join(', ')}`);
  } else {
    console.log(`NODIR ${abs}`);
  }
}
