import chalk from '@shuvi/utils/lib/chalk';
import spawn from 'cross-spawn';
import * as path from 'path';
import { PackageManager, getPkgManager } from '../helper/getPkgManager';
import { getOnline } from '../helper/getOnline';
import type { PackageDep } from './checkDependencies';

interface InstallArgs {
  /**
   * Indicate whether to install packages using npm, pnpm or Yarn.
   */
  packageManager: PackageManager;
  /**
   * Indicate whether there is an active Internet connection.
   */
  isOnline: boolean;
  /**
   * Indicate whether the given dependencies are devDependencies.
   */
  devDependencies?: boolean;
}

export type Dependencies = {
  resolved: Map<string, string>;
};

/**
 * Spawn a package manager installation with either Yarn or NPM.
 *
 * @returns A Promise that resolves once the installation is finished.
 */
export function install(
  root: string,
  dependencies: string[] | null,
  { packageManager, isOnline, devDependencies }: InstallArgs
): Promise<void> {
  /**
   * (p)npm-specific command-line flags.
   */
  const npmFlags: string[] = [];
  /**
   * Yarn-specific command-line flags.
   */
  const yarnFlags: string[] = [];
  /**
   * Return a Promise that resolves once the installation is finished.
   */
  return new Promise((resolve, reject) => {
    let args: string[];
    let command = packageManager;
    const useYarn = packageManager === 'yarn';

    if (dependencies && dependencies.length) {
      /**
       * If there are dependencies, run a variation of `{packageManager} add`.
       */
      if (useYarn) {
        /**
         * Call `yarn add --exact (--offline)? (-D)? ...`.
         */
        args = ['add', '--exact'];
        if (!isOnline) args.push('--offline');
        args.push('--cwd', root);
        if (devDependencies) args.push('--dev');
        args.push(...dependencies);
      } else {
        /**
         * Call `(p)npm install [--save|--save-dev] ...`.
         */
        args = ['install', '--save-exact'];
        args.push(devDependencies ? '--save-dev' : '--save');
        args.push(...dependencies);
      }
    } else {
      /**
       * If there are no dependencies, run a variation of `{packageManager}
       * install`.
       */
      args = ['install'];
      if (!isOnline) {
        console.log(chalk.yellow('You appear to be offline.'));
        if (useYarn) {
          console.log(chalk.yellow('Falling back to the local Yarn cache.'));
          console.log();
          args.push('--offline');
        } else {
          console.log();
        }
      }
    }
    /**
     * Add any package manager-specific flags.
     */
    if (useYarn) {
      args.push(...yarnFlags);
    } else {
      args.push(...npmFlags);
    }
    /**
     * Spawn the installation process.
     */
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: {
        ...process.env,
        ADBLOCK: '1',
        // we set NODE_ENV to development as pnpm skips dev
        // dependencies when production
        NODE_ENV: 'development',
        DISABLE_OPENCOLLECTIVE: '1'
      }
    });
    child.on('close', code => {
      if (code !== 0) {
        reject({ command: `${command} ${args.join(' ')}` });
        return;
      }
      resolve();
    });
  });
}

export async function installDependencies(
  baseDir: string,
  deps: any,
  dev: boolean = false
) {
  const packageManager = getPkgManager(baseDir);
  const isOnline = await getOnline();

  if (deps.length) {
    console.log();
    console.log(
      `Installing ${
        dev ? 'devDependencies' : 'dependencies'
      } (${packageManager}):`
    );
    for (const dep of deps) {
      console.log(`- ${chalk.cyan(dep.pkg)}`);
    }
    console.log();

    await install(
      path.resolve(baseDir),
      deps.map((dep: PackageDep) => dep.pkg),
      { devDependencies: dev, isOnline, packageManager }
    );
    console.log();
  }
}
