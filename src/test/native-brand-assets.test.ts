import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import pngjs from 'pngjs';

const { PNG } = pngjs;
const root = path.resolve(__dirname, '../..');
const json = (file: string) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const png = (file: string) => PNG.sync.read(fs.readFileSync(path.join(root, file)));
const alphaRange = (image: InstanceType<typeof PNG>) => {
  let minimum = 255;
  let maximum = 0;
  for (let offset = 3; offset < image.data.length; offset += 4) {
    const alpha = image.data[offset] ?? 0;
    minimum = Math.min(minimum, alpha);
    maximum = Math.max(maximum, alpha);
  }
  return { minimum, maximum };
};

test('repository brand validator accepts the committed source and derived assets', () => {
  expect(() =>
    execFileSync(process.execPath, ['scripts/brand-validate.mjs'], { cwd: root }),
  ).not.toThrow();
});

test('resolved Expo inputs preserve identity and use separate platform assets', () => {
  const configured = json('app.json').expo;
  const app = JSON.parse(
    execFileSync(
      path.join(root, 'node_modules/.bin/expo'),
      ['config', '--type', 'public', '--json'],
      { cwd: root, encoding: 'utf8' },
    ),
  );
  expect(app).toMatchObject({
    name: 'POS',
    slug: 'personal-operating-system',
    scheme: 'pos',
    icon: './assets/brand/app-icon.png',
    ios: { bundleIdentifier: 'com.personaloperatingsystem.mobile' },
    android: {
      package: 'com.personaloperatingsystem.mobile',
      adaptiveIcon: {
        foregroundImage: './assets/brand/adaptive-icon-foreground.png',
        monochromeImage: './assets/brand/adaptive-icon-monochrome.png',
        backgroundColor: '#302344',
      },
    },
    extra: { eas: { projectId: '7eda4110-a762-4d91-b02e-646e9ff2c1fa' } },
  });
  expect(app.plugins).toContainEqual([
    'expo-splash-screen',
    {
      image: './assets/brand/splash-icon.png',
      backgroundColor: '#F4F3EF',
      resizeMode: 'contain',
      enableFullScreenImage_legacy: true,
    },
  ]);
  expect(app.ios.infoPlist.ITSAppUsesNonExemptEncryption).toBe(false);
  expect(JSON.stringify(app)).not.toContain('welcome.png');
  expect(configured.icon).toBe(app.icon);
});

test('native raster assets have platform-correct dimensions and alpha', () => {
  const appIcon = png('assets/brand/app-icon.png');
  const foreground = png('assets/brand/adaptive-icon-foreground.png');
  const monochrome = png('assets/brand/adaptive-icon-monochrome.png');
  const splash = png('assets/brand/splash-icon.png');
  for (const image of [appIcon, foreground, monochrome, splash]) {
    expect([image.width, image.height]).toEqual([1024, 1024]);
  }
  expect(alphaRange(appIcon)).toEqual({ minimum: 255, maximum: 255 });
  expect(alphaRange(foreground)).toEqual({ minimum: 0, maximum: 255 });
  expect(alphaRange(monochrome).minimum).toBe(0);
  expect(alphaRange(splash).minimum).toBe(0);
  const colors = new Set<string>();
  for (let offset = 0; offset < monochrome.data.length; offset += 4) {
    if ((monochrome.data[offset + 3] ?? 0) > 0)
      colors.add(
        `${monochrome.data[offset]},${monochrome.data[offset + 1]},${monochrome.data[offset + 2]}`,
      );
  }
  expect([...colors]).toEqual(['255,255,255']);
});

test.each([256, 128, 64, 48, 32])('review export is exactly %d pixels', (size) => {
  const image = png(`assets/brand/review/app-icon-${size}.png`);
  expect([image.width, image.height]).toEqual([size, size]);
});

test('branding creates no native project and retains separate source models', () => {
  expect(fs.existsSync(path.join(root, 'ios'))).toBe(false);
  expect(fs.existsSync(path.join(root, 'android'))).toBe(false);
  expect(fs.existsSync(path.join(root, 'assets/brand/source/pos-app-icon-master.png'))).toBe(true);
  expect(fs.readFileSync(path.join(root, 'assets/brand/source/pos-mark.svg'), 'utf8')).toContain(
    'POS geometric word mark',
  );
  expect(
    fs.readFileSync(path.join(root, 'assets/brand/source/pos-monochrome-mark.svg'), 'utf8'),
  ).toContain('single-color');
});
