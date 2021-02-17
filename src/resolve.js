import { appendFloatBox } from './ui';

const HOME_PAGE_URL = location.href;

function requestPage(url, options) {
  return fetch(url, options).then(resp => resp.text());
}

function resolveIndexPageUrl(index) {
  return HOME_PAGE_URL.replace('aid', `page-${index}-aid`);
}

async function resolvePageUrl(indexPageUrl) {
  const content = await requestPage(indexPageUrl);

  return [...parseHTML(content)]
    .reduce((memo, ele) => {
      if (ele.id !== 'bodywrap') {
        return memo;
      }

      return [...memo, ...ele.querySelectorAll('.gallary_wrap .gallary_item .pic_box a')];
    }, [])
    .map(link => link.href);
}

async function resolveImageUrl(pageUrl) {
  const content = await requestPage(pageUrl);

  return [...parseHTML(content)]
    .find(ele => ele.id === 'photo_body')
    .querySelector('#imgarea #picarea').src;
}

async function sleep(time) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), time);
  });
}

export async function resolveAllUrl(event) {
  try {
    event.preventDefault();

    console.log(`解析开始：${new Date().toISOString()}`);

    const result = [];

    const paginations = [...document.querySelectorAll('.bot_toolbar .paginator a')];
    const lastPage = parseInt(paginations[paginations.length - 2].innerText);

    for (let index = 1; index <= lastPage; index++) {
      const indexPageUrl = resolveIndexPageUrl(index);
      const pageUrls = await resolvePageUrl(indexPageUrl);

      for (let pageUrl of pageUrls) {
        await sleep(1000);

        result.push(await resolveImageUrl(pageUrl));
      }

      console.log(`成功解析页面 ${indexPageUrl}`);
    }

    const title = $('.userwrap h2').text();

    appendFloatBox([title, ...result].join('\n'));

    console.log(`解析完成：${new Date().toISOString()}`);
  } catch (e) {
    console.error(e);
  }
}

function parseHTML(html) {
  const context = document.implementation.createHTMLDocument();

  // Set the base href for the created document so any parsed elements with URLs
  // are based on the document's URL
  const base = context.createElement('base');
  base.href = document.location.href;
  context.head.appendChild(base);

  context.body.innerHTML = html;
  return context.body.children;
}
