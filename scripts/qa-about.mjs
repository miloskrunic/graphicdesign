import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Reuse installed QA dependencies; this script never downloads a browser.
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(
  process.env.QA_MODULE_ROOT
    ? resolve(process.env.QA_MODULE_ROOT, 'package.json')
    : import.meta.url,
);
const { chromium } = require('playwright-core');
const axePath = require.resolve('axe-core/axe.min.js');
const base = (process.env.QA_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const out = resolve(process.env.QA_OUTPUT || resolve(root, 'docs/qa-about'));
const chapterIds = ['my-story', 'education', 'experience', 'technologies'];
const approvedBiography = [
  "My interest in graphic design started in childhood. My father worked as a photographer, so I grew up around photographs of landscapes and people.",
  "As I started making my own designs, I found myself drawn to minimalism, bold symbols and strong colour combinations.",
  "Web development became the ideal meeting point between those interests: programming logic, aesthetics and design. It brought the technical and creative parts of my work together.",
];
const expectedSocials = [
  'https://instagram.com/krunicc',
  'https://linkedin.com/in/milos-krunic',
  'https://github.com/miloskrunic',
];
const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 844, height: 390 },
];
const results = [],
  errors = [],
  httpErrors = [],
  accessibility = [];
const normalize = (value) => value.normalize('NFC').replace(/\s+/g, ' ').trim();
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const browserVersion = browser.version();

async function check(name, action) {
  try {
    const detail = await action();
    results.push({ name, passed: true, ...(detail ? { detail } : {}) });
    console.log('PASS ' + name);
  } catch (error) {
    results.push({ name, passed: false, error: error.stack });
    console.log('FAIL ' + name + ': ' + error.message);
  }
}
function observe(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400) {
      httpErrors.push({ url: response.url(), status: response.status() });
    }
  });
}
async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Offscreen lazy Home images deliberately remain unfetched during route tests.
    await Promise.all(
      [...document.images]
        .filter((image) => image.complete || image.loading !== 'lazy')
        .map((image) => image.decode().catch(() => {})),
    );
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  await page.waitForTimeout(120);
}
async function ready(page, name = 'about') {
  await page.waitForFunction(
    (name) =>
      document.body.dataset.page === name &&
      history.scrollRestoration === 'manual' &&
      !document.documentElement.hasAttribute('aria-busy'),
    name,
  );
  if (name === 'about') await page.locator('main.about-page[data-page="about"]').waitFor();
  await settle(page);
}
async function openAbout(page, suffix = '') {
  const response = await page.goto(base + '/about/' + suffix, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200);
  await ready(page);
}
async function noOverflow(page) {
  const state = await page.evaluate(() => ({
    viewport: innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
    brokenImages: [...document.images]
      .filter((image) => !image.complete || !image.naturalWidth)
      .map((image) => image.currentSrc || image.src),
  }));
  assert.ok(state.document <= state.viewport + 1, JSON.stringify(state));
  assert.ok(state.body <= state.viewport + 1, JSON.stringify(state));
  assert.deepEqual(state.brokenImages, []);
  return state;
}
async function readable(page) {
  for (const id of chapterIds) {
    const status = await page.locator('#' + id).evaluate((section) => {
      const style = getComputedStyle(section);
      return {
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        height: section.getBoundingClientRect().height,
        text: section.textContent.trim(),
      };
    });
    assert.notEqual(status.display, 'none', id);
    assert.notEqual(status.visibility, 'hidden', id);
    assert.ok(Number(status.opacity) > 0, id);
    assert.ok(status.height > 0 && status.text.length > 20, id);
  }
}
async function facts(page) {
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(
    normalize(await page.locator('.about-intro h1#about-title').textContent()),
    'Biography',
  );
  assert.equal(await page.locator('.about-story[data-about-story]').count(), 1);
  assert.equal(await page.locator('aside.about-rail > nav.about-rail-inner').count(), 1);
  assert.equal(await page.locator('.about-chapters section[data-about-chapter]').count(), 4);
  assert.deepEqual(
    await page
      .locator('.about-chapters section[data-about-chapter]')
      .evaluateAll((nodes) => nodes.map((node) => node.id)),
    chapterIds,
  );
  const paragraphs = (await page.locator('main.about-page p').allTextContents()).map(normalize);
  for (const paragraph of approvedBiography)
    assert.ok(
      paragraphs.includes(normalize(paragraph)),
      'An approved biography paragraph changed or is missing',
    );
  const education = normalize(await page.locator('#education').textContent());
  assert.match(education, /Andra Savčić/);
  assert.match(education, /Valjevo/);
  assert.match(education, /currently|studying|in progress|ongoing|student/i);
  assert.doesNotMatch(
    education,
    /graduated|graduation|three (?:remaining )?exams|3 (?:remaining )?exams/i,
  );
  assert.equal(await page.locator('.about-timeline li[data-about-step]').count(), 3);
  const primarySchool = normalize(
    await page.locator('.about-timeline li[data-about-step]').first().textContent(),
  );
  assert.match(primarySchool, /Andra Savčić/);
  assert.match(primarySchool, /Valjevo/);
  assert.match(education, /C#/);
  assert.match(education, /(?:^|[\s,/()])C(?=$|[\s,/().])/);
  const experience = normalize(await page.locator('#experience').textContent());
  assert.match(experience, /SpotHopper/);
  assert.match(experience, /automat/i);
  assert.ok(
    await page.locator('#experience time[datetime="2025-08"]').count(),
    'Missing August 2025 employment date',
  );
  assert.ok(
    await page.locator('#experience time[datetime="2026-06"]').count(),
    'Missing June 2026 automation date',
  );
  const technologies = normalize(await page.locator('#technologies').textContent());
  for (const technology of ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'PHP', 'GSAP', 'Python', 'Docker', 'MySQL'])
    assert.ok(technologies.includes(technology), `Missing current technology: ${technology}`);
  assert.doesNotMatch(technologies, /(?:^|[\s,/()])C#?(?=$|[\s,/().])/);
  const portrait = page.locator('.about-portrait img, img.about-portrait').first();
  assert.match(await portrait.getAttribute('src'), /\/assets\/images\/myself1-/);
  assert.match(await portrait.evaluate((image) => image.currentSrc), /\/assets\/images\/myself1-/);
  for (const href of expectedSocials)
    assert.equal(await page.locator(`a[href="${href}"]`).count(), 1);
}
async function progress(page, selector, property) {
  const raw = await page
    .locator(selector)
    .evaluate(
      (element, property) => getComputedStyle(element).getPropertyValue(property).trim(),
      property,
    );
  assert.notEqual(raw, '', `Missing ${property}`);
  const value = Number(raw);
  assert.ok(Number.isFinite(value) && value >= -0.001 && value <= 1.001, `${property}: ${value}`);
  return value;
}
async function activeChapter(page, expected) {
  await page.waitForFunction(
    (expected) => {
      const active = [...document.querySelectorAll('[data-about-link][data-active="true"]')];
      return active.length === 1 && active[0].getAttribute('href') === '#' + expected;
    },
    expected,
    { timeout: 5000 },
  );
  assert.equal(await page.locator('[data-about-link][aria-current="location"]').count(), 1);
  assert.equal(
    await page.locator(`[data-about-link][href="#${expected}"]`).getAttribute('aria-current'),
    'location',
  );
  for (const id of chapterIds.filter((id) => id !== expected)) {
    assert.equal(
      await page.locator(`[data-about-link][href="#${id}"]`).getAttribute('data-active'),
      'false',
    );
    assert.equal(
      await page.locator(`[data-about-link][href="#${id}"]`).getAttribute('aria-current'),
      null,
    );
  }
}
async function chapterMiddle(page, id) {
  await page.locator('#' + id).evaluate((section) => {
    const bounds = section.getBoundingClientRect();
    window.scrollTo({
      top: scrollY + bounds.top + bounds.height / 2 - innerHeight / 2,
      behavior: 'instant',
    });
  });
  await settle(page);
  await activeChapter(page, id);
}
async function screenshot(page, name) {
  await page.screenshot({ path: resolve(out, name + '.png') });
}
async function axe(page, label) {
  await page.addScriptTag({ path: axePath });
  const report = await page.evaluate(() => window.axe.run(document));
  accessibility.push({ label, violations: report.violations, incomplete: report.incomplete });
  assert.equal(
    report.violations.length,
    0,
    JSON.stringify(
      report.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })),
    ),
  );
}

try {
  for (const viewport of viewports) {
    const label = `${viewport.width}x${viewport.height}`;
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      hasTouch: viewport.width < 600,
      isMobile: viewport.width < 600,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    observe(page);
    await check(`${label}: About content, portrait, socials and layout`, async () => {
      await openAbout(page);
      await facts(page);
      await readable(page);
      return noOverflow(page);
    });
    await check(`${label}: forward and reverse chapter scrolling`, async () => {
      const values = [];
      for (const id of chapterIds) {
        await chapterMiddle(page, id);
        await noOverflow(page);
        values.push(await progress(page, '[data-about-story]', '--about-progress'));
      }
      assert.ok(values[3] > values[0], JSON.stringify(values));
      await chapterMiddle(page, 'education');
      assert.ok((await progress(page, '[data-about-story]', '--about-progress')) < values[3]);
      await chapterMiddle(page, 'my-story');
      return { chapterProgress: values };
    });
    await check(`${label}: education three stages and rapid chapter change`, async () => {
      const steps = page.locator('.about-timeline li[data-about-step]');
      const values = [];
      for (let index = 0; index < 3; index++) {
        await steps
          .nth(index)
          .evaluate((step) =>
            window.scrollTo({
              top: scrollY + step.getBoundingClientRect().top - Math.min(innerHeight * 0.3, 280),
              behavior: 'instant',
            }),
          );
        await settle(page);
        await activeChapter(page, 'education');
        await page.waitForFunction(
          (index) => {
            const steps = [...document.querySelectorAll('.about-timeline li[data-about-step]')];
            return steps[index]?.dataset.state === 'current';
          },
          index,
          { timeout: 5000 },
        );
        assert.deepEqual(
          await steps.evaluateAll((nodes) => nodes.map((node) => node.dataset.state)),
          [0, 1, 2].map((item) => (item < index ? 'past' : item === index ? 'current' : 'future')),
        );
        values.push(await progress(page, '#education', '--education-progress'));
      }
      assert.ok(values[2] >= values[0], JSON.stringify(values));
      await page.evaluate(() => {
        for (const id of ['education', 'technologies']) {
          const section = document.getElementById(id);
          const bounds = section.getBoundingClientRect();
          scrollTo({
            top: scrollY + bounds.top + bounds.height / 2 - innerHeight / 2,
            behavior: 'instant',
          });
        }
      });
      await settle(page);
      await activeChapter(page, 'technologies');
      return { educationProgress: values };
    });
    if ([390, 1440].includes(viewport.width)) {
      await check(`${label}: intro, story and chapter screenshots`, async () => {
        await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
        await settle(page);
        await screenshot(page, `${viewport.width}-intro`);
        for (const id of chapterIds) {
          await chapterMiddle(page, id);
          await screenshot(page, `${viewport.width}-${id}`);
        }
      });
      await check(`${label}: default axe About audit`, () => axe(page, label));
    }
    await context.close();
  }

  const historyContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const historyPage = await historyContext.newPage();
  observe(historyPage);
  await check('rail anchor, Back/Forward and reload at deep scroll', async () => {
    await openAbout(historyPage);
    await historyPage.locator('[data-about-link][href="#education"]').click();
    await historyPage.waitForURL(base + '/about/#education');
    await activeChapter(historyPage, 'education');
    await historyPage.goBack();
    await historyPage.waitForURL(base + '/about/');
    await ready(historyPage);
    await historyPage.goForward();
    await historyPage.waitForURL(base + '/about/#education');
    await ready(historyPage);
    await activeChapter(historyPage, 'education');
    await openAbout(historyPage);
    await chapterMiddle(historyPage, 'experience');
    await historyPage.waitForTimeout(600);
    const before = await historyPage.evaluate(() => scrollY);
    assert.equal((await historyPage.reload({ waitUntil: 'domcontentloaded' })).status(), 200);
    await ready(historyPage);
    await activeChapter(historyPage, 'experience');
    const after = await historyPage.evaluate(() => scrollY);
    assert.ok(Math.abs(after - before) < 10, `Reload scroll ${before} → ${after}`);
    return { before, after };
  });
  await check('repeated About → Work → About SPA visits', async () => {
    await openAbout(historyPage);
    const marker = await historyPage.evaluate(() => (window.aboutQaDocument = Math.random()));
    for (let index = 0; index < 3; index++) {
      await historyPage.locator('.site-nav a[href="/"]').click();
      await ready(historyPage, 'work');
      await historyPage.locator('.site-nav a[href="/about/"]').click();
      await ready(historyPage);
      assert.equal(await historyPage.locator('[data-about-story]').count(), 1);
      await chapterMiddle(historyPage, index % 2 ? 'education' : 'experience');
    }
    assert.equal(await historyPage.evaluate(() => window.aboutQaDocument), marker);
  });
  await historyContext.close();

  await check('JavaScript disabled: all content remains readable', async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    const page = await context.newPage();
    observe(page);
    try {
      assert.equal((await page.goto(base + '/about/')).status(), 200);
      // Script scheduling is disabled in this context; native resource loading is sufficient.
      await page.waitForLoadState('networkidle');
      await facts(page);
      await readable(page);
      await noOverflow(page);
      await page.locator('[data-about-link][href="#experience"]').click();
      assert.equal(new URL(page.url()).hash, '#experience');
      assert.ok(await page.locator('#experience').isVisible());
      await screenshot(page, '390-no-js-experience');
    } finally {
      await context.close();
    }
  });
  await check('reduced motion: readable chapters and working native rail', async () => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    observe(page);
    try {
      await openAbout(page);
      assert.equal(
        await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches),
        true,
      );
      await readable(page);
      await page.locator('[data-about-link][href="#technologies"]').click();
      await activeChapter(page, 'technologies');
      await noOverflow(page);
      await screenshot(page, '390-reduced-motion-technologies');
    } finally {
      await context.close();
    }
  });
  for (const width of [390, 1440]) {
    await check(`${width}px: 200% root text sizing`, async () => {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      observe(page);
      try {
        await openAbout(page);
        const before = await page.evaluate(() =>
          parseFloat(getComputedStyle(document.documentElement).fontSize),
        );
        await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
        await settle(page);
        const after = await page.evaluate(() =>
          parseFloat(getComputedStyle(document.documentElement).fontSize),
        );
        assert.ok(after >= before * 1.99);
        await readable(page);
        await noOverflow(page);
        await screenshot(page, `${width}-text-200-intro`);
        await chapterMiddle(page, 'education');
        await noOverflow(page);
        await screenshot(page, `${width}-text-200-education`);
      } finally {
        await context.close();
      }
    });
  }
  await check('no uncaught JavaScript errors or failed local resources', () => {
    assert.deepEqual(errors, []);
    assert.deepEqual(httpErrors, []);
  });
} finally {
  await writeFile(
    resolve(out, 'results.json'),
    JSON.stringify(
      {
        date: new Date().toISOString(),
        base,
        browser: browserVersion,
        conditions: {
          deviceScaleFactor: 1,
          viewports,
          physicalDevice: false,
          cpuThrottling: false,
          networkThrottling: false,
        },
        results,
        errors,
        httpErrors,
        accessibility,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
const failed = results.filter((result) => !result.passed);
console.log(
  `${results.length - failed.length}/${results.length} About QA groups passed. Report: ${resolve(out, 'results.json')}`,
);
if (failed.length) process.exitCode = 1;
