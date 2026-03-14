import sharp from 'sharp';

const inputPath = '/vercel/share/v0-project/public/images/hero-black-coat.jpg';
const outputPath = '/vercel/share/v0-project/public/images/hero-black-coat-cutout.png';

async function removeBg() {
  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height, channels } = info;
    console.log(`Image: ${width}x${height}, channels: ${channels}`);

    const output = Buffer.from(data);

    const threshold = 228;
    const edgeThreshold = 215;

    const isBackground = new Uint8Array(width * height);
    const queue = [];

    const idx = (x, y) => (y * width + x) * channels;
    const pIdx = (x, y) => y * width + x;

    const isLight = (x, y, thresh) => {
      const i = idx(x, y);
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
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

    console.log(`Starting flood fill with ${queue.length} edge seeds...`);

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

    let bgCount = 0;

    // Shadow zone: bottom ~18% of image
    const shadowStartY = Math.round(height * 0.82);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (isBackground[pIdx(x, y)]) {
          const i = idx(x, y);

          if (y >= shadowStartY) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = (0.299 * r + 0.587 * g + 0.114 * b);

            if (lum < 245) {
              // Shadow pixel — preserve partial alpha
              const shadowStrength = 1.0 - (lum / 255.0);
              output[i + 3] = Math.round(Math.min(shadowStrength * 4.0, 1.0) * 180);
            } else {
              output[i + 3] = 0;
            }
          } else {
            output[i + 3] = 0;
          }
          bgCount++;
        }
      }
    }

    console.log(`Made ${bgCount} pixels transparent (${((bgCount / (width * height)) * 100).toFixed(1)}%)`);

    // Feather edges for softer transition
    const feathered = Buffer.from(output);
    const featherRadius = 2;

    for (let y = featherRadius; y < height - featherRadius; y++) {
      for (let x = featherRadius; x < width - featherRadius; x++) {
        const pi = pIdx(x, y);
        const i = idx(x, y);

        if (isBackground[pi]) continue;

        let hasBgNeighbor = false;
        for (let dy2 = -featherRadius; dy2 <= featherRadius && !hasBgNeighbor; dy2++) {
          for (let dx2 = -featherRadius; dx2 <= featherRadius && !hasBgNeighbor; dx2++) {
            if (dx2 === 0 && dy2 === 0) continue;
            if (isBackground[pIdx(x + dx2, y + dy2)]) hasBgNeighbor = true;
          }
        }

        if (hasBgNeighbor) {
          let bgNeighbors = 0;
          let totalNeighbors = 0;
          for (let dy2 = -featherRadius; dy2 <= featherRadius; dy2++) {
            for (let dx2 = -featherRadius; dx2 <= featherRadius; dx2++) {
              if (dx2 === 0 && dy2 === 0) continue;
              totalNeighbors++;
              if (isBackground[pIdx(x + dx2, y + dy2)]) bgNeighbors++;
            }
          }
          const ratio = bgNeighbors / totalNeighbors;
          if (ratio > 0.3) {
            feathered[i + 3] = Math.round(feathered[i + 3] * (1 - ratio * 0.6));
          }
        }
      }
    }

    await sharp(feathered, {
      raw: { width, height, channels: 4 }
    })
      .png({ compressionLevel: 9 })
      .toFile(outputPath);

    console.log(`Saved transparent PNG to ${outputPath}`);
  } catch (error) {
    console.error('Error:', error);
  }
}

removeBg();
