import { resolveAllPage } from '../resolve';
import { exportUrl, exportZip, downloadImage } from '../exportor';
import { tpl } from '../util';

import boxRoot from './DownloadBox.html';

const progressTemplate = tpl(`
<div class="progress">
  <div class="progress-bar" style="width:\${progress}%">\${progressText}</div>
</div>
`);

const STATE_MAP = {
  error: '下载失败',
  pending: '准备下载',
  downloading: '下载中',
  downloaded: '已下载',
};

const DOWNLOAD_THREAD_LIMIT = 5;

customElements.define(
  'download-box',
  class extends HTMLElement {
    constructor() {
      super();

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = boxRoot;

      this.stopDownload = false;
      this.startedAt = new Date();
      this.finishedAt = null;
      this._pages = [];
      this._downloadingCount = 0;
      this._successCount = 0;
      this._failCount = 0;
      this.title = document.querySelector('.userwrap h2').innerText;

      this._pageInfo = {
        url: location.href,
        labels: [...document.querySelectorAll('.asTBcell.uwconn > label')].map(node => node.innerText.trim()),
        tags: [...document.querySelectorAll('.asTBcell.uwconn .addtags .tagshow')].map(node => node.innerText.trim()),
        introduction: document.querySelector('.asTBcell.uwconn > p').innerText.substring(3),
      };
    }

    connectedCallback() {
      this.container = this.shadowRoot.querySelector('.container');
      this.container.querySelector('.btn-close').addEventListener('click', () => this.remove());
      this.container
        .querySelector('.btn-folder')
        .addEventListener('click', () => this.container.classList.toggle('fold'));
      this.container.querySelector('.btn-export-url').addEventListener('click', () => this.exportPage('txt'));
      this.container.querySelector('.btn-export-zip').addEventListener('click', () => this.exportPage('zip'));

      this.startDownload();
    }

    disconnectedCallback() {
      this.stopDownload = true;
    }

    async startDownload() {
      this.loading = true;

      console.log(`[CD] 开始解析 ${this.title}`);

      try {
        await resolveAllPage(pageInfo => {
          if (this.stopDownload) {
            throw new Error('stop-download');
          }

          if (!this.pages.length) {
            this.pages = new Array(pageInfo[0].total).fill(null);
          }

          this.pushPage(...pageInfo);
        });

        this.finishedAt = new Date();
        this.loading = false;
        this.resolved = true;

        console.log(`[CD] 解析 ${this.title} 完毕`);
      } catch (e) {
        if (e.message !== 'stop-download') {
          console.error(e);
        }
      }
    }

    pushPage(...pageInfo) {
      if (!pageInfo.length) {
        return;
      }

      const container = this.container.querySelector('.list');

      pageInfo.forEach(page => this.updatePage(page));

      container.scrollTo({ top: container.scrollHeight });

      this.pushDownloading();
    }

    updatePage({ progress = 0, progressText = '', ...page }) {
      this.pages[page.index - 1] = page;

      const container = this.container.querySelector('.list');
      const ele = container.querySelector(`#resolve-image-${page.index}`);
      const html = `
        <span slot="index">${page.index}</span>
        <span slot="url">${
          page.state === 'downloading' ? progressTemplate({ progress: progress * 100, progressText }) : page.pageUrl
        }</span>
        <span slot="state">${STATE_MAP[page.state]}</span>
      `;

      if (ele) {
        ele.innerHTML = html;
      } else {
        container.insertAdjacentHTML(
          'beforeend',
          `<resolve-item id="resolve-image-${page.index}">
            ${html}
           </resolve-item>
          `
        );
      }
    }

    pushDownloading() {
      while (this.downloadingCount < DOWNLOAD_THREAD_LIMIT) {
        const page = this.pages.find(ele => ele?.state === 'pending');

        if (!page) {
          break;
        }

        if (page.state === 'error') {
          this.failCount--;
        }

        this.updatePage({ ...page, state: 'downloading' });

        downloadImage(page.imageUrl, {
          onProgress: info => this.updatePage({ ...page, ...info, state: 'downloading' }),
          headers: { Referer: page.pageUrl, 'X-Alt-Referer': page.pageUrl, Cookie: document.cookie },
        })
          .then(buffer => {
            this.successCount++;
            this.updatePage({ ...page, buffer, state: 'downloaded' });

            if (this.successCount === this.pages.length && this.pages.every(ele => ele.buffer)) {
              this.finishedAt = new Date();
              this.exportPage('zip');
            }
          })
          .catch(error => {
            this.failCount++;
            this.updatePage({ ...page, error, state: 'error' });
          })
          .finally(() => {
            this.downloadingCount--;

            if (this.successCount + this.failCount <= this.pages.length) {
              this.pushDownloading();
            } else if (this.failCount > 0 && confirm('下载未全部完成，是否重试？')) {
              this.pushDownloading();
            }
          });

        this.downloadingCount++;
      }
    }

    exportPage(type) {
      const info = {
        ...this._pageInfo,
        title: this.title,
        finishedAt: this.finishedAt,
        pages: this.pages,
        startedAt: this.startedAt,
      };

      if (type === 'zip') {
        exportZip(info);
      } else if (type === 'txt') {
        exportUrl(info);
      }
    }

    updateState() {
      this.container.querySelector('.title').innerText = `
        总页数：${this.pages.length} | 正在下载：${this.downloadingCount} | 已下载：${this.successCount} | 失败：${this.failCount}
      `.trim();
    }

    get pages() {
      return this._pages;
    }

    set pages(items) {
      this._pages = items;
      this.updateState();
    }

    get downloadingCount() {
      return this._downloadingCount;
    }

    set downloadingCount(num) {
      this._downloadingCount = num;
      this.updateState();
    }

    get successCount() {
      return this._successCount;
    }

    set successCount(num) {
      this._successCount = num;
      this.updateState();
    }

    get failCount() {
      return this._failCount;
    }

    set failCount(num) {
      this._failCount = num;
      this.updateState();
    }

    set loading(flag) {
      if (flag) {
        this.container.classList.add('loading');
      } else {
        this.container.classList.remove('loading');
      }
    }

    set resolved(flag) {
      if (flag) {
        this.container.classList.add('resolved');
      } else {
        this.container.classList.remove('resolved');
      }
    }
  }
);
