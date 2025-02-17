import { Doura } from 'doura';
import { CustomAppContext } from '@shuvi/runtime';
import { IRouter, IPageRouteRecord } from './routerTypes';
import { IPluginList } from './runtimPlugin';

export interface IAppContext extends CustomAppContext {
  [x: string]: unknown;
}

export type IRerenderConfig = {
  AppComponent?: any;
};

export type { Doura };

export type ErrorSource = 'server';

export interface IError {
  code?: number;
  message?: string;
  stack?: string;
  name?: string;
  source?: ErrorSource;
}

export interface IErrorState {
  error: IError | null;
}

export type IAppState = {
  error: IErrorState;
};

export interface Application<Config extends {} = {}> {
  readonly config: Config;
  readonly context: IAppContext;
  readonly router: IRouter<IPageRouteRecord>;
  readonly appComponent: any;
  readonly store: Doura;
  readonly error: IErrorState['error'];
  setError(err: IError): void;
  clearError(): void;
  getLoadersData(): Record<string, any>;
  setLoadersData(datas: Record<string, any>): void;
}

export interface ApplicationOptions<C extends {}> {
  config: C;
  router: IRouter;
  AppComponent: any;
  initialState?: IAppState;
  plugins?: IPluginList;
}
