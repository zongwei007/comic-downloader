import { exportUrl, exportZip } from '../exportor';
import { tpl } from '../util';

import boxRoot from './ResolveBox.html';

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
