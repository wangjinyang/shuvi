import * as fs from 'fs';
import * as path from 'path';
import {
  AppCtx,
  Page,
  devFixture,
  resolveFixture,
  serveFixture
} from '../utils';

jest.setTimeout(5 * 60 * 1000);

async function deleteFile() {
  const manifest = await require(resolveFixture(
    'custom-error/build/build-manifest.client.json'
  ));
  const fileName = 'custom-error/src/routes/ctx-error';
  const loadbleKeys = Object.keys(manifest.loadble);
  for (let i = 0; i < loadbleKeys.length; i++) {
    const key = loadbleKeys[i];
    // remove ctx.error page
    if (key.includes(fileName)) {
      const realFile = manifest.loadble[key]['files'][0];
      if (!realFile) {
        throw new Error(`con't find webpack bundle file: ${fileName}`);
      }
      const fileDir = resolveFixture('custom-error/build/client/');
      fs.unlinkSync(path.join(fileDir, realFile));
      break;
    }
  }
}

describe('custom/error.js [dev]', () => {
  describe('SSR', () => {
    let ctx: AppCtx;
    let page: Page;
    let result: any;

    beforeAll(async () => {
      ctx = await devFixture('custom-error');
      page = await ctx.browser.page();
    });
    afterAll(async () => {
      await page.close();
      await ctx.close();
    });

    test('should render error page with error status', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      if (!result) {
        throw Error('no result');
      }

      expect(result.status()).toBe(502);
      // ssr error result
      await page.waitForSelector('#error');
      expect(await page.$text('#error')).toContain('custom error 502');
      // client error result
      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/about');
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');
    });

    // todo: unstable result, maybe cause by on onDemand Compile
    // test('should update props in client when ssr error', async () => {
    //   result = await page.goto(ctx.url('/ctx-error?a=1'));
    //
    //   if (!result) {
    //     throw Error('no result');
    //   }
    //
    //   await page.waitForSelector('#error-show-client');
    //   expect(await page.$text('#error-show-client')).toContain(
    //     'error only in client for test'
    //   );
    //   await page.shuvi.navigate('/');
    //   await page.waitForSelector('#index');
    //   expect(await page.$text('#index')).toBe('Index Page');
    //   await page.shuvi.navigate('/ctx-error');
    //   await page.waitForSelector('#ctx-error');
    //   expect(await page.$text('#ctx-error')).toBe(
    //     'Ctx.error Page Render: client'
    //   );
    // });

    test('ssr error page with no none exist page', async () => {
      result = await page.goto(ctx.url('/none-exist-page'));

      expect(result.status()).toBe(404);
      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 404 This page could not be found.'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/about');
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');

      result = await page.goto(ctx.url('/ctx-error?a=1'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 502 custom error server'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
    });

    test('router api works when ssr error page', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      // @ts-ignore
      await page.$eval('#to-about', el => el.click());
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');
    });
  });

  describe('SPA', () => {
    let ctx: AppCtx;
    let page: Page;
    let result: any;

    beforeAll(async () => {
      ctx = await devFixture('custom-error', {
        ssr: false,
        router: { history: 'browser' }
      });
      page = await ctx.browser.page();
    });
    afterAll(async () => {
      await page.close();
      await ctx.close();
    });

    test('should render error page with status in dev', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      if (!result) {
        throw Error('no result');
      }

      expect(result.status()).toBe(200);
      // ssr error result
      await page.waitForSelector('#error');
      expect(await page.$text('#error')).toContain('custom error 502');
      // client error result
      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );

      await page.shuvi.navigate('/about');
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');

      await page.shuvi.navigate('/ctx-error');
      await page.waitForSelector('#ctx-error');
      expect(await page.$text('#ctx-error')).toBe(
        'Ctx.error Page Render: client'
      );

      await page.shuvi.navigate('/');
      await page.waitForSelector('#index');
      expect(await page.$text('#index')).toBe('Index Page');
    });

    test('spa error page with no none exist page', async () => {
      result = await page.goto(ctx.url('/none-exist-page'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 404 This page could not be found.'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/about');
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');

      result = await page.goto(ctx.url('/ctx-error?a=1'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 502 custom error client'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
    });

    test('router api works when spa error page', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      // @ts-ignore
      await page.$eval('#to-about', el => el.click());
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');
    });
  });
});

describe('custom/error.js [prod]', () => {
  describe('SSR', () => {
    let ctx: AppCtx;
    let page: Page;
    let result: any;
    beforeAll(async () => {
      ctx = await serveFixture('custom-error');
      page = await ctx.browser.page();
    });
    afterAll(async () => {
      await page.close();
      await ctx.close();
    });

    test('should render error page with error status', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      if (!result) {
        throw Error('no result');
      }

      expect(result.status()).toBe(502);
      // ssr error result
      await page.waitForSelector('#error');
      expect(await page.$text('#error')).toContain('custom error 502');
      // client error result
      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/about');
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');
    });

    test('should update props in client when ssr error', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      if (!result) {
        throw Error('no result');
      }

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/');
      await page.waitForSelector('#index');
      expect(await page.$text('#index')).toBe('Index Page');
      await page.shuvi.navigate('/ctx-error');
      await page.waitForSelector('#ctx-error');
      expect(await page.$text('#ctx-error')).toBe(
        'Ctx.error Page Render: client'
      );
    });

    test('ssr error page with no none exist page', async () => {
      result = await page.goto(ctx.url('/none-exist-page'));

      expect(result.status()).toBe(404);
      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 404 This page could not be found.'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/about');
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');

      result = await page.goto(ctx.url('/ctx-error?a=1'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 502 custom error server'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
    });

    test('router api works when ssr error page', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      // @ts-ignore
      await page.$eval('#to-about', el => el.click());
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');
    });

    test('ssr error should not overwrite by client errors', async () => {
      await deleteFile();
      result = await page.goto(ctx.url('/ctx-error?a=1'));
      expect(result.status()).toBe(502);
      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 502 custom error server'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/');
      await page.waitForSelector('#index');
      expect(await page.$text('#index')).toBe('Index Page');
      await page.shuvi.navigate('/ctx-error');
      // should fail to load chunk and show error page
      await page.waitForSelector('#error');
      expect(await page.$text('#error')).toBe(
        'custom error 500 Internal Server Error'
      );
    });
  });

  describe('SPA', () => {
    let ctx: AppCtx;
    let page: Page;
    let result: any;

    beforeAll(async () => {
      ctx = await serveFixture('custom-error', {
        ssr: false,
        router: { history: 'browser' }
      });
      page = await ctx.browser.page();
    });
    afterAll(async () => {
      await page.close();
      await ctx.close();
    });

    test('should render error page with 200 status', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      if (!result) {
        throw Error('no result');
      }

      expect(result.status()).toBe(200);
      // server error result
      await page.waitForSelector('#error');
      expect(await page.$text('#error')).toContain('custom error 502');
      // client error result
      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/about');
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');

      await page.shuvi.navigate('/ctx-error');
      await page.waitForSelector('#ctx-error');
      expect(await page.$text('#ctx-error')).toBe(
        'Ctx.error Page Render: client'
      );

      await page.shuvi.navigate('/');
      await page.waitForSelector('#index');
      expect(await page.$text('#index')).toBe('Index Page');
    });

    test('spa error page with no none exist page', async () => {
      result = await page.goto(ctx.url('/none-exist-page'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 404 This page could not be found.'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/about');
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');

      result = await page.goto(ctx.url('/ctx-error?a=1'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 502 custom error client'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
    });

    test('router api works when spa error page', async () => {
      result = await page.goto(ctx.url('/ctx-error?a=1'));

      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      // @ts-ignore
      await page.$eval('#to-about', el => el.click());
      await page.waitForSelector('#about');
      expect(await page.$text('#about')).toBe('About Page');
    });

    test('spa route resolve error', async () => {
      await deleteFile();
      result = await page.goto(ctx.url('/ctx-error?a=1'));
      expect(result.status()).toBe(200);
      await page.waitForSelector('#error-show-client');
      expect(await page.$text('#error')).toBe(
        'custom error 500 Internal Server Error'
      );
      expect(await page.$text('#error-show-client')).toContain(
        'error only in client for test'
      );
      await page.shuvi.navigate('/');
      await page.waitForSelector('#index');
      expect(await page.$text('#index')).toBe('Index Page');
      await page.shuvi.navigate('/ctx-error');
      // should fail to load chunk and show error page
      await page.waitForSelector('#error');
      expect(await page.$text('#error')).toBe(
        'custom error 500 Internal Server Error'
      );
    });
  });
});
