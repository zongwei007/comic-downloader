import PageItem from './PageItem';

import { resolveAllPage } from '../resolve';
import { exportUrl, exportZip, downloadImage } from '../exportor';
import { promisePool } from '../util';

import html from './DownloadBox.html';

const DOWNLOAD_THREAD_LIMIT = 5;

function DownloadBox(el) {
  let canceled = false;

  const threadPool = promisePool(DOWNLOAD_THREAD_LIMIT);

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
