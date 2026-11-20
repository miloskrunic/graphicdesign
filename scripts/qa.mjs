import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(
  process.env.QA_MODULE_ROOT
    ? resolve(process.env.QA_MODULE_ROOT, 'package.json')
    : import.meta.url,
);
const { chromium } = require('playwright-core');
const base = (process.env.QA_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const out = resolve(process.env.QA_OUTPUT || resolve(root, 'docs/qa'));
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const results = [],
  errors = [],
  httpErrors = [];
async function check(name, action) {
  try {
    await action();
    results.push({ name, passed: true });
    console.log('PASS ' + name);
  } catch (error) {
    results.push({ name, passed: false, error: error.stack });
    console.log('FAIL ' + name + ': ' + error.message);
  }
}
async function ready(page, name) {
  await page.waitForFunction(
    (name) =>
      document.body.dataset.page === name &&
      history.scrollRestoration === 'manual' &&
      !document.documentElement.hasAttribute('aria-busy'),
    name,
  );
}
function collect(page) {
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith(base) && response.status() >= 400)
      httpErrors.push({ url: response.url(), status: response.status() });
  });
}
const routeNames = [
  ['/', 'work'],
  ['/about/', 'about'],
  ['/contact/', 'contact'],
];
try {
  const groups = [
    [
      [320, 568],
      [360, 640],
      [390, 844],
      [480, 800],
    ],
    [
      [768, 1024],
      [820, 700],
      [821, 700],
      [900, 700],
    ],
    [
      [1024, 768],
      [1440, 900],
      [844, 390],
      [667, 375],
    ],
  ];
  await Promise.all(
    groups.map(async (sizes) => {
      const context = await browser.newContext({ reducedMotion: 'reduce', deviceScaleFactor: 1 });
      const page = await context.newPage();
      collect(page);
      for (const [width, height] of sizes) {
        await page.setViewportSize({ width, height });
        for (const [route, name] of routeNames)
          await check(`${width}x${height} ${name}: layout, semantics and assets`, async () => {
            assert.equal((await page.goto(base + route)).status(), 200);
            await ready(page, name);
            assert.equal(await page.locator('h1').count(), 1);
            assert.equal(await page.locator('body > header').count(), 1);
            assert.equal(await page.locator('main').count(), 1);
            assert.equal(await page.locator('.site-nav [aria-current="page"]').count(), 1);
            assert.equal(await page.locator('[data-page-style]').count(), 1);
            const layout = await page.evaluate(() => {
              const bounds = (element) => element.getBoundingClientRect();
              const header = [...document.querySelectorAll('.site-header a')].map((element) => ({
                left: bounds(element).left,
                right: bounds(element).right,
              }));
              const hero = document.querySelector('.hero'),
                cta = document.querySelector('.hero-cta');
              const gallery = document.querySelector('.gallery-section');
              const items = [...document.querySelectorAll('.gallery-item')];
              return {
                overflow:
                  document.documentElement.scrollWidth - document.documentElement.clientWidth,
                root: getComputedStyle(document.documentElement).backgroundColor,
                body: getComputedStyle(document.body).backgroundColor,
                header,
                ctaFits: !hero || bounds(cta).bottom <= bounds(hero).bottom,
                itemsFit:
                  !gallery ||
                  items.every(
                    (item) =>
                      bounds(item).top >= bounds(gallery).top &&
                      bounds(item).bottom <= bounds(gallery).bottom,
                  ),
                headingVisible: !!bounds(document.querySelector('h1')).height,
                sceneHeights: [...document.querySelectorAll('main > section')].map(
                  (element) => bounds(element).height,
                ),
                documentHeight: document.documentElement.scrollHeight,
                snap: getComputedStyle(document.documentElement).scrollSnapType,
              };
            });
            assert.ok(layout.overflow <= 1, JSON.stringify(layout));
            assert.equal(layout.root, 'rgb(20, 20, 20)');
            assert.equal(layout.body, layout.root);
            assert.ok(
              layout.header.every((box) => box.left >= 0 && box.right <= width),
              JSON.stringify(layout.header),
            );
            assert.ok(layout.ctaFits);
            assert.ok(layout.itemsFit);
            assert.ok(layout.headingVisible);
            if (name === 'work') {
              assert.equal(layout.sceneHeights.length, 3);
              assert.ok(
                layout.sceneHeights.every((sceneHeight) => Math.abs(sceneHeight - height) < 1),
              );
              assert.ok(Math.abs(layout.documentHeight - 3 * height) < 1);
              assert.ok(layout.snap.includes('mandatory'));
            }
            if ([320, 390, 1440, 844].includes(width))
              await page.screenshot({
                path: resolve(out, `${width}-${height}-${name}.png`),
                fullPage: true,
              });
          });
      }
      await context.close();
    }),
  );

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  collect(page);
  await check('SPA routes, metadata, persistent shell, focus and CTA', async () => {
    await page.goto(base);
    await ready(page, 'work');
    await page.evaluate(() => {
      window.qaSentinel = Math.random();
      window.qaHeader = document.querySelector('header');
    });
    const sentinel = await page.evaluate(() => window.qaSentinel);
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await ready(page, 'about');
    assert.equal(await page.title(), 'About - Miloš Krunić');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'page-content');
    assert.ok((await page.locator('link[rel=canonical]').getAttribute('href')).endsWith('/about/'));
    await page.getByRole('link', { name: 'Work', exact: true }).click();
    await ready(page, 'work');
    await page.getByRole('link', { name: 'Get In Touch', exact: true }).click();
    await ready(page, 'contact');
    assert.equal(await page.evaluate(() => window.qaSentinel), sentinel);
    assert.equal(
      await page.evaluate(() => document.querySelector('header') === window.qaHeader),
      true,
    );
  });
  await check('normal motion: Back/Forward gallery visibility and reload scroll', async () => {
    await page.goto(base);
    await ready(page, 'work');
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await ready(page, 'about');
    await page.goBack();
    await ready(page, 'work');
    await page.evaluate(() => window.scrollTo(0, document.querySelector('.gallery').offsetTop));
    await page.waitForTimeout(800);
    const scroll = await page.evaluate(() => scrollY);
    await page.goForward();
    await ready(page, 'about');
    await page.goBack();
    await ready(page, 'work');
    await page.waitForTimeout(800);
    assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) < 5);
    assert.equal(
      await page
        .locator('.gallery-item')
        .first()
        .evaluate((el) => getComputedStyle(el).opacity),
      '1',
    );
    assert.equal(
      await page.locator('.gallery-item').first().getAttribute('data-reveal-pending'),
      null,
    );
    await page.reload();
    await ready(page, 'work');
    assert.ok(Math.abs((await page.evaluate(() => scrollY)) - scroll) < 5);
  });
  await check('contact draft survives Back, a new SPA visit and refresh', async () => {
    await page.goto(base + '/contact/');
    await ready(page, 'contact');
    await page.locator('#firstname').fill('Audit draft');
    await page.locator('#message').fill('Draft remains in this tab.');
    await page.getByRole('link', { name: 'Work', exact: true }).click();
    await ready(page, 'work');
    await page.goBack();
    await ready(page, 'contact');
    assert.equal(await page.locator('#firstname').inputValue(), 'Audit draft');
    await page.getByRole('link', { name: 'About', exact: true }).click();
    await ready(page, 'about');
    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    await ready(page, 'contact');
    assert.equal(await page.locator('#message').inputValue(), 'Draft remains in this tab.');
    await page.reload();
    await ready(page, 'contact');
    assert.equal(await page.locator('#firstname').inputValue(), 'Audit draft');
  });
  await check('touch on the image opens native dialog; Escape returns focus', async () => {
    await page.goto(base);
    await ready(page, 'work');
    const opener = page.locator('.gallery-item').first();
    await opener.locator('img').tap();
    assert.equal(await page.locator('dialog').evaluate((el) => el.open), true);
    assert.ok((await page.locator('[data-lightbox-image]').getAttribute('alt')).includes('Moć'));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('dialog').evaluate((el) => el.open), false);
    assert.equal(await opener.evaluate((el) => document.activeElement === el), true);
  });
  await check('keyboard gallery opening and synchronized track/image panning', async () => {
    const opener = page.locator('.poster-item').first();
    await opener.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('dialog').evaluate((el) => el.open), true);
    await page.keyboard.press('Escape');
    const track = page.locator('.poster-track');
    await track.focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    const first = await track.evaluate((el) => Number(el.dataset.percentage));
    assert.ok(first < -1);
    await page.getByRole('button', { name: 'Next posters', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    assert.ok((await track.evaluate((el) => Number(el.dataset.percentage))) < first);
  });
  await check('touch drag moves the track and image crop inside full-height scene', async () => {
    await page.goto(base);
    await ready(page, 'work');
    await page.waitForFunction(() =>
      document.querySelector('.poster-section').classList.contains('is-enhanced'),
    );
    await page.evaluate(() => scrollTo({ top: innerHeight * 2, behavior: 'instant' }));
    const cdp = await context.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 340, y: 420 }],
    });
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 340 - i * 25, y: 420 }],
      });
      await page.waitForTimeout(20);
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(1000);
    assert.ok(
      (await page.locator('.poster-track').evaluate((el) => Number(el.dataset.percentage))) < -50,
    );
    assert.notEqual(
      await page
        .locator('.poster-item img')
        .first()
        .evaluate((el) => getComputedStyle(el).objectPosition),
      '100% 50%',
    );
    assert.equal(await page.locator('dialog').evaluate((el) => el.open), false);
    await cdp.detach();
  });
  await check('PageDown and Space scroll the document after SPA navigation', async () => {
    await page.goto(base + '/about/');
    await ready(page, 'about');
    await page.getByRole('link', { name: 'Work', exact: true }).click();
    await ready(page, 'work');
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(300);
    assert.ok((await page.evaluate(() => scrollY)) > 0);
    await page.evaluate(() => scrollTo(0, 0));
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    assert.ok((await page.evaluate(() => scrollY)) > 0);
  });
  await check('200% text reflow preserves navigation and content', async () => {
    for (const [route, name] of routeNames) {
      await page.goto(base + route);
      await ready(page, name);
      await page.addStyleTag({ content: 'html { font-size: 200%; }' });
      await page.waitForTimeout(100);
      assert.ok(
        (await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        )) <= 1,
      );
      assert.ok(await page.locator('h1').isVisible());
    }
  });
  await check(
    'form whitespace rejection, mocked error and success, no real submission',
    async () => {
      await page.goto(base + '/contact/');
      await ready(page, 'contact');
      let requests = 0,
        success = false;
      await page.route('https://formspree.io/f/mpwdkdnp', async (route) => {
        requests++;
        await new Promise((done) => setTimeout(done, 100));
        await route.fulfill({
          status: success ? 200 : 422,
          contentType: 'application/json',
          body: success ? '{}' : '{"errors":[{"message":"Mock rejection"}]}',
        });
      });
      await page.locator('#firstname').fill('   ');
      assert.equal(await page.locator('#firstname').evaluate((el) => el.checkValidity()), false);
      await page.locator('#firstname').fill('Test');
      await page.locator('#lastname').fill('Only');
      await page.locator('#email').fill('test@example.com');
      await page.locator('#message').fill('   ');
      await page.getByRole('button', { name: 'Send message', exact: true }).click();
      assert.equal(requests, 0);
      await page.locator('#message').fill('Mocked local QA message, never sent.');
      await page.getByRole('button', { name: 'Send message', exact: true }).click();
      await page.waitForFunction(
        () => document.querySelector('.form-status').dataset.status === 'error',
      );
      assert.equal(await page.locator('#firstname').inputValue(), 'Test');
      success = true;
      await page.locator('form').evaluate((el) => {
        el.requestSubmit();
        el.requestSubmit();
      });
      await page.waitForFunction(
        () => document.querySelector('.form-status').dataset.status === 'success',
      );
      assert.equal(requests, 2);
      assert.equal(await page.locator('#message').inputValue(), '');
      await page.unroute('https://formspree.io/f/mpwdkdnp');
    },
  );
  await check('automated accessibility: all routes, default axe rule set', async () => {
    for (const [route, name] of routeNames) {
      await page.goto(base + route);
      await ready(page, name);
      // Audit settled content rather than a reveal transition partway through opacity.
      await page.evaluate(async () => {
        await document.fonts.ready;
        const finite = document.getAnimations().filter((animation) =>
          Number.isFinite(animation.effect?.getComputedTiming().endTime),
        );
        await Promise.allSettled(finite.map((animation) => animation.finished));
      });
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const result = await page.evaluate(() => axe.run(document));
      await writeFile(resolve(out, `axe-${name}.json`), JSON.stringify(result, null, 2));
      assert.deepEqual(
        result.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map((node) => node.target),
        })),
        [],
      );
    }
  });
  await context.close();

  await check('no JavaScript: routes, full image links and horizontal poster access', async () => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(base);
    assert.equal(await page.locator('h1').evaluate((el) => getComputedStyle(el).opacity), '1');
    assert.equal(await page.locator('.poster-controls').isVisible(), false);
    assert.equal(
      await page.locator('.poster-track').evaluate((el) => getComputedStyle(el).overflowX),
      'auto',
    );
    await page.locator('.gallery-item').first().click();
    assert.ok(page.url().endsWith('.webp'));
    await page.goto(base);
    await page.getByRole('link', { name: 'About', exact: true }).click();
    assert.ok(page.url().endsWith('/about/'));
    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    assert.equal(await page.locator('form').getAttribute('method'), 'POST');
    await context.close();
  });
  await check('legacy URLs preserve query/hash and static routes survive refresh', async () => {
    const page = await browser.newPage();
    for (const [route, expected] of [
      ['/index.html', '/'],
      ['/about.html?source=old#about-title', '/about/?source=old#about-title'],
      ['/contact.html?source=old', '/contact/?source=old'],
      ['/about', '/about/'],
    ]) {
      await page.goto(base + route);
      await page.waitForURL(base + expected);
      assert.equal((await page.reload()).status(), 200);
    }
    await page.close();
  });
  await check('rapid navigation and failed fetch fallback', async () => {
    const page = await browser.newPage();
    await page.goto(base);
    await ready(page, 'work');
    await page.route('**/about/', async (route) => {
      await new Promise((done) => setTimeout(done, 250));
      await route.continue().catch(() => {});
    });
    await page.locator('.site-nav a[href="/about/"]').evaluate((el) => el.click());
    await page.locator('.site-nav a[href="/contact/"]').evaluate((el) => el.click());
    await ready(page, 'contact');
    await page.waitForTimeout(300);
    assert.ok(page.url().endsWith('/contact/'));
    assert.equal(await page.locator('link[media="print"]').count(), 0);
    await page.close();
    const fallback = await browser.newPage();
    await fallback.goto(base);
    await ready(fallback, 'work');
    await fallback.route('**/contact/', (route) =>
      route.request().resourceType() === 'fetch' ? route.abort() : route.continue(),
    );
    await fallback.getByRole('link', { name: 'Contact', exact: true }).click();
    await ready(fallback, 'contact');
    await fallback.close();
  });
  await check('robots, sitemap, 404 and optimized image budget', async () => {
    assert.equal((await fetch(base + '/sitemap.xml')).status, 200);
    assert.equal((await fetch(base + '/robots.txt')).status, 200);
    assert.equal((await fetch(base + '/missing-route/')).status, 404);
    const manifest = JSON.parse(
      await readFile(resolve(root, 'assets/images/manifest.json'), 'utf8'),
    );
    const gallery = Object.entries(manifest)
      .filter(([id]) => id !== 'myself1')
      .map(([, image]) => image);
    const original = gallery.reduce((n, image) => n + image.bytes, 0),
      optimized = gallery.reduce(
        (n, image) => n + image.variants.find((v) => v.width === 640).bytes,
        0,
      );
    assert.ok(optimized < original * 0.3, `${optimized}/${original}`);
  });
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  desktop.on('pageerror', (error) => errors.push(error.message));
  await check('mouse drag, keyboard opening after drag and dialog focus containment', async () => {
    await desktop.goto(base);
    await ready(desktop, 'work');
    await desktop.getByRole('link', { name: 'About', exact: true }).click();
    await ready(desktop, 'about');
    await desktop.goBack();
    await ready(desktop, 'work');
    const track = desktop.locator('.poster-track');
    await track.scrollIntoViewIfNeeded();
    const first = await desktop.locator('.poster-item').first().boundingBox();
    await desktop.mouse.move(first.x + first.width * 0.7, first.y + 100);
    await desktop.mouse.down();
    await desktop.mouse.move(first.x + 30, first.y + 100, { steps: 12 });
    const crop = await desktop
      .locator('.poster-item img')
      .first()
      .evaluate((el) => getComputedStyle(el).objectPosition);
    await desktop.mouse.up();
    const percentage = await track.evaluate((el) => Number(el.dataset.percentage));
    assert.ok(percentage < -1);
    assert.notEqual(crop, '100% 50%');
    assert.equal(await desktop.locator('dialog').evaluate((el) => el.open), false);
    await desktop.goForward();
    await ready(desktop, 'about');
    await desktop.goBack();
    await ready(desktop, 'work');
    assert.ok(
      Math.abs(
        (await desktop.locator('.poster-track').evaluate((el) => Number(el.dataset.percentage))) -
          percentage,
      ) < 0.01,
    );
    await desktop.locator('.poster-item').nth(1).focus();
    await desktop.keyboard.press('Enter');
    assert.equal(await desktop.locator('dialog').evaluate((el) => el.open), true);
    await desktop.keyboard.press('Tab');
    assert.ok(await desktop.evaluate(() => document.activeElement.closest('dialog') !== null));
    await desktop.keyboard.press('Escape');
  });
  await check(
    'poster drag survives diagonal/vertical mouse starts without native image dragging',
    async () => {
      await desktop.goto(base);
      await ready(desktop, 'work');
      await desktop.evaluate(() => {
        scrollTo({ top: innerHeight * 2, behavior: 'instant' });
        window.qaNativeDrags = [];
        document.addEventListener(
          'dragstart',
          (event) => window.qaNativeDrags.push({ blocked: event.defaultPrevented }),
          false,
        );
      });
      for (const area of ['center', 'edge', 'gap']) {
        for (const direction of [-1, 1]) {
          for (const start of ['horizontal', 'diagonal', 'vertical-first']) {
            await desktop.locator('.poster-track').evaluate((el) => {
              el.dataset.percentage = '-30';
              el.dispatchEvent(new Event('portfolio:poster-restore'));
            });
            const box = await desktop.locator('.poster-item').nth(1).boundingBox();
            const gap = await desktop
              .locator('.poster-track')
              .evaluate((el) => parseFloat(getComputedStyle(el).columnGap));
            const x =
              area === 'gap'
                ? box.x + box.width + gap / 2
                : area === 'edge'
                  ? box.x + box.width - 2
                  : box.x + box.width / 2;
            const y = box.y + box.height / 2;
            await desktop.mouse.move(x, y);
            await desktop.mouse.down();
            await desktop.mouse.move(
              x + (start === 'vertical-first' ? 0 : 7 * direction),
              y + (start === 'horizontal' ? 0 : 14),
            );
            await desktop.mouse.move(x + 220 * direction, y + 30, { steps: 10 });
            const moved = await desktop
              .locator('.poster-track')
              .evaluate((el) => Number(el.dataset.percentage));
            assert.ok(
              direction < 0 ? moved < -40 : moved > -20,
              `${area}/${direction}/${start}: ${moved}`,
            );
            assert.equal(await desktop.locator('dialog').evaluate((el) => el.open), false);
            await desktop.mouse.up();
            await desktop.mouse.move(x, y);
            assert.ok(
              Math.abs(
                (await desktop
                  .locator('.poster-track')
                  .evaluate((el) => Number(el.dataset.percentage))) - moved,
              ) < 0.01,
            );
          }
        }
      }
      assert.ok(await desktop.evaluate(() => window.qaNativeDrags.every((event) => event.blocked)));
      for (const selector of ['.poster-item', '.poster-item picture', '.poster-item img']) {
        assert.equal(
          await desktop
            .locator(selector)
            .first()
            .evaluate((el) => {
              const event = new DragEvent('dragstart', { bubbles: true, cancelable: true });
              el.dispatchEvent(event);
              return event.defaultPrevented;
            }),
          true,
        );
      }
    },
  );
  await check(
    'lightbox preserves the original transparent fullscreen overlay and close behavior',
    async () => {
      await desktop.goto(base);
      await ready(desktop, 'work');
      const opener = desktop.locator('.gallery-item').first();
      await opener.click();
      const appearance = await desktop.locator('dialog').evaluate((el) => {
        const box = el.getBoundingClientRect(),
          style = getComputedStyle(el);
        return {
          x: box.x,
          y: box.y,
          w: box.width,
          h: box.height,
          vw: innerWidth,
          vh: innerHeight,
          background: style.backgroundColor,
          backdrop: getComputedStyle(el, '::backdrop').backgroundColor,
          border: style.borderTopWidth,
          padding: style.paddingTop,
        };
      });
      assert.equal(appearance.background, 'rgba(0, 0, 0, 0)');
      assert.equal(appearance.backdrop, 'rgba(0, 0, 0, 0.9)');
      assert.equal(appearance.border, '0px');
      assert.equal(appearance.padding, '0px');
      assert.equal(appearance.x, 0);
      assert.equal(appearance.y, 0);
      assert.equal(appearance.w, appearance.vw);
      assert.equal(appearance.h, appearance.vh);
      await desktop.locator('[data-lightbox-image]').evaluate((el) => el.decode());
      const image = await desktop.locator('[data-lightbox-image]').boundingBox();
      assert.ok(image.width <= appearance.vw * 0.9 + 1 && image.height <= appearance.vh * 0.9 + 1);
      await desktop.mouse.click(8, appearance.vh / 2);
      assert.equal(await desktop.locator('dialog').evaluate((el) => el.open), false);
      await opener.click();
      await desktop.locator('[data-lightbox-image]').click();
      assert.equal(await desktop.locator('dialog').evaluate((el) => el.open), false);
      await opener.click();
      await desktop.getByRole('button', { name: 'Close preview', exact: true }).click();
      assert.equal(await desktop.locator('dialog').evaluate((el) => el.open), false);
      assert.equal(await opener.evaluate((el) => document.activeElement === el), true);
    },
  );
  await check('wheel settles on exact full-screen scene boundaries', async () => {
    await desktop.goto(base);
    await ready(desktop, 'work');
    await desktop.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await desktop.mouse.move(200, 200);
    await desktop.mouse.wheel(0, 600);
    await desktop.waitForFunction(() => Math.abs(scrollY - innerHeight) < 1, null, {
      timeout: 5000,
    });
  });
  await check('skip link focuses main content', async () => {
    await desktop.goto(base);
    await ready(desktop, 'work');
    await desktop.keyboard.press('Tab');
    assert.equal(await desktop.evaluate(() => document.activeElement.className), 'skip-link');
    await desktop.keyboard.press('Enter');
    assert.equal(await desktop.evaluate(() => document.activeElement.id), 'page-content');
  });
  await check('submit button has a visible keyboard focus outline', async () => {
    await desktop.goto(base + '/contact/');
    await ready(desktop, 'contact');
    await desktop.getByRole('button', { name: 'Send message' }).focus();
    await desktop.keyboard.press('Tab');
    await desktop.keyboard.press('Shift+Tab');
    assert.notEqual(
      await desktop
        .getByRole('button', { name: 'Send message' })
        .evaluate((el) => getComputedStyle(el).outlineStyle),
      'none',
    );
  });
  await check('404 accessibility: default axe rule set', async () => {
    await desktop.goto(base + '/404.html');
    await desktop.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const report = await desktop.evaluate(() => axe.run(document));
    assert.deepEqual(
      report.violations.map(({ id }) => id),
      [],
    );
  });
  await desktop.close();
  await check('no uncaught JS errors or local asset HTTP errors', () => {
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
        browser: browser.version(),
        results,
        errors,
        httpErrors,
      },
      null,
      2,
    ),
  );
  await browser.close();
}
if (results.some((result) => !result.passed)) process.exitCode = 1;
