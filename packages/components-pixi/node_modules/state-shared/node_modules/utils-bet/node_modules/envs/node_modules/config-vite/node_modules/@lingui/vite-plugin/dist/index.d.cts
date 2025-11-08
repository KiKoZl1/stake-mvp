import { Plugin } from 'vite';

type LinguiConfigOpts = {
    cwd?: string;
    configPath?: string;
    skipValidation?: boolean;
};
declare function lingui(linguiConfig?: LinguiConfigOpts): Plugin[];

export { lingui as default, lingui };
