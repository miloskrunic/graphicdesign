import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Development-only tool; the generated images are served as ordinary static files.
const require = createRequire(
  process.env.ASSET_MODULE_ROOT
    ? resolve(process.env.ASSET_MODULE_ROOT, 'package.json')
    : import.meta.url,
);
const sharp = require('sharp');
const root = fileURLToPath(new URL('../', import.meta.url));
const destination = resolve(root, 'assets/images');
await mkdir(destination, { recursive: true });
const manifest = {};
for (const id of ['1', '2', '3', '4', '5', '6', '11', '22', '33', '44', '55', '66', 'myself1']) {
  const source = resolve(root, `${id}.${id === 'myself1' ? 'png' : 'jpg'}`);
  const metadata = await sharp(source).metadata();
  const candidates = [
    ...new Set(
      [320, 640, 960, 1600]
        .filter((width) => width < metadata.width)
        .concat(Math.min(metadata.width, 1600)),
    ),
  ].sort((a, b) => a - b);
  const variants = [];
  for (const width of candidates) {
    const name = `${id}-${width}.webp`;
    const info = await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 84, effort: 6 })
      .toFile(resolve(destination, name));
    variants.push({
      src: `/assets/images/${name}`,
      width: info.width,
      height: info.height,
      bytes: info.size,
    });
  }
  manifest[id] = {
    original: '/' + source.split(/[\\/]/).pop(),
    width: metadata.width,
    height: metadata.height,
    bytes: (await stat(source)).size,
    variants,
  };
}
await writeFile(
  resolve(root, 'assets/images/manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    originalGalleryBytes: Object.entries(manifest)
      .filter(([id]) => id !== 'myself1')
      .reduce((n, [, image]) => n + image.bytes, 0),
    gallery640Bytes: Object.entries(manifest)
      .filter(([id]) => id !== 'myself1')
      .reduce((n, [, image]) => n + image.variants.find((v) => v.width === 640).bytes, 0),
  }),
);
