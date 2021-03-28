import DownloadBox from './DownloadBox.svelte';

customElements.define(
  'download-button',
  class extends HTMLAnchorElement {
    private box: DownloadBox = null;

    constructor() {
      super();

      this.addEventListener('click', this.showBox);
    }

    connectedCallback() {
      this.className = 'btn';
      this.style.width = '130px';
      this.innerText = '打包下载漫画';
    }

    showBox(event: MouseEvent) {
      event.preventDefault();

      if (this.box && confirm('正在下载中，是否重新下载？')) {
        this.closeBox();
      }

      let container = document.getElementById('download-box');
      if (!container) {
        container = document.createElement('div');
        container.id = 'download-box';

        document.body.appendChild(container);
      }

      this.box = new DownloadBox({
        target: container,
        props: {
          onClose: () => this.closeBox(),
        },
      });
    }

    closeBox() {
      if (this.box) {
        this.box.$destroy();
        this.box = null;
      }
    }
  },
  { extends: 'a' }
);
