import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const inputPath = path.resolve(__dirname, '../public/images/hero-black-coat.jpg');
const outputPath = path.resolve(__dirname, '../public/images/hero-black-coat-cutout.png');

async function removeBg() {
  try {
    // Read the image and get raw pixel data
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    console.log(`[v0] Image: ${width}x${height}, channels: ${channels}`);

    // Create output buffer with alpha channel
    const output = Buffer.from(data);

    // The background is a light neutral grey/white.
    // We'll make pixels transparent if they're close to white/light-grey
    // and are in the outer region (not inside the garment).
    
    // Strategy: flood-fill from edges to remove the background.
    // Mark pixels as "background" if they're light enough (close to white).
    
    const threshold = 228; // Lightness threshold for considering a pixel as background
    const edgeThreshold = 215; // Slightly more aggressive near edges
    
    // Create a visited array
    const isBackground = new Uint8Array(width * height);
    const queue = [];
    
    // Helper to get pixel index
    const idx = (x, y) => (y * width + x) * channels;
    const pIdx = (x, y) => y * width + x;
    
    // Check if pixel is "light enough" to be background
    const isLight = (x, y, thresh) => {
      const i = idx(x, y);
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      // Check if all channels are above threshold (light pixel)
      // Also check saturation is low (not a colored pixel)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      return r >= thresh && g >= thresh && b >= thresh && saturation < 0.12;
    };
    
    // Seed from all edges
    for (let x = 0; x < width; x++) {
      if (isLight(x, 0, edgeThreshold)) {
        queue.push([x, 0]);
        isBackground[pIdx(x, 0)] = 1;
      }
      if (isLight(x, height - 1, edgeThreshold)) {
        queue.push([x, height - 1]);
        isBackground[pIdx(x, height - 1)] = 1;
      }
    }
    for (let y = 0; y < height; y++) {
      if (isLight(0, y, edgeThreshold)) {
        queue.push([0, y]);
        isBackground[pIdx(0, y)] = 1;
      }
      if (isLight(width - 1, y, edgeThreshold)) {
        queue.push([width - 1, y]);
        isBackground[pIdx(width - 1, y)] = 1;
      }
    }
    
    console.log(`[v0] Starting flood fill with ${queue.length} edge seeds...`);
    
    // BFS flood fill
    const dx = [-1, 1, 0, 0];
    const dy = [0, 0, -1, 1];
    
    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      
      for (let d = 0; d < 4; d++) {
        const nx = cx + dx[d];
        const ny = cy + dy[d];
        
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (isBackground[pIdx(nx, ny)]) continue;
        
        if (isLight(nx, ny, threshold)) {
          isBackground[pIdx(nx, ny)] = 1;
          queue.push([nx, ny]);
        }
      }
    }
    
    // Count background pixels
    let bgCount = 0;
    
    // Apply transparency to background pixels.
    // In the bottom ~18% of the image (shadow zone), preserve partial alpha
    // for background pixels that aren't pure white — these are the ground shadow.
    const shadowStartY = Math.round(height * 0.82);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isBackground[pIdx(x, y)]) {
          const i = idx(x, y);
          
          if (y >= shadowStartY) {
            // Shadow zone: check if pixel is slightly darker than pure white
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = (0.299 * r + 0.587 * g + 0.114 * b);
            
            if (lum < 245) {
              // This is a shadow pixel — keep partial alpha
              // Darker shadow = more opaque
              const shadowStrength = 1.0 - (lum / 255.0);
              output[i + 3] = Math.round(Math.min(shadowStrength * 4.0, 1.0) * 180);
            } else {
              output[i + 3] = 0;
            }
          } else {
            output[i + 3] = 0; // Fully transparent above shadow zone
          }
          bgCount++;
        }
      }
    }
    
    console.log(`[v0] Made ${bgCount} pixels transparent (${((bgCount / (width * height)) * 100).toFixed(1)}% of image)`);
    
    // Apply a slight feather to the edges between background and foreground
    // This creates a softer transition
    const feathered = Buffer.from(output);
    const featherRadius = 2;
    
    for (let y = featherRadius; y < height - featherRadius; y++) {
      for (let x = featherRadius; x < width - featherRadius; x++) {
        const pi = pIdx(x, y);
        const i = idx(x, y);
        
        // Only process foreground pixels near the edge
        if (isBackground[pi]) continue;
        
        // Check if any neighbor is background
        let hasBgNeighbor = false;
        for (let dy2 = -featherRadius; dy2 <= featherRadius && !hasBgNeighbor; dy2++) {
          for (let dx2 = -featherRadius; dx2 <= featherRadius && !hasBgNeighbor; dx2++) {
            if (dx2 === 0 && dy2 === 0) continue;
            const ni = pIdx(x + dx2, y + dy2);
            if (isBackground[ni]) hasBgNeighbor = true;
          }
        }
        
        if (hasBgNeighbor) {
          // Count how many neighbors are background
          let bgNeighbors = 0;
          let totalNeighbors = 0;
          for (let dy2 = -featherRadius; dy2 <= featherRadius; dy2++) {
            for (let dx2 = -featherRadius; dx2 <= featherRadius; dx2++) {
              if (dx2 === 0 && dy2 === 0) continue;
              totalNeighbors++;
              const ni = pIdx(x + dx2, y + dy2);
              if (isBackground[ni]) bgNeighbors++;
            }
          }
          
          // Reduce alpha proportionally
          const ratio = bgNeighbors / totalNeighbors;
          if (ratio > 0.3) {
            const currentAlpha = feathered[i + 3];
            feathered[i + 3] = Math.round(currentAlpha * (1 - ratio * 0.6));
          }
        }
      }
    }
    
    // Save as PNG with transparency
    await sharp(feathered, {
      raw: { width, height, channels: 4 }
    })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);
    
    console.log(`[v0] Saved transparent PNG to ${outputPath}`);
  } catch (error) {
    console.error('[v0] Error:', error);
  }
}

removeBg();
