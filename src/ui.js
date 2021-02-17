export function appendButton(callback) {
  const button = document.createElement('a');
  button.className = 'btn js-resolve-all-url';
  button.style = 'width: 130px';
  button.href = '#';
  button.innerText = '解析所有图片链接';

  document.querySelector('.asTBcell.uwthumb').appendChild(button);

  document.querySelector('.js-resolve-all-url').addEventListener('click', callback);
}

export function appendFloatBox(links) {
  const box = document.createElement('div');
  box.className = 'js-float-result-box';
  box.style =
    'position: absolute;top: 50%;left: 50%;width: 200px;height: 150px;padding: 20px;background: #fff;border-radius: 5px;border: 1px solid #333;margin-left: -100px;';
  box.innerHTML = `<textarea style="width: 100%;height: 90%;">${links}</textarea>
    <button class="js-float-result-box-close-btn">关闭</button>`;

  document.body.appendChild(box);

  document
    .querySelector('.js-float-result-box-close-btn')
    .addEventListener('click', () => document.querySelector('.js-float-result-box').remove());
}
