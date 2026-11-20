import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
execFileSync(process.execPath, [resolve(root, 'scripts/sync-shared.mjs'), '--check'], {
  stdio: 'inherit',
});
for (const script of [
  'router.js',
  'page-effects.js',
  'poster-gallery.js',
  'about-story.js',
  'scripts/serve.mjs',
  'scripts/sync-shared.mjs',
  'scripts/optimize-images.mjs',
  'scripts/qa.mjs',
]) {
  execFileSync(process.execPath, ['--check', resolve(root, script)], { stdio: 'inherit' });
}
for (const path of ['index.html', 'about/index.html', 'contact/index.html', '404.html']) {
  const html = await readFile(resolve(root, path), 'utf8');
  assert.ok(!/[ \t]+$/m.test(html), path + ' has trailing whitespace');
  assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1, path + ' must have one main heading');
  assert.ok(html.indexOf('<header') < html.indexOf('<main'), path + ' header must be outside main');
  assert.ok(html.includes('class="skip-link"'), path + ' needs skip navigation');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, path + ' has duplicate IDs');
  for (const [, attribute, url] of html.matchAll(/\b(src|href)="([^"#]+)"/g)) {
    if (!url.startsWith('/')) continue;
    let relative = url.split(/[?#]/)[0];
    if (relative.endsWith('/')) relative += 'index.html';
    await access(resolve(root, '.' + relative));
  }
  assert.ok(
    !/data-scroll-container|class="hidden|navigation\.css|fonts\.googleapis|font-awesome/.test(
      html,
    ),
    path + ' contains obsolete integration',
  );
}
const manifest = JSON.parse(await readFile(resolve(root, 'assets/images/manifest.json'), 'utf8'));
for (const image of Object.values(manifest))
  for (const variant of image.variants) await access(resolve(root, '.' + variant.src));
console.log('PASS syntax, shared shell, headings, landmarks, local references and image manifest.');
