// ==UserScript==
// @name         批量打包下载漫画
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  解析漫画网站图片地址，下载图片并打包为 zip 文件，或导出为文本
// @match        www.wnacg.org/*
// @grant        GM_xmlhttpRequest
// @require      https://cdn.jsdelivr.net/npm/jszip@3.6.0/dist/jszip.min.js#sha256-MB+WKZmHMme2BRVKpDuIbfs6VlSdUIAY1VroUmE+p8g=
// @downloadURL  https://github.com/zongwei007/comic-downloader/raw/master/dist/comic-downloader.user.js
// @connect      wnacg.org
// @connect      wnacg.xyz
// @connect      wnacg.download
// ==/UserScript==

(function () {
  'use strict';

  function parseHTML(html) {
    const context = document.implementation.createHTMLDocument();

    // Set the base href for the created document so any parsed elements with URLs
    // are based on the document's URL
    const base = context.createElement('base');
    base.href = document.location.href;
    context.head.appendChild(base);

    context.body.innerHTML = html;

    return [...context.body.children];
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

  async function requestPage(url, options) {
    const resp = await fetch(url, options);

    return await resp.text();
  }

  async function resolvePage(pageUrl) {
    console.log(`[CD] 正在解析 ${pageUrl}`);

    const content = await requestPage(pageUrl);
    const doms = [...parseHTML(content)];
    const imageUrl = doms.find(ele => ele.id === 'photo_body').querySelector('#imgarea #picarea').src;
    const pagination = doms.find(ele => ele.className === 'newpagewrap');
    const pageLabels = pagination.querySelector('.newpagelabel').innerText.split('/');
    const fileName = /[^/]+(?!.*\/)/.exec(imageUrl)[0];

    return {
      pageUrl,
      imageUrl,
      fileName,
      index: parseInt(pageLabels[0]),
      indexName: formatPageNumber(pageLabels[0], pageLabels[1].length) + '.' + /[^.]+(?!.*\.)/.exec(fileName),
      state: 'pending',
      total: parseInt(pageLabels[1]),
      nextPage: pagination.querySelectorAll('.newpage .btntuzao').item(1).href,
    };
  }

  async function resolveAllPage(nextPage, onChange) {
    const pages = [];
    const pageUrls = new Set();

    do {
      const pageInfo = await resolvePage(nextPage);

      onChange(pageInfo);

      pages.push(pageInfo);
      pageUrls.add(pageInfo.pageUrl);

      nextPage = pageInfo.nextPage;
    } while (!pageUrls.has(nextPage));

    return pages;
  }

  customElements.define(
    'resolve-button',
    class extends HTMLAnchorElement {
      constructor() {
        super();

        this.addEventListener('click', this.resolve);
      }

      connectedCallback() {
        this.className = 'btn';
        this.style = 'width: 130px';
        this.innerText = '解析图片地址';
      }

      resolve(event) {
        event.preventDefault();

        (async () => {
          const title = document.querySelector('.userwrap h2').innerText;

          const resolveBox = document.createElement('resolve-box');

          resolveBox.setComicInfo({
            title,
            url: location.href,
            startedAt: new Date(),
            labels: [...document.querySelectorAll('.asTBcell.uwconn > label')].map(node => node.innerText.trim()),
            tags: [...document.querySelectorAll('.asTBcell.uwconn .addtags .tagshow')].map(node => node.innerText.trim()),
            introduction: document.querySelector('.asTBcell.uwconn > p').innerText.substring(3),
          });

          document.body.appendChild(resolveBox);

          resolveBox.loading = true;
          resolveBox.title = '正在解析';

          console.log(`[CD] 开始解析 ${title}`);

          const firstPageUrl = document.querySelector('.gallary_wrap .gallary_item .pic_box a').href;

          const pages = await resolveAllPage(firstPageUrl, pageInfo => {
            resolveBox.appendPage(pageInfo);
          });

          resolveBox.setComicInfo({
            pages,
            finishedAt: new Date(),
          });

          resolveBox.loading = false;
          resolveBox.title = '解析完毕';
          resolveBox.showButtons = true;
        })();
      }
    },
    { extends: 'a' }
  );

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

  async function exportZip(zip, info, { onProgress, onLoaded, onFail }) {
    const folder = zip.folder(info.title);

    for (const page of info.pages) {
      if (page.state === 'loaded') {
        continue;
      }

      try {
        const buffer = await downloadImage(page.imageUrl, {
          onProgress: info => onProgress({ page, ...info }),
          headers: { Referer: page.pageUrl, 'X-Alt-Referer': page.pageUrl, Cookie: document.cookie },
        });

        onLoaded({ page, buffer });

        folder.file(page.indexName, buffer);
      } catch (error) {
        onFail({ page, error });
      }
    }

    if (info.pages.every(page => page.state === 'loaded')) {
      const blob = await zip.generateAsync({ type: 'blob' });

      FileSaver_min.saveAs(blob, `${info.title}.zip`);

      return true;
    }

    return false;
  }

  function downloadImage(imageUrl, { onProgress, ...options }) {
    return new Promise((resolve, reject) => {
      let lastProgress = 0;
      let lastTimestamp = new Date().getTime();

      GM_xmlhttpRequest({
        ...options,
        method: 'GET',
        url: imageUrl,
        responseType: 'arraybuffer',
        timeout: 5 * 60 * 1000,
        headers,
        onprogress(res) {
          let speedText = '0 KB/s';

          const now = new Date().getTime();
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
            progress: res.lengthComputable ? res.loaded / res.total : '',
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

  var boxRoot = "<style>\n  .container {\n    position: fixed;\n    right: 0;\n    bottom: 0;\n    width: 33%;\n    height: 30%;\n    padding: 0.5rem;\n    background: #666;\n    border-top-right-radius: 5px;\n    border-top-left-radius: 5px;\n    border: 1px solid #333;\n    opacity: 98%;\n    color: #eee;\n  }\n\n  .container h4 {\n    margin: 0;\n  }\n\n  .btn-close,\n  .btn-folder {\n    float: right;\n    cursor: pointer;\n    padding: 0 5px;\n  }\n\n  .btn-folder::after {\n    display: inline;\n    content: '▼';\n  }\n\n  .spinner {\n    display: none;\n  }\n\n  .spinner::after {\n    content: '';\n    display: inline;\n    animation: loading-spinner;\n    animation-duration: 5s;\n    animation-iteration-count: infinite;\n  }\n\n  @keyframes loading-spinner {\n    20% {\n      content: '.';\n    }\n\n    40% {\n      content: '..';\n    }\n\n    60% {\n      content: '...';\n    }\n\n    80% {\n      content: '....';\n    }\n\n    100% {\n      content: '.....';\n    }\n  }\n\n  .loading .spinner {\n    display: inline;\n  }\n\n  .list {\n    width: 100%;\n    max-height: calc(100% - 60px);\n    overflow: auto;\n  }\n\n  .list .row {\n    display: flex;\n  }\n\n  .progress {\n    height: 15px;\n    overflow: hidden;\n    border: 1px solid #eee;\n  }\n\n  .progress > .progress-bar {\n    float: left;\n    height: 100%;\n    color: #333;\n    text-align: center;\n    background-color: #eee;\n  }\n\n  .toolbar {\n    height: 60px;\n    display: none;\n    padding-top: 10px;\n  }\n\n  .toolbar > div {\n    flex: 1;\n  }\n\n  .toolbar > .buttons {\n    text-align: right;\n  }\n\n  .status-successed {\n    color: #126612;\n  }\n\n  .status-failed {\n    color: #b60202;\n  }\n\n  .fold .btn-folder::after {\n    content: '▲';\n  }\n\n  .fold.container {\n    height: 15px;\n  }\n\n  .fold .list,\n  .fold .toolbar {\n    display: none;\n  }\n\n  .resolved .toolbar {\n    display: flex;\n  }\n</style>\n<div class=\"container\">\n  <h4>\n    <span class=\"title\"></span>\n    <span class=\"spinner\"></span>\n    <a class=\"btn-close\">╳</a>\n    <a class=\"btn-folder\"></a>\n  </h4>\n  <hr />\n  <div class=\"list\">\n    <resolve-item class=\"header\">\n      <span slot=\"index\">序号</span>\n      <span slot=\"url\">页面</span>\n      <span slot=\"state\">状态</span>\n    </resolve-item>\n  </div>\n  <div class=\"toolbar\">\n    <div class=\"download-status\">\n      已下载：<span class=\"status-successed\">0</span> / <span class=\"status-total\">0</span>\n    </div>\n    <div class=\"buttons\">\n      <button class=\"btn-export-url\">导出 URL</button>\n      <button class=\"btn-export-zip\">打包下载</button>\n    </div>\n  </div>\n</div>\n";

  const progressTemplate = tpl(`
<div class="progress">
  <div class="progress-bar" style="width:\${progress}%">\${progressText}</div>
</div>
`);

  const STATE_MAP = {
    error: '下载失败',
    pending: '准备下载',
    loading: '下载中',
    loaded: '已下载',
  };

  customElements.define(
    'resolve-box',
    class extends HTMLElement {
      constructor() {
        super();

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = boxRoot;
        this.comicInfo = {};
      }

      connectedCallback() {
        this.container = this.shadowRoot.querySelector('.container');
        this.container.querySelector('.btn-close').addEventListener('click', () => this.remove());
        this.container
          .querySelector('.btn-folder')
          .addEventListener('click', () => this.container.classList.toggle('fold'));
        this.container.querySelector('.btn-export-url').addEventListener('click', () => exportUrl(this.comicInfo));
        this.container.querySelector('.btn-export-zip').addEventListener('click', this.handleExportZip.bind(this));
      }

      setComicInfo(info) {
        Object.assign(this.comicInfo, info);
      }

      appendPage(pageInfo) {
        if (!this.comicInfo.pageTotal) {
          this.comicInfo.pageTotal = this.total = pageInfo.total;
        }

        const container = this.container.querySelector('.list');

        container.insertAdjacentHTML(
          'beforeend',
          `<resolve-item id="resolve-image-${pageInfo.index}">
          <span slot="index">${pageInfo.index}</span>
          <span slot="url">${pageInfo.pageUrl}</span>
          <span slot="state">${STATE_MAP[pageInfo.state]}</span>
        </resolve-item>`
        );

        container.scrollTo({ top: container.scrollHeight });
      }

      async handleExportZip() {
        this.loading = true;
        this.title = '正在打包';
        this.loadedPage = new Set();

        if (!this.zip) {
          this.zip = new JSZip();
        }

        const flag = await exportZip(this.zip, this.comicInfo, {
          onProgress: this.handleDownloadProgress.bind(this),
          onLoaded: this.handleDownloadSuccess.bind(this),
          onFail: this.handleDownloadFail.bind(this),
        });

        this.loading = false;

        if (flag) {
          this.title = '打包完毕';
          this.zip = null;
          this.remove();
        } else {
          this.title = '打包失败，请重试';
        }
      }

      handleDownloadProgress({ page, progress, progressText }) {
        const progressInfo = progress
          ? progressTemplate({
              progress: progress * 100,
              progressText,
            })
          : null;

        const pageItem = this.updatePageState(page, 'loading', progressInfo);
        pageItem.scrollIntoView();
      }

      handleDownloadSuccess({ page }) {
        this.loadedPage.add(page.pageUrl);
        this.container.querySelector('.status-successed').innerText = this.loadedPage.size;

        this.updatePageState(page, 'loaded');
      }

      handleDownloadFail({ page }) {
        this.updatePageState(page, 'error');
      }

      updatePageState(page, state, info) {
        page.state = state;

        const pageItem = this.container.querySelector(`#resolve-image-${page.index}`);
        const spans = [...pageItem.querySelectorAll('span')];

        spans[1].innerHTML = info || page.pageUrl;
        spans[2].innerText = STATE_MAP[state];

        return pageItem;
      }

      set loading(flag) {
        if (flag) {
          this.container.classList.add('loading');
        } else {
          this.container.classList.remove('loading');
        }
      }

      set title(title) {
        this.container.querySelector('.title').innerText = title;
      }

      set total(num) {
        this.container.querySelector('.status-total').innerText = num;
      }

      set showButtons(flag) {
        if (flag) {
          this.container.classList.add('resolved');
        } else {
          this.container.classList.remove('resolved');
        }
      }
    }
  );

  var itemRoot = "<style>\n  :host > div {\n    padding: 5px;\n    flex: 1;\n  }\n\n  :host > div.index {\n    width: 40px;\n    text-align: right;\n    flex: 0 1 auto;\n  }\n\n  :host > div.state {\n    width: 60px;\n    flex: 0 1 auto;\n  }\n</style>\n<div class=\"index\"><slot name=\"index\">1</slot></div>\n<div><slot name=\"url\">url</slot></div>\n<div class=\"state\"><slot name=\"state\">pending</slot></div>\n";

  customElements.define(
    'resolve-item',
    class extends HTMLElement {
      constructor() {
        super();
        
        this.classList.add('row');
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = itemRoot;
      }
    }
  );

  const panel = document.querySelector('.asTBcell.uwthumb');

  panel.appendChild(document.createElement('a', { is: 'resolve-button' }));

}());