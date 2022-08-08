import type { IncomingMessage } from 'http';
import { IStoreManager } from '@shuvi/redox';
import { CustomAppContext } from '@shuvi/runtime';
import { IRouter, IPageRouteRecord } from './routerTypes';
import { IPluginList } from './lifecycle';

export type IRequest = IncomingMessage & {
  [x: string]: any;
};

export interface IAppContext extends CustomAppContext {
  [x: string]: unknown;
}

export type IRerenderConfig = {
  AppComponent?: any;
};

export type { IStoreManager };

export interface IError {
  code?: number;
  message?: string;
}

export interface IErrorState {
  error?: IError;
}

export type IAppState = {
  error?: IErrorState;
};

export interface IApplication {
  readonly context: IAppContext;
  readonly router: IRouter<IPageRouteRecord>;
  readonly appComponent: any;
  readonly store: IStoreManager;
  readonly error: IError | undefined;
  setError(err: IError): void;
  clearError(): void;
}

export interface IApplicationOptions {
  router: IRouter;
  AppComponent: any;
  initialState?: IAppState;
  plugins?: IPluginList;
}
