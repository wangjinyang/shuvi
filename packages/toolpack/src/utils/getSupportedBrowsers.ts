import browserslist from 'browserslist';

/**
 * These are the browser versions that support all of the following:
 * static import: https://caniuse.com/es6-module
 * dynamic import: https://caniuse.com/es6-module-dynamic-import
 * import.meta: https://caniuse.com/mdn-javascript_operators_import_meta
 */
const MODERN_BROWSERSLIST_TARGET = [
  'chrome 64',
  'edge 79',
  'firefox 67',
  'opera 51',
  'safari 12'
];

export function getSupportedBrowsers(
  dir: string,
  isDevelopment: boolean,
  config: {
    experimental?: {
      legacyBrowsers?: boolean;
    };
  }
): string[] | undefined {
  let browsers: any;
  try {
    const browsersListConfig = browserslist.loadConfig({
      path: dir,
      env: isDevelopment ? 'development' : 'production'
    });
    // Running `browserslist` resolves `extends` and other config features into a list of browsers
    if (browsersListConfig && browsersListConfig.length > 0) {
      browsers = browserslist(browsersListConfig);
    }
  } catch {}

  // When user has browserslist use that target
  if (browsers && browsers.length > 0) {
    return browsers;
  }

  // When the user sets `legacyBrowsers: true`, we pass undefined
  // to SWC which is basically ES5 and matches the default behavior
  return config.experimental?.legacyBrowsers
    ? undefined
    : MODERN_BROWSERSLIST_TARGET;
}
