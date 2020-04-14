import { Api } from '../api';
import { PluginApi } from '../pluginApi';
import { shuviConfig } from './utils';

describe('api', () => {
  let gApi: Api;
  beforeAll(() => {
    gApi = new Api({
      mode: 'development',
      config: shuviConfig(),
    });
  });

  test('should has "production" be default mode', () => {
    const prodApi = new Api({ config: shuviConfig() });
    expect(prodApi.mode).toBe('production');
  });

  test('plugins', () => {
    let pluginApi: PluginApi;
    const api = new Api({
      config: shuviConfig({ plugins: [(api) => (pluginApi = api)] }),
    });
    expect(pluginApi!).toBeDefined();
    expect(pluginApi!.paths).toBe(api.paths);
  });

  test('getPluginApi', () => {
    const pluginApi = gApi.getPluginApi();

    expect(pluginApi.mode).toBe(gApi.mode);
    expect(pluginApi.paths).toBe(gApi.paths);
    expect(pluginApi.config).toBe(gApi.config);

    [
      'tap',
      'callHook',
      'on',
      'emitEvent',
      'addAppFile',
      'addAppExport',
      'addAppPolyfill',
      'resolveAppFile',
      'resolveUserFile',
      'resolveBuildFile',
      'resolvePublicFile',
      'getAssetPublicUrl',
    ].forEach((method) => {
      // @ts-ignore
      expect(typeof pluginApi[method]).toBe('function');
    });
  });
});
