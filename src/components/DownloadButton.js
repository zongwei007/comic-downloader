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
      this.innerText = '解析图片地址';
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
