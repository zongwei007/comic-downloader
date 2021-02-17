import { parseHTML, tpl } from '../util';
import { className } from './ResultBox.css';

const template = tpl(`
<div class="\${className.container}">
  <textarea>\${links}</textarea>
  <button class="btn-close">关闭</button>
</div>
`);

export default function ResultBox({ links }) {
  const [bx] = parseHTML(template({ links, className }));

  bx.querySelector(`.btn-close`).addEventListener('click', () => bx.remove());

  return bx;
}
