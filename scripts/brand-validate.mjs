import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import pngjs from 'pngjs';

const { PNG } = pngjs;
const root = process.cwd();
const failures = [];
const requireCheck = (condition, message) => {
  if (!condition) failures.push(message);
};
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const readPng = (file) => {
  const absolute = path.join(root, file);
  requireCheck(fs.existsSync(absolute), `${file} is missing.`);
  if (!fs.existsSync(absolute)) return null;
  try {
    return PNG.sync.read(fs.readFileSync(absolute));
  } catch (error) {
    failures.push(`${file} is not a readable PNG: ${error.message}`);
    return null;
  }
};
const dimensions = (image, width, height, file) =>
  requireCheck(
    image?.width === width && image?.height === height,
    `${file} must be ${width}x${height}.`,
  );
const alphaRange = (image) => {
  if (!image) return { minimum: 255, maximum: 255 };
  let minimum = 255;
  let maximum = 0;
  for (let offset = 3; offset < image.data.length; offset += 4) {
    minimum = Math.min(minimum, image.data[offset]);
    maximum = Math.max(maximum, image.data[offset]);
  }
  return { minimum, maximum };
};
const contentBounds = (image) => {
  if (!image) return null;
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.data[(y * image.width + x) * 4 + 3] === 0) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  return { left, top, right, bottom };
};

const app = readJson('app.json').expo;
const expected = {
  icon: './assets/brand/app-icon.png',
  foreground: './assets/brand/adaptive-icon-foreground.png',
  monochrome: './assets/brand/adaptive-icon-monochrome.png',
  splash: './assets/brand/splash-icon.png',
};
requireCheck(app.icon === expected.icon, 'Expo icon must reference the POS app icon.');
requireCheck(
  app.android?.adaptiveIcon?.foregroundImage === expected.foreground,
  'Expo adaptive foreground path is incorrect.',
);
requireCheck(
  app.android?.adaptiveIcon?.monochromeImage === expected.monochrome,
  'Expo monochrome icon path is incorrect or unsupported.',
);
requireCheck(
  app.android?.adaptiveIcon?.backgroundColor === '#302344',
  'Expo adaptive background must use premium violet #302344.',
);
requireCheck(app.splash?.image === expected.splash, 'Expo splash path is incorrect.');
for (const file of Object.values(expected))
  requireCheck(fs.existsSync(path.join(root, file)), `Expo references missing file ${file}.`);

const appIcon = readPng('assets/brand/app-icon.png');
dimensions(appIcon, 1024, 1024, 'assets/brand/app-icon.png');
requireCheck(alphaRange(appIcon).minimum === 255, 'The iOS/general icon must be fully opaque.');

const foreground = readPng('assets/brand/adaptive-icon-foreground.png');
dimensions(foreground, 1024, 1024, 'assets/brand/adaptive-icon-foreground.png');
const foregroundAlpha = alphaRange(foreground);
requireCheck(
  foregroundAlpha.minimum === 0 && foregroundAlpha.maximum === 255,
  'The adaptive foreground must contain transparent and opaque pixels.',
);
const foregroundBounds = contentBounds(foreground);
requireCheck(
  foregroundBounds &&
    foregroundBounds.left >= 190 &&
    foregroundBounds.top >= 190 &&
    foregroundBounds.right <= 833 &&
    foregroundBounds.bottom <= 833,
  'Adaptive foreground content must remain inside the documented conservative safe zone (190...833).',
);

const monochrome = readPng('assets/brand/adaptive-icon-monochrome.png');
dimensions(monochrome, 1024, 1024, 'assets/brand/adaptive-icon-monochrome.png');
requireCheck(
  alphaRange(monochrome).minimum === 0,
  'The monochrome icon must have a transparent background.',
);
const monochromeColors = new Set();
if (monochrome) {
  for (let offset = 0; offset < monochrome.data.length; offset += 4) {
    if (monochrome.data[offset + 3] > 0)
      monochromeColors.add(
        `${monochrome.data[offset]},${monochrome.data[offset + 1]},${monochrome.data[offset + 2]}`,
      );
  }
}
requireCheck(monochromeColors.size === 1, 'The monochrome icon must use one RGB color only.');

const splash = readPng('assets/brand/splash-icon.png');
dimensions(splash, 1024, 1024, 'assets/brand/splash-icon.png');
requireCheck(
  alphaRange(splash).minimum === 0,
  'The splash mark must preserve transparent surrounding space.',
);

const rasterMaster = readPng('assets/brand/source/pos-app-icon-master.png');
requireCheck(
  rasterMaster && rasterMaster.width >= 1024 && rasterMaster.height >= 1024,
  'The raster master must be at least 1024x1024.',
);

for (const size of [256, 128, 64, 48, 32]) {
  const file = `assets/brand/review/app-icon-${size}.png`;
  dimensions(readPng(file), size, size, file);
}

for (const file of [
  'assets/brand/source/pos-mark.svg',
  'assets/brand/source/pos-monochrome-mark.svg',
]) {
  requireCheck(fs.existsSync(path.join(root, file)), `${file} is missing.`);
}
const welcome = path.join(root, 'src/design-system/illustrations/assets/auth/welcome.png');
const master = path.join(root, 'assets/brand/source/pos-app-icon-master.png');
if (fs.existsSync(welcome) && fs.existsSync(master)) {
  const hash = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  requireCheck(
    hash(welcome) !== hash(master),
    'The icon raster master must not reuse the complete welcome illustration.',
  );
}
requireCheck(
  !JSON.stringify(app).includes('welcome.png'),
  'Expo configuration must not ship the Authentication welcome illustration as native branding.',
);
requireCheck(
  !fs.existsSync(path.join(root, 'ios')),
  'A native ios directory must not be generated.',
);
requireCheck(
  !fs.existsSync(path.join(root, 'android')),
  'A native android directory must not be generated.',
);
requireCheck(
  app.name === 'POS' && app.slug === 'personal-operating-system' && app.scheme === 'pos',
  'POS name, slug, and scheme must remain unchanged.',
);
requireCheck(
  app.ios?.bundleIdentifier === 'com.personaloperatingsystem.mobile',
  'iOS bundle identifier must remain unchanged.',
);
requireCheck(
  app.android?.package === 'com.personaloperatingsystem.mobile',
  'Android package must remain unchanged.',
);
requireCheck(
  app.extra?.eas?.projectId === '7eda4110-a762-4d91-b02e-646e9ff2c1fa',
  'EAS project linkage must remain unchanged.',
);

if (failures.length) {
  for (const failure of failures) process.stderr.write(`FAIL: ${failure}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('POS native brand assets and Expo references are valid.\n');
}
