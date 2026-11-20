import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const head = (await readFile(root + 'partials/head.html', 'utf8')).trim();
const header = (await readFile(root + 'partials/header.html', 'utf8')).trim();
const routes = [
  ['index.html', 'work'],
  ['about/index.html', 'about'],
  ['contact/index.html', 'contact'],
  ['404.html', 'not-found'],
];
let stale = false;
for (const [path, active] of routes) {
  const original = await readFile(root + path, 'utf8');
  const navigation = header.replace(/\{\{(work|about|contact)-current\}\}/g, (_, name) =>
    name === active ? ' aria-current="page"' : '',
  );
  let result = original;
  for (const [name, content] of [
    ['head', head],
    ['header', navigation],
  ]) {
    const pattern = new RegExp(
      '<!-- shared:' + name + ':start -->[\\s\\S]*?<!-- shared:' + name + ':end -->',
    );
    if (!pattern.test(result)) throw Error('Missing ' + name + ' markers in ' + path);
    result = result.replace(
      pattern,
      '<!-- shared:' + name + ':start -->\n' + content + '\n<!-- shared:' + name + ':end -->',
    );
  }
  if (result !== original) {
    stale = true;
    if (!process.argv.includes('--check')) await writeFile(root + path, result);
  }
}
if (stale && process.argv.includes('--check')) {
  console.error('Shared HTML is stale. Run node scripts/sync-shared.mjs.');
  process.exitCode = 1;
} else
  console.log(
    process.argv.includes('--check') ? 'Shared HTML is in sync.' : 'Shared HTML synchronized.',
  );
