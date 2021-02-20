import { parseHTML, formatPageNumber, promisePool } from './util';

const HOME_PAGE_URL = location.href;
const DOWNLOAD_THREAD_LIMIT = 5;

const threadPool = promisePool(DOWNLOAD_THREAD_LIMIT);

function resolveIndexPageUrl(index) {
  return HOME_PAGE_URL.replace('aid', `page-${index}-aid`);
}

async function requestPage(url, options) {
  const resp = await fetch(url, options);

  return await resp.text();
}

async function resolvePageUrl(indexPageUrl, onChange) {
  const content = parseHTML(await requestPage(indexPageUrl));
  const links = [...content.querySelectorAll('#bodywrap .gallary_wrap .gallary_item .pic_box a')].map(
    link => link.href
  );

  return new Promise((resolve, reject) => {
    const pages = [];

    for (const pageUrl of links) {
      threadPool.push(() =>
        resolvePage(pageUrl).then(page => {
          pages.push(page);

          onChange(page);

          console.log(`[CD] 解析 ${pageUrl} 完成`);

          if (pages.length === links.length) {
            resolve(pages);
          }
        }, reject)
      );
    }
  });
}

async function resolvePage(pageUrl) {
  console.log(`[CD] 正在解析 ${pageUrl}`);

  const content = parseHTML(await requestPage(pageUrl));
  const imageUrl = content.querySelector('#photo_body #imgarea #picarea').src;
  const pageLabels = content.querySelector('.newpagewrap .newpagelabel').innerText.split('/');
  const fileName = /[^/]+(?!.*\/)/.exec(imageUrl)[0];

  return {
    pageUrl,
    imageUrl,
    fileName,
    index: parseInt(pageLabels[0]),
    indexName: formatPageNumber(pageLabels[0], pageLabels[1].length) + '.' + /[^.]+(?!.*\.)/.exec(fileName),
    state: 'pending',
    total: parseInt(pageLabels[1]),
  };
}

export function resolveAllPage(onChange) {
  const paginations = document.querySelectorAll('.bot_toolbar .paginator > a');
  const lastPage = parseInt(paginations.item(paginations.length - 1).innerText);

  return new Promise((resolve, reject) => {
    let resolved = 0;
    const allPages = [];

    for (let index = 1; index <= lastPage; index++) {
      threadPool.push(() =>
        resolvePageUrl(resolveIndexPageUrl(index), onChange).then(pages => {
          resolved++;
          allPages.push(...pages);

          if (resolved >= lastPage) {
            resolve(allPages);
          }
        }, reject)
      );
    }
  });
}
