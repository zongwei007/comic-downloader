
// ==UserScript==
// @name         批量打包下载漫画
// @author       zongwei007
// @namespace    https://github.com/zongwei007/
// @version      1.2.3
// @description  解析漫画网站图片地址，下载图片并打包为 zip 文件，或导出为文本
// @match        www.wnacg.org/*
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/vue@2.6.12/dist/vue.min.js#sha256-KSlsysqp7TXtFo/FHjb1T9b425x3hrvzjMWaJyKbpcI=
// @require      https://cdn.jsdelivr.net/npm/jszip@3.6.0/dist/jszip.min.js#sha256-MB+WKZmHMme2BRVKpDuIbfs6VlSdUIAY1VroUmE+p8g=
// @downloadURL  https://github.com/zongwei007/comic-downloader/raw/master/dist/comic-downloader.user.js
// @updateURL    https://github.com/zongwei007/comic-downloader/raw/master/dist/comic-downloader.meta.js
// @supportURL   https://github.com/zongwei007/comic-downloader/issues
// @connect      wnacg.org
// @connect      wnacg.xyz
// @connect      wnacg.download
// ==/UserScript==

(function () {
  'use strict';

  const STATE_MAP = {
    error: '下载失败',
    pending: '准备下载',
    downloading: '下载中',
    downloaded: '已下载',
  };

  var PageItem = {
    props: ['class', 'index', 'url', 'progress', 'progressText', 'state'],

    computed: {
      hasError() {
        return this.state === 'error';
      },
      isDownloading() {
        return this.state === 'downloading';
      },
      progressWidth() {
        return `${(this.progress || 0) * 100}%`;
      },
      stateText() {
        return STATE_MAP[this.state];
      },
    },

    template: `
    <div class="row" v-bind:class="{ downloading: isDownloading }">
      <div class="index"><slot name="index">{{ index }}</slot></div>
      <div>
        <slot name="url">
          <div v-if="isDownloading" class="progress">
            <div class="progress-bar" v-bind:style="{ width: progressWidth }">{{ progressText }}</div>
          </div>
          <template v-else>
            {{ url }}
          </template>
        </slot>
      </div>
      <div class="state" v-bind:class="{ 'status-failed': hasError }"><slot name="state">{{ stateText }}</slot></div>
    </div>
  `,
  };

  function parseHTML(html) {
    const context = document.implementation.createHTMLDocument();

    // Set the base href for the created document so any parsed elements with URLs
    // are based on the document's URL
    const base = context.createElement('base');
    base.href = document.location.href;
    context.head.appendChild(base);

    context.body.innerHTML = html;

    return context.body;
  }

  function tpl(template) {
    return param => new Function(...Object.keys(param), 'return `' + template + '`')(...Object.values(param));
  }

  function formatPageNumber(num, length) {
    let name = String(num);

    for (let len = length - name.length; len > 0; len--) {
      name = '0' + name;
    }

    return name;
  }

  function promisePool(limit) {
    let running = 0;
    let pendings = [];

    function call() {
      while (running < limit && pendings.length) {
        const runnable = pendings.shift();

        runnable().finally(() => {
          running--;
          call();
        });

        running++;
      }
    }

    return {
      push(runnable) {
        pendings.push(runnable);

        call();
      },
    };
  }

  const HOME_PAGE_URL = location.href;
  const DOWNLOAD_THREAD_LIMIT = 5;

  const threadPool = promisePool(DOWNLOAD_THREAD_LIMIT);

  function resolveIndexPageUrl(index) {
    return HOME_PAGE_URL.replace('aid', `page-${index}-aid`);
  }

  async function requestPage(url, options) {
    const resp = await fetch(url, options);

    return await resp.text();
  }

  async function resolvePageUrl(indexPageUrl, onChange) {
    const content = parseHTML(await requestPage(indexPageUrl));
    const links = [...content.querySelectorAll('#bodywrap .gallary_wrap .gallary_item .pic_box a')].map(
      link => link.href
    );

    for (const pageUrl of links) {
      threadPool.push(() => resolvePage(pageUrl).then(onChange));
    }

    return links;
  }

  async function resolvePage(pageUrl) {
    console.log(`[CD] 正在解析 ${pageUrl}`);

    const content = parseHTML(await requestPage(pageUrl));
    const imageUrl = content.querySelector('#photo_body #imgarea #picarea').src;
    const pageLabels = content.querySelector('.newpagewrap .newpagelabel').innerText.split('/');
    const fileName = /[^/]+(?!.*\/)/.exec(imageUrl)[0];

    try {
      return {
        pageUrl,
        imageUrl,
        fileName,
        index: parseInt(pageLabels[0]),
        indexName: formatPageNumber(pageLabels[0], pageLabels[1].length) + '.' + /[^.]+(?!.*\.)/.exec(fileName),
        state: 'pending',
        total: parseInt(pageLabels[1]),
      };
    } finally {
      console.log(`[CD] 解析 ${pageUrl} 完成`);
    }
  }

  function resolveAllPage(onChange) {
    const paginations = document.querySelectorAll('.bot_toolbar .paginator > a');
    const lastPage = parseInt(paginations.item(paginations.length - 1).innerText);

    return new Promise((resolve, reject) => {
      const allPages = [];

      for (let index = 1; index <= lastPage; index++) {
        threadPool.push(() =>
          resolvePageUrl(resolveIndexPageUrl(index), page => {
            allPages.push(page);
            onChange(page);

            if (allPages.length >= links.length) {
              resolve(allPages);
            }
          }).then(links => {
          }, reject)
        );
      }
    });
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn) {
    var module = { exports: {} };
  	return fn(module, module.exports), module.exports;
  }

  var FileSaver_min = createCommonjsModule(function (module, exports) {
  (function(a,b){b();})(commonjsGlobal,function(){function b(a,b){return "undefined"==typeof b?b={autoBom:!1}:"object"!=typeof b&&(console.warn("Deprecated: Expected third argument to be a object"),b={autoBom:!b}),b.autoBom&&/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(a.type)?new Blob(["\uFEFF",a],{type:a.type}):a}function c(a,b,c){var d=new XMLHttpRequest;d.open("GET",a),d.responseType="blob",d.onload=function(){g(d.response,b,c);},d.onerror=function(){console.error("could not download file");},d.send();}function d(a){var b=new XMLHttpRequest;b.open("HEAD",a,!1);try{b.send();}catch(a){}return 200<=b.status&&299>=b.status}function e(a){try{a.dispatchEvent(new MouseEvent("click"));}catch(c){var b=document.createEvent("MouseEvents");b.initMouseEvent("click",!0,!0,window,0,0,0,80,20,!1,!1,!1,!1,0,null),a.dispatchEvent(b);}}var f="object"==typeof window&&window.window===window?window:"object"==typeof self&&self.self===self?self:"object"==typeof commonjsGlobal&&commonjsGlobal.global===commonjsGlobal?commonjsGlobal:void 0,a=f.navigator&&/Macintosh/.test(navigator.userAgent)&&/AppleWebKit/.test(navigator.userAgent)&&!/Safari/.test(navigator.userAgent),g=f.saveAs||("object"!=typeof window||window!==f?function(){}:"download"in HTMLAnchorElement.prototype&&!a?function(b,g,h){var i=f.URL||f.webkitURL,j=document.createElement("a");g=g||b.name||"download",j.download=g,j.rel="noopener","string"==typeof b?(j.href=b,j.origin===location.origin?e(j):d(j.href)?c(b,g,h):e(j,j.target="_blank")):(j.href=i.createObjectURL(b),setTimeout(function(){i.revokeObjectURL(j.href);},4E4),setTimeout(function(){e(j);},0));}:"msSaveOrOpenBlob"in navigator?function(f,g,h){if(g=g||f.name||"download","string"!=typeof f)navigator.msSaveOrOpenBlob(b(f,h),g);else if(d(f))c(f,g,h);else {var i=document.createElement("a");i.href=f,i.target="_blank",setTimeout(function(){e(i);});}}:function(b,d,e,g){if(g=g||open("","_blank"),g&&(g.document.title=g.document.body.innerText="downloading..."),"string"==typeof b)return c(b,d,e);var h="application/octet-stream"===b.type,i=/constructor/i.test(f.HTMLElement)||f.safari,j=/CriOS\/[\d]+/.test(navigator.userAgent);if((j||h&&i||a)&&"undefined"!=typeof FileReader){var k=new FileReader;k.onloadend=function(){var a=k.result;a=j?a:a.replace(/^data:[^;]*;/,"data:attachment/file;"),g?g.location.href=a:location=a,g=null;},k.readAsDataURL(b);}else {var l=f.URL||f.webkitURL,m=l.createObjectURL(b);g?g.location=m:location.href=m,g=null,setTimeout(function(){l.revokeObjectURL(m);},4E4);}});f.saveAs=g.saveAs=g,(module.exports=g);});


  });

  const textInfoTemplate = tpl(`
\${title}
\${url}
\${labels.join('\\n')}
标签：\${tags.join(' ')}
简介：\${introduction}

页面地址：
\${pages.map(page => page.pageUrl).join('\\n')}

图片地址：
\${pages.map(page => page.imageUrl).join('\\n')}

文件名映射：
\${pages.map(page => page.fileName + ' ' + page.indexName).join('\\n')}
`);

  async function exportUrl(info) {
    const blob = new Blob([textInfoTemplate(info)], { type: 'text/plain;charset=utf-8' });

    FileSaver_min.saveAs(blob, `${info.title}.info.txt`);
  }

  async function exportZip(info) {
    const zip = new JSZip();
    const folder = zip.folder(info.title);

    for (const page of info.pages) {
      if (page.buffer) {
        folder.file(page.indexName, page.buffer);
      }
    }

    folder.file('info.txt', new Blob([textInfoTemplate(info)], { type: 'text/plain;charset=utf-8' }));

    const blob = await zip.generateAsync({ type: 'blob' });

    FileSaver_min.saveAs(blob, `${info.title}.zip`);
  }

  function downloadImage(imageUrl, { onProgress, ...options }) {
    return new Promise((resolve, reject) => {
      let lastProgress = 0;
      let lastTimestamp = Date.now();
      let speedText = '0 KB/s';

      GM_xmlhttpRequest({
        ...options,
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 5 * 60 * 1000,
        onprogress(res) {
          const now = Date.now();
          const speedKBs = res.lengthComputable
            ? Number((res.loaded - lastProgress) / (now - lastTimestamp) / 1.024)
            : -1;

          if (now - lastTimestamp >= 1000 || lastProgress === 0) {
            speedText = res.lengthComputable ? `${speedKBs.toFixed(2)} KB/s` : '';
            lastProgress = res.loaded;
            lastTimestamp = now;
          }

          onProgress({
            loaded: res.loaded,
            total: res.total,
            progress: res.lengthComputable ? res.loaded / res.total : 0,
            progressText: speedText,
          });
        },
        onload(res) {
          try {
            // cache them to reduce waiting time and CPU usage on Chrome with Tampermonkey
            // (Tampermonkey uses a dirty way to give res.response, transfer string to arraybuffer every time)
            // now store progress just spent ~1s instead of ~8s
            var response = res.response;
            var byteLength = response.byteLength;
            var responseHeaders = res.responseHeaders;

            // use regex to fixed compatibility with http/2, as its headers are lower case (at least fixed with Yandex Turbo)
            var mime = responseHeaders.match(/Content-Type:/i)
              ? responseHeaders
                  .split(/Content-Type:/i)[1]
                  .split('\n')[0]
                  .trim()
                  .split('/')
              : ['', ''];
            var responseText;
            if (mime[0] === 'text') {
              responseText = new TextDecoder().decode(new DataView(response));
            }

            if (!response) {
              reject(new Error(`[CD] Image ${imageUrl} download fail: Return empty response`));
              return;
            }
            if (byteLength === 925) {
              // '403 Access Denied' Image Byte Size
              // GM_xhr only support abort()
              reject(new Error(`[CD] Image ${imageUrl} download fail: 403 Access Denied`));
              return;
            }
            if (byteLength === 28) {
              // 'An error has occurred. (403)' Length
              reject(`[CD] Image ${imageUrl} download fail: An error has occurred. (403)`);
              return;
            }

            // res.status should be detected at here, because we should know are we reached image limits at first
            if (res.status !== 200) {
              reject(new Error(`[CD] Image ${imageUrl} download fail: Wrong response status (${res.status})`));
              return;
            }

            resolve(response);
          } catch (error) {
            console.error(error);

            reject(new Error(`[CD] Image ${imageUrl} download fail: Unknown error (Please send feedback)`));
          }
        },
        onerror(res) {
          reject(new Error(`[CD] Image ${imageUrl} download fail: Network Error`));
        },
        ontimeout(res) {
          reject(new Error(`[CD] Image ${imageUrl} download fail: Timed Out`));
        },
      });
    });
  }

  var html = "<style>\n  .container {\n    position: fixed;\n    right: 0;\n    bottom: 0;\n    width: 33%;\n    height: 30%;\n    padding: 0.5rem;\n    background: #666;\n    border-top-right-radius: 5px;\n    border-top-left-radius: 5px;\n    border: 1px solid #333;\n    opacity: 98%;\n    color: #eee;\n  }\n\n  .container h4 {\n    margin: 0;\n  }\n\n  .btn-close,\n  .btn-folder {\n    float: right;\n    cursor: pointer;\n    padding: 0 5px;\n  }\n\n  .btn-folder::after {\n    display: inline;\n    content: '▼';\n  }\n\n  .spinner {\n    display: none;\n  }\n\n  .spinner::after {\n    content: '';\n    display: inline;\n    animation: loading-spinner;\n    animation-duration: 5s;\n    animation-iteration-count: infinite;\n  }\n\n  @keyframes loading-spinner {\n    20% {\n      content: '.';\n    }\n\n    40% {\n      content: '..';\n    }\n\n    60% {\n      content: '...';\n    }\n\n    80% {\n      content: '....';\n    }\n\n    100% {\n      content: '.....';\n    }\n  }\n\n  .loading .spinner {\n    display: inline;\n  }\n\n  .list {\n    width: 100%;\n    max-height: calc(100% - 60px);\n    overflow: auto;\n  }\n\n  .list .row {\n    display: flex;\n  }\n\n  .row.header {\n    font-weight: bolder;\n  }\n\n  .row > div {\n    padding: 5px;\n    flex: 1;\n  }\n\n  .row > div.index {\n    width: 40px;\n    text-align: right;\n    flex: 0 1 auto;\n  }\n\n  .row > div.state {\n    width: 60px;\n    flex: 0 1 auto;\n  }\n\n  .progress {\n    height: 14px;\n    overflow: hidden;\n    border: 1px solid #eee;\n  }\n\n  .progress > .progress-bar {\n    float: left;\n    height: 100%;\n    color: #333;\n    text-align: center;\n    background-color: #eee;\n  }\n\n  .toolbar {\n    height: 60px;\n    display: none;\n    padding-top: 10px;\n  }\n\n  .toolbar > div {\n    flex: 1;\n  }\n\n  .toolbar > .buttons {\n    text-align: right;\n  }\n\n  .status-failed {\n    color: #b60202;\n  }\n\n  .fold .btn-folder::after {\n    content: '▲';\n  }\n\n  .fold.container {\n    height: 15px;\n  }\n\n  .fold .list,\n  .fold .toolbar {\n    display: none;\n  }\n\n  .resolved .toolbar {\n    display: flex;\n  }\n</style>\n\n<div class=\"container\" v-bind:class=\"{ fold, loading, resolved }\">\n  <h4>\n    <span class=\"title\">\n      总页数：{{ pages.length }} | 正在下载：{{ downloadingCount }} | 已下载：{{ successCount }} | 失败：{{ failCount }}\n    </span>\n    <span class=\"spinner\"></span>\n    <a class=\"btn-close\" v-on:click=\"close\">╳</a>\n    <a class=\"btn-folder\" v-on:click=\"toggleFold\"></a>\n  </h4>\n  <hr />\n  <div class=\"list\">\n    <page-item class=\"header\">\n      <template v-slot:index>序号</template>\n      <template v-slot:url>页面</template>\n      <template v-slot:state>状态</template>\n    </page-item>\n    <page-item\n      v-for=\"page in currentPages\"\n      :key=\"page.index\"\n      :state=\"page.state\"\n      :index=\"page.index\"\n      :url=\"page.pageUrl\"\n      :progress=\"page.progress\"\n      :progress-text=\"page.progressText\"\n    />\n  </div>\n  <div class=\"toolbar\">\n    <div class=\"download-status\"></div>\n    <div class=\"buttons\">\n      <button class=\"btn-export-url\" v-on:click=\"exportPage('txt')\">导出 URL</button>\n      <button class=\"btn-export-zip\" v-on:click=\"exportPage('zip')\">导出 ZIP</button>\n    </div>\n  </div>\n</div>\n";

  const DOWNLOAD_THREAD_LIMIT$1 = 5;

  function DownloadBox(el) {
    let canceled = false;

    const threadPool = promisePool(DOWNLOAD_THREAD_LIMIT$1);

    const comicInfo = {
      finishedAt: null,
      introduction: document.querySelector('.asTBcell.uwconn > p').innerText.substring(3),
      labels: [...document.querySelectorAll('.asTBcell.uwconn > label')].map(node => node.innerText.trim()),
      startedAt: new Date(),
      tags: [...document.querySelectorAll('.asTBcell.uwconn .addtags .tagshow')].map(node => node.innerText.trim()),
      title: document.querySelector('.userwrap h2').innerText,
      url: location.href,
    };

    return new Vue({
      el,
      data: {
        downloadingCount: 0,
        fold: false,
        failCount: 0,
        loading: false,
        pages: [],
        resolved: false,
        successCount: 0,
      },

      components: {
        'page-item': PageItem,
      },

      created() {
        this.startDownload();
      },

      beforeDestroy() {
        canceled = true;
      },

      computed: {
        currentPages() {
          return this.pages.filter(Boolean);
        },
      },

      methods: {
        async startDownload() {
          this.loading = true;

          console.log(`[CD] 开始解析 ${comicInfo.title}`);

          try {
            await resolveAllPage(page => {
              if (canceled) {
                throw new Error('stop-download');
              }

              if (!this.pages.length) {
                this.pages = new Array(page.total).fill(null);
              }

              this.updatePage(page);

              this.pushDownloading(page);
            });

            comicInfo.finishedAt = new Date();

            this.loading = false;
            this.resolved = true;

            console.log(`[CD] 解析 ${comicInfo.title} 完毕`);
          } catch (e) {
            if (e.message !== 'stop-download') {
              console.error(e);
            }
          }
        },

        updatePage(page) {
          this.pages.splice(page.index - 1, 1, page);

          if (page.state === 'downloading') {
            this.$nextTick(() => {
              const loadingPage = this.$el.querySelector('.row.downloading');

              if (loadingPage) {
                loadingPage.scrollIntoView();
              }
            });
          }
        },

        pushDownloading(page) {
          threadPool.push(async () => {
            if (page.state === 'error') {
              this.failCount--;
            }

            this.updatePage({ ...page, state: 'downloading' });

            this.downloadingCount++;

            try {
              const buffer = await downloadImage(page.imageUrl, {
                onProgress: info => this.updatePage({ ...page, ...info, state: 'downloading' }),
                headers: { Referer: page.pageUrl, 'X-Alt-Referer': page.pageUrl, Cookie: document.cookie },
              });

              this.updatePage({ ...page, buffer, state: 'downloaded' });
              this.successCount++;

              if (this.successCount === this.pages.length && this.pages.every(ele => ele.buffer)) {
                this.finishedAt = new Date();
                this.exportPage('zip');
              }
            } catch (error) {
              this.failCount++;
              this.updatePage({ ...page, error, state: 'error' });
            } finally {
              this.downloadingCount--;

              if (
                this.successCount + this.failCount >= this.pages.length &&
                this.failCount > 0 &&
                confirm('下载未全部完成，是否重试？')
              ) {
                this.pages.filter(page => page.state === 'error').forEach(page => this.pushDownloading(page));
              }
            }
          });
        },

        exportPage(type) {
          const info = { ...comicInfo, pages: this.pages };

          if (type === 'zip') {
            exportZip(info);
          } else if (type === 'txt') {
            exportUrl(info);
          }
        },

        close() {
          document.getElementById('download-box-container').remove();
        },

        toggleFold() {
          this.fold = !this.fold;
        },
      },
    });
  }

  customElements.define(
    'download-box',
    class extends HTMLElement {
      constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = html;
      }

      connectedCallback() {
        this.vm = DownloadBox(this.shadowRoot.querySelector('.container'));
      }

      disconnectedCallback() {
        this.vm.$destroy();
      }
    }
  );

  customElements.define(
    'download-button',
    class extends HTMLAnchorElement {
      constructor() {
        super();

        this.addEventListener('click', this.download);
      }

      connectedCallback() {
        this.className = 'btn';
        this.style = 'width: 130px';
        this.innerText = '打包下载漫画';
      }

      download(event) {
        event.preventDefault();
        const box = document.getElementById('download-box');

        if (box && confirm('正在下载中，是否重新下载？')) {
          box.remove();
        }

        document.body.insertAdjacentHTML('beforeend', `<download-box id="download-box"></download-box>`);
      }
    },
    { extends: 'a' }
  );

  const panel = document.querySelector('.asTBcell.uwthumb');

  panel.appendChild(document.createElement('a', { is: 'download-button' }));

}());
