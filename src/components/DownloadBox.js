import PageItem from './PageItem';

import { resolveAllPage } from '../resolve';
import { exportUrl, exportZip, downloadImage } from '../exportor';
import { createPromisePool } from '../util';

import html from './DownloadBox.html';

const DOWNLOAD_THREAD_LIMIT = 5;

function DownloadBox(el) {
  let canceled = false;

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
      exporting: false,
      fold: false,
      failCount: 0,
      loading: false,
      pages: [],
      pageTotal: 0,
      resolved: false,
      successCount: 0,
      title: null,
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

        for await (const page of resolveAllPage()) {
          if (canceled) {
            return;
          }

          if (!this.pageTotal) {
            this.pageTotal = page.total;
          }

          const length = this.pages.push(page);

          this.title = `已解析：${length}`;
          this.updatePage(page);
        }

        console.log(`[CD] 解析 ${comicInfo.title} 完毕`);

        this.resolved = true;

        await this.downloadAllPage();

        this.loading = false;
        this.title = null;
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

      async downloadAllPage() {
        const executors = this.pages
          .filter(page => page.state !== 'downloaded')
          .map(page => () => this.downloadPage(page));

        for await (const page of createPromisePool(executors, DOWNLOAD_THREAD_LIMIT)) {
          if (canceled) {
            return;
          }
          this.successCount++;
          this.title = `已下载：${this.successCount}`;

          this.updatePage(page);
        }

        if (this.successCount === this.pages.length && this.pages.every(ele => ele.buffer)) {
          this.finishedAt = comicInfo.finishedAt = new Date();
          await this.exportPage('zip');
        } else if (
          this.successCount + this.failCount >= this.pages.length &&
          this.failCount > 0 &&
          confirm('下载未全部完成，是否重试？')
        ) {
          return this.downloadAllPage();
        }
      },

      async downloadPage(page) {
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

          return { ...page, buffer, state: 'downloaded' };
        } catch (error) {
          this.failCount++;
          this.updatePage({ ...page, error, state: 'error' });
        } finally {
          this.downloadingCount--;
        }
      },

      async exportPage(type) {
        const info = { ...comicInfo, pages: this.pages };

        this.exporting = true;

        if (type === 'zip') {
          await exportZip(info, ({ percent, currentFile }) => {
            if (currentFile) {
              const fileName = currentFile.substring(currentFile.lastIndexOf('/') + 1);
              this.title = `正在导出：${fileName} | ${percent.toFixed(2)}%`;
            }
          });
        } else if (type === 'txt') {
          await exportUrl(info);
        }

        this.exporting = false;
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
