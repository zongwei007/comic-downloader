import { string } from 'rollup-plugin-string';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.js',
  plugins: [string({ include: '**/*.html' }), resolve(), commonjs()],
  output: {
    banner: [
      '// ==UserScript==',
      '// @name         批量打包下载漫画',
      '// @namespace    http://tampermonkey.net/',
      '// @version      1.2.0',
      '// @description  解析漫画网站图片地址，下载图片并打包为 zip 文件，或导出为文本',
      '// @match        www.wnacg.org/*',
      '// @grant        GM_xmlhttpRequest',
      '// @require      https://cdn.jsdelivr.net/npm/vue@2.6.12/dist/vue.min.js#sha256-KSlsysqp7TXtFo/FHjb1T9b425x3hrvzjMWaJyKbpcI=',
      '// @require      https://cdn.jsdelivr.net/npm/jszip@3.6.0/dist/jszip.min.js#sha256-MB+WKZmHMme2BRVKpDuIbfs6VlSdUIAY1VroUmE+p8g=',
      '// @downloadURL  https://github.com/zongwei007/comic-downloader/raw/master/dist/comic-downloader.user.js',
      '// @connect      wnacg.org',
      '// @connect      wnacg.xyz',
      '// @connect      wnacg.download',
      '// ==/UserScript==',
      '',
    ].join('\n'),
    file: 'dist/comic-downloader.user.js',
    format: 'iife',
    globals: ['GM_xmlhttpRequest', 'JSZip', 'Vue'],
  },
};
