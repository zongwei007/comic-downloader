import css from 'rollup-plugin-embed-css';
import { string } from 'rollup-plugin-string';

export default {
  input: 'src/main.js',
  plugins: [css(), string({ include: '**/*.ejs' })],
  output: {
    banner: [
      '// ==UserScript==',
      '// @name         批量打包下载漫画',
      '// @namespace    http://tampermonkey.net/',
      '// @version      1.0.0',
      '// @description  批量打包下载漫画',
      '// @match        https://www.wnacg.org/*',
      '// ==/UserScript==',
      '',
    ].join('\n'),
    file: 'build/bundle.js',
    format: 'iife',
  },
};
