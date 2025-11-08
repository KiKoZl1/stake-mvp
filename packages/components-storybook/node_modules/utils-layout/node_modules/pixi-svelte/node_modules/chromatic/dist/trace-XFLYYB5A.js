'use strict';

!function(){try{var e="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:{},n=(new e.Error).stack;n&&(e._sentryDebugIds=e._sentryDebugIds||{},e._sentryDebugIds[n]="fa0414e5-55a1-56c6-b0ab-e4b6704500e6")}catch(e){}}();

var chunkYCKI6A3V_js = require('./chunk-YCKI6A3V.js');
var chunkX7RBQNLE_js = require('./chunk-X7RBQNLE.js');
var chunkLZXDNZPW_js = require('./chunk-LZXDNZPW.js');
var chunkTKGT252T_js = require('./chunk-TKGT252T.js');

var l=chunkTKGT252T_js.e(chunkX7RBQNLE_js.B());var{STORYBOOK_BASE_DIR:m,STORYBOOK_CONFIG_DIR:b,WEBPACK_STATS_FILE:u}=process.env;async function O(c){let{flags:t,input:f}=(0, l.default)(`
    Usage
      $ chromatic trace [-b|--base-dir] [-c|--config-dir] [-s|--stats-file] [-u|--untraced] [-m|--mode] [<changed files>...]

    Options
      <changed files>...                    List of changed files relative to repository root.
      --stats-file, -s <filepath>           Path to preview-stats.json. Alternatively, set WEBPACK_STATS_FILE. (default: 'storybook-static/preview-stats.json')
      --storybook-base-dir, -b <dirname>    Relative path from repository root to Storybook project root. Alternatively, set STORYBOOK_BASE_DIR. Use when your Storybook is located in a subdirectory of your repository.
      --storybook-config-dir, -c <dirname>  Directory where to load Storybook configurations from. Alternatively, set STORYBOOK_CONFIG_DIR. (default: '.storybook')
      --untraced, -u <filepath>             Disregard these files and their dependencies. Globs are supported via picomatch. This flag can be specified multiple times.
      --mode, -m <mode>                     Set to 'expanded' to reveal the underlying list of files for each bundle, or set to 'compact' to only show a flat list of affected story files.
    `,{argv:c,description:"Trace utility for TurboSnap",flags:{statsFile:{type:"string",alias:"s",default:u||"storybook-static/preview-stats.json"},storybookBaseDir:{type:"string",alias:"b",default:m||"."},storybookConfigDir:{type:"string",alias:"c",default:b||".storybook"},untraced:{type:"string",alias:"u",isMultiple:!0},mode:{type:"string",alias:"m"}}}),d={log:console,options:{storybookBaseDir:t.storybookBaseDir,storybookConfigDir:t.storybookConfigDir,untraced:t.untraced,traceChanged:t.mode||!0},git:{rootPath:await chunkYCKI6A3V_js.v()},storybook:{baseDir:t.storybookBaseDir,configDir:t.storybookConfigDir}},p=await chunkLZXDNZPW_js.a(t.statsFile),e=f.map(o=>o.replace(/^\.\//,"")),i=e.find(o=>chunkYCKI6A3V_js.L(o));if(i)throw new Error(`Unable to trace package manifest file (${i}) as that would require diffing file contents.`);await chunkYCKI6A3V_js.Q(d,p,t.statsFile,e);}

exports.main = O;
//# sourceMappingURL=out.js.map
//# sourceMappingURL=trace-XFLYYB5A.js.map
//# debugId=fa0414e5-55a1-56c6-b0ab-e4b6704500e6
