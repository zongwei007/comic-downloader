import boxRoot from './ResolveBox.html';

const STATE_MAP = {
  pending: '准备下载',
};

customElements.define(
  'resolve-box',
  class extends HTMLElement {
    constructor() {
      super();

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML = boxRoot;
      this.container = this.shadowRoot.querySelector('.container');

      this.container.querySelector('.btn-close').addEventListener('click', () => this.remove());
      this.container
        .querySelector('.btn-folder')
        .addEventListener('click', () => this.container.classList.toggle('fold'));
    }

    appendPage(pageInfo) {
      const container = this.container.querySelector('.list');
      container.innerHTML += `
        <resolve-item>
          <span slot="index">${pageInfo.index}</span>
          <span slot="url">${pageInfo.pageUrl}</span>
          <span slot="state">${STATE_MAP[pageInfo.state]}</span>
        </resolve-item>
      `;

      container.scrollTo({ top: container.scrollHeight });
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

    set successed(num) {
      this.container.querySelector('.status-successed').innerText = num;
    }

    set failed(num) {
      this.container.querySelector('.status-failed').innerText = num;
    }
  }
);
