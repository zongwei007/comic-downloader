import { resolveAllPage } from '../resolve';
import { exportUrl, exportZip } from '../exportor';

customElements.define(
  'resolve-button',
  class extends HTMLAnchorElement {
    constructor() {
      super();

      this.addEventListener('click', this.resolve);

      this.comicInfo = {
        url: location.href,
      };
    }

    connectedCallback() {
      this.className = 'btn';
      this.style = 'width: 130px';
      this.innerText = '解析图片地址';
    }

    resolve(event) {
      event.preventDefault();

      (async () => {
        const title = (this.comicInfo.title = document.querySelector('.userwrap h2').innerText);
        this.comicInfo.startedAt = new Date();
        this.comicInfo.labels = [...document.querySelectorAll('.asTBcell.uwconn > label')].map(node =>
          node.innerText.trim()
        );
        this.comicInfo.tags = [...document.querySelectorAll('.asTBcell.uwconn .addtags .tagshow')].map(node =>
          node.innerText.trim()
        );
        this.comicInfo.introduction = document.querySelector('.asTBcell.uwconn > p').innerText.substring(3);

        const resolveBox = document.createElement('resolve-box');

        document.body.appendChild(resolveBox);
        resolveBox.container
          .querySelector('.btn-export-url')
          .addEventListener('click', () => exportUrl(this.comicInfo));
        resolveBox.container
          .querySelector('.btn-export-zip')
          .addEventListener('click', () => exportZip(this.comicInfo));

        resolveBox.loading = true;
        resolveBox.title = '正在解析';

        console.log(`[CD] 开始解析 ${title}`);

        const firstPageUrl = document.querySelector('.gallary_wrap .gallary_item .pic_box a').href;

        this.comicInfo.pages = await resolveAllPage(firstPageUrl, pageInfo => {
          if (!this.comicInfo.pageTotal) {
            this.comicInfo.pageTotal = resolveBox.total = pageInfo.total;
          }

          resolveBox.appendPage(pageInfo);
        });

        this.comicInfo.finishedAt = new Date();

        resolveBox.loading = false;
        resolveBox.title = '解析完毕';
        resolveBox.showButtons = true;
      })();
    }
  },
  { extends: 'a' }
);
