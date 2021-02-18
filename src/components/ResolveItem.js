import itemRoot from './ResolveItem.html';

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