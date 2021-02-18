import { resolveAllPage } from '../resolve';

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
