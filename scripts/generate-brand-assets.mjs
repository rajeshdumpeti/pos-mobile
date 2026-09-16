import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import pngjs from 'pngjs';

const { PNG } = pngjs;
const root = process.cwd();
const brand = path.join(root, 'assets/brand');
const sourcePath = path.join(brand, 'source/pos-app-icon-master.png');
const source = PNG.sync.read(fs.readFileSync(sourcePath));

const output = (width, height) => new PNG({ width, height, colorType: 6 });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function sample(image, x, y) {
  const x0 = clamp(Math.floor(x), 0, image.width - 1);
  const y0 = clamp(Math.floor(y), 0, image.height - 1);
  const x1 = Math.min(x0 + 1, image.width - 1);
  const y1 = Math.min(y0 + 1, image.height - 1);
  const tx = x - Math.floor(x);
  const ty = y - Math.floor(y);
  const rgba = [0, 0, 0, 0];
  for (const [px, py, weight] of [
    [x0, y0, (1 - tx) * (1 - ty)],
    [x1, y0, tx * (1 - ty)],
    [x0, y1, (1 - tx) * ty],
    [x1, y1, tx * ty],
  ]) {
    const offset = (py * image.width + px) * 4;
    for (let channel = 0; channel < 4; channel += 1) {
      rgba[channel] += image.data[offset + channel] * weight;
    }
  }
  return rgba.map(Math.round);
}

function setPixel(image, x, y, rgba) {
  const offset = (y * image.width + x) * 4;
  image.data[offset] = rgba[0];
  image.data[offset + 1] = rgba[1];
  image.data[offset + 2] = rgba[2];
  image.data[offset + 3] = rgba[3];
}

function blendPixel(image, x, y, rgba) {
  const offset = (y * image.width + x) * 4;
  const sourceAlpha = rgba[3] / 255;
  const destinationAlpha = image.data[offset + 3] / 255;
  const alpha = sourceAlpha + destinationAlpha * (1 - sourceAlpha);
  if (alpha === 0) return;
  for (let channel = 0; channel < 3; channel += 1) {
    image.data[offset + channel] = Math.round(
      (rgba[channel] * sourceAlpha +
        image.data[offset + channel] * destinationAlpha * (1 - sourceAlpha)) /
        alpha,
    );
  }
  image.data[offset + 3] = Math.round(alpha * 255);
}

function resize(image, width, height) {
  const target = output(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      setPixel(
        target,
        x,
        y,
        sample(
          image,
          ((x + 0.5) * image.width) / width - 0.5,
          ((y + 0.5) * image.height) / height - 0.5,
        ),
      );
    }
  }
  return target;
}

const segments = [];
const addLine = (start, end) => segments.push([start, end]);
const addCubic = (start, controlA, controlB, end, steps = 24) => {
  let previous = start;
  for (let step = 1; step <= steps; step += 1) {
    const t = step / steps;
    const inverse = 1 - t;
    const point = [
      inverse ** 3 * start[0] +
        3 * inverse ** 2 * t * controlA[0] +
        3 * inverse * t ** 2 * controlB[0] +
        t ** 3 * end[0],
      inverse ** 3 * start[1] +
        3 * inverse ** 2 * t * controlA[1] +
        3 * inverse * t ** 2 * controlB[1] +
        t ** 3 * end[1],
    ];
    addLine(previous, point);
    previous = point;
  }
};

addLine([265, 630], [265, 402]);
addLine([265, 402], [335, 402]);
addCubic([335, 402], [371, 402], [390, 422], [390, 458]);
addCubic([390, 458], [390, 494], [371, 516], [335, 516]);
addLine([335, 516], [265, 516]);

let ellipsePrevious = [565, 512];
for (let step = 1; step <= 64; step += 1) {
  const angle = (step / 64) * Math.PI * 2;
  const point = [500 + Math.cos(angle) * 65, 512 + Math.sin(angle) * 112];
  addLine(ellipsePrevious, point);
  ellipsePrevious = point;
}

addCubic([762, 416], [730, 392], [678, 391], [650, 420]);
addCubic([650, 420], [620, 451], [638, 484], [676, 493]);
addCubic([676, 493], [710, 501], [752, 503], [763, 537]);
addCubic([763, 537], [776, 574], [744, 620], [698, 625]);
addCubic([698, 625], [661, 628], [632, 612], [614, 593]);

function segmentDistance(x, y, [start, end]) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  const projection =
    lengthSquared === 0
      ? 0
      : clamp(((x - start[0]) * dx + (y - start[1]) * dy) / lengthSquared, 0, 1);
  return Math.hypot(x - (start[0] + projection * dx), y - (start[1] + projection * dy));
}

function markDistance(x, y, scale = 1, offsetX = 0, offsetY = 0) {
  const sourceX = (x - offsetX) / scale;
  const sourceY = (y - offsetY) / scale;
  return (
    (Math.min(...segments.map((segment) => segmentDistance(sourceX, sourceY, segment))) - 22) *
    scale
  );
}

function compositeMark(image, { scale = 1, offsetX = 0, offsetY = 0, monochrome = false } = {}) {
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const distance = markDistance(x + 0.5, y + 0.5, scale, offsetX, offsetY);
      if (!monochrome && distance > 10) continue;
      if (monochrome && distance > 0) continue;
      if (monochrome) {
        blendPixel(image, x, y, [255, 255, 255, 255]);
        continue;
      }
      if (distance > 0) {
        blendPixel(image, x, y, [205, 145, 255, Math.round((1 - distance / 10) * 72)]);
      } else {
        const vertical = clamp((y - (375 * scale + offsetY)) / (275 * scale), 0, 1);
        blendPixel(image, x, y, [255, Math.round(248 - vertical * 35), 255, 255]);
      }
    }
  }
}

function circularOrb(diameter) {
  const target = output(1024, 1024);
  const left = (1024 - diameter) / 2;
  const top = (1024 - diameter) / 2;
  const sourceLeft = source.width * 0.145;
  const sourceTop = source.height * 0.11;
  const sourceSize = source.width * 0.71;
  for (let y = Math.floor(top - 2); y < Math.ceil(top + diameter + 2); y += 1) {
    for (let x = Math.floor(left - 2); x < Math.ceil(left + diameter + 2); x += 1) {
      const distance = Math.hypot(x + 0.5 - 512, y + 0.5 - 512);
      if (distance > diameter / 2 + 1) continue;
      const rgba = sample(
        source,
        sourceLeft + ((x + 0.5 - left) / diameter) * sourceSize,
        sourceTop + ((y + 0.5 - top) / diameter) * sourceSize,
      );
      rgba[3] = Math.round(clamp(diameter / 2 + 1 - distance, 0, 1) * 255);
      setPixel(target, x, y, rgba);
    }
  }
  return target;
}

function monochromeAsset() {
  const target = output(1024, 1024);
  const innerRadius = 266;
  const outerRadius = 322;
  for (let y = 0; y < 1024; y += 1) {
    for (let x = 0; x < 1024; x += 1) {
      const radius = Math.hypot(x + 0.5 - 512, y + 0.5 - 512);
      if (radius >= innerRadius && radius <= outerRadius)
        setPixel(target, x, y, [255, 255, 255, 255]);
    }
  }
  compositeMark(target, { scale: 0.82, offsetX: 92.16, offsetY: 92.16, monochrome: true });
  return target;
}

function write(relativePath, image) {
  const destination = path.join(brand, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, PNG.sync.write(image, { colorType: 6 }));
}

const appIcon = resize(source, 1024, 1024);
compositeMark(appIcon);
write('app-icon.png', appIcon);

const adaptive = circularOrb(620);
compositeMark(adaptive);
write('adaptive-icon-foreground.png', adaptive);
write('adaptive-icon-monochrome.png', monochromeAsset());

const splash = circularOrb(560);
compositeMark(splash, { scale: 0.9, offsetX: 51.2, offsetY: 51.2 });
write('splash-icon.png', splash);

for (const size of [256, 128, 64, 48, 32])
  write(`review/app-icon-${size}.png`, resize(appIcon, size, size));

process.stdout.write('Generated POS native brand assets and individual review sizes.\n');
