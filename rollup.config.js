import fs from 'fs';

import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.ts',
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    svelte({
      compilerOptions: {
        dev: !production,
      },
      emitCss: false,
      preprocess: sveltePreprocess(),
    }),
    outputMeta(),
    ...(!production ? [] : [terser({ format: { comments: 'all' } })]),
  ],
  output: {
    file: 'dist/comic-downloader.user.js',
    format: 'iife',
    globals: ['GM_xmlhttpRequest', 'JSZip'],
  },
};

function outputMeta() {
  const pkg = JSON.parse(fs.readFileSync('./package.json'));

  const meta = `// ==UserScript==
// @name         批量打包下载漫画
// @author       zongwei007
// @namespace    https://github.com/zongwei007/
// @version      ${pkg.version}
// @description  解析漫画网站图片地址，下载图片并打包为 zip 文件，或导出为文本
// @match        www.wnacg.org/*
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/jszip@3.6.0/dist/jszip.min.js#sha256-MB+WKZmHMme2BRVKpDuIbfs6VlSdUIAY1VroUmE+p8g=
// @downloadURL  https://github.com/zongwei007/comic-downloader/raw/master/dist/comic-downloader.user.js
// @updateURL    https://github.com/zongwei007/comic-downloader/raw/master/dist/comic-downloader.meta.js
// @supportURL   https://github.com/zongwei007/comic-downloader/issues
// @connect      wnacg.org
// @connect      wnacg.xyz
// @connect      wnacg.download
// ==/UserScript==
`;

  return {
    name: 'output-banner-as-meta',
    banner() {
      fs.writeFileSync('./dist/comic-downloader.meta.js', meta);

      return meta;
    },
  };
}
