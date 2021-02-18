import { string } from 'rollup-plugin-string';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.js',
  plugins: [string({ include: '**/*.html' }), nodeResolve(), commonjs()],
  output: {
    banner: [
      '// ==UserScript==',
      '// @name         批量打包下载漫画',
      '// @namespace    http://tampermonkey.net/',
      '// @version      1.0.0',
      '// @description  批量打包下载漫画',
      '// @match        www.wnacg.org/*',
      '// @grant        GM_xmlhttpRequest',
      '// @require      https://cdn.jsdelivr.net/npm/jszip@3.6.0/dist/jszip.min.js#sha256-MB+WKZmHMme2BRVKpDuIbfs6VlSdUIAY1VroUmE+p8g=',
      '// @connect      wnacg.org',
      '// @connect      wnacg.xyz',
      '// @connect      wnacg.download',
      '// ==/UserScript==',
      '',
    ].join('\n'),
    file: 'build/bundle.js',
    format: 'iife',
    globals: ['GM_xmlhttpRequest', 'JSZip'],
  },
};
