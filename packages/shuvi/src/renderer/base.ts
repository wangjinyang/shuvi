import { Runtime, ITemplateData } from '@shuvi/types';
import { htmlEscapeJsonString } from '@shuvi/utils/lib/htmlescape';
import { parse as parseUrl } from 'url';
import {
  CLIENT_APPDATA_ID,
  CLIENT_CONTAINER_ID,
  BUILD_CLIENT_RUNTIME_MAIN,
  BUILD_CLIENT_RUNTIME_POLYFILL,
  DEV_STYLE_ANCHOR_ID,
  DEV_STYLE_HIDE_FOUC
} from '../constants';
import getRuntimeConfig, { hasSetRuntimeConfig } from '../lib/runtimeConfig';
import { renderTemplate } from '../lib/viewTemplate';
import { getPublicRuntimeConfig } from '../lib/getPublicRuntimeConfig';
import { tag, stringifyTag, stringifyAttrs } from './htmlTag';
import {
  IRendererConstructorOptions,
  IRenderDocumentOptions,
  IServerRendererContext
} from './types';
import { Api, IBuiltResource } from '../api';

import IAppData = Runtime.IAppData;
import IHtmlTag = Runtime.IHtmlTag;
import IDocumentProps = Runtime.IDocumentProps;
import IRenderResultRedirect = Runtime.IRenderResultRedirect;
import IServerRendererOptions = Runtime.IServerRendererOptions;

export function isRedirect(obj: any): obj is IRenderResultRedirect {
  return obj && (obj as IRenderResultRedirect).$type === 'redirect';
}

export abstract class BaseRenderer {
  protected _api: Api;
  protected _resources: IBuiltResource;

  constructor({ api }: IRendererConstructorOptions) {
    this._api = api;
    this._resources = api.resources;
  }

  async renderDocument({
    req,
    AppComponent,
    routes,
    appContext,
  }: IRenderDocumentOptions): Promise<string | IRenderResultRedirect> {
    const api = this._api;
    let { parsedUrl } = req;
    if (!parsedUrl) {
      parsedUrl = parseUrl(req.url, true);
    }
    const rendererCtx: IServerRendererContext = {
      appData: {}
    };
    const rendererOptions: IServerRendererOptions = {
      req: {
        ...req,
        parsedUrl,
        headers: req.headers || {}
      },
      AppComponent,
      routes,
      appContext,
      manifest: this._resources.clientManifest,
      getAssetPublicUrl: api.getAssetPublicUrl.bind(api),
    };
    const docProps = await this.getDocumentProps(rendererOptions, rendererCtx);
    if (isRedirect(docProps)) {
      return docProps;
    }

    // todo: breaking previous version
    // if (document.onDocumentProps) {
    //   document.onDocumentProps(docProps, serverCtx);
    // }

    const appData: IAppData = {
      ssr: api.config.ssr,
      ...rendererCtx.appData
    };
    if (api.config.ssr && hasSetRuntimeConfig()) {
      appData.runtimeConfig = getPublicRuntimeConfig(getRuntimeConfig());
    }
    docProps.mainTags.push(this._getInlineAppData(appData));

    return this._renderDocument(
      docProps
      // todo: breaking previous version
      // document.getTemplateData ? document.getTemplateData(serverCtx) : {}
    );
  }

  protected abstract getDocumentProps(
    options: IServerRendererOptions,
    rendererCtx: IServerRendererContext
  ):
    | Promise<IDocumentProps | IRenderResultRedirect>
    | IDocumentProps
    | IRenderResultRedirect;

  protected _getMainAssetTags(): {
    styles: IHtmlTag<any>[];
    scripts: IHtmlTag<any>[];
  } {
    const styles: IHtmlTag<'link' | 'style'>[] = [];
    const scripts: IHtmlTag<'script'>[] = [];
    const { clientManifest } = this._api.resources;
    const entrypoints = clientManifest.entries[BUILD_CLIENT_RUNTIME_MAIN];
    const polyfill = clientManifest.bundles[BUILD_CLIENT_RUNTIME_POLYFILL];
    scripts.push(
      tag('script', {
        src: this._api.getAssetPublicUrl(polyfill)
      })
    );
    entrypoints.js.forEach((asset: string) => {
      scripts.push(
        tag('script', {
          src: this._api.getAssetPublicUrl(asset)
        })
      );
    });
    if (entrypoints.css) {
      entrypoints.css.forEach((asset: string) => {
        styles.push(
          tag('link', {
            rel: 'stylesheet',
            href: this._api.getAssetPublicUrl(asset)
          })
        );
      });
    }
    if (this._api.mode === 'development') {
      styles.push(
        tag(
          'style',
          {
            [DEV_STYLE_HIDE_FOUC]: true
          },
          'body{display:none}'
        ),

        /**
         * this element is used to mount development styles so the
         * ordering matches production
         * (by default, style-loader injects at the bottom of <head />)
         */
        tag('style', {
          id: DEV_STYLE_ANCHOR_ID
        })
      );
    }

    return {
      styles,
      scripts
    };
  }

  protected _getAppContainerTag(html: string = ''): IHtmlTag<'div'> {
    return tag(
      'div',
      {
        id: CLIENT_CONTAINER_ID
      },
      html
    );
  }

  private _getInlineAppData(appData: IAppData): IHtmlTag {
    const data = JSON.stringify(appData);
    return tag(
      'textarea',
      {
        id: CLIENT_APPDATA_ID,
        style: 'display: none'
      },
      htmlEscapeJsonString(data)
    );
  }

  private _renderDocument(
    documentProps: IDocumentProps,
    templateData: ITemplateData = {}
  ) {
    const htmlAttrs = stringifyAttrs(documentProps.htmlAttrs);
    const head = documentProps.headTags.map(tag => stringifyTag(tag)).join('');
    const main = documentProps.mainTags.map(tag => stringifyTag(tag)).join('');
    const script = documentProps.scriptTags
      .map(tag => stringifyTag(tag))
      .join('');

    return renderTemplate(this._api.resources.documentTemplate, {
      htmlAttrs,
      head,
      main,
      script,
      ...templateData
    });
  }
}
