import { parseHTML, formatPageNumber } from './util';

async function requestPage(url, options) {
  const resp = await fetch(url, options);

  return await resp.text();
}

export async function resolvePage(pageUrl) {
  console.log(`[CD] 正在解析 ${pageUrl}`);

  const content = parseHTML(await requestPage(pageUrl));
  const imageUrl = content.querySelector('#photo_body #imgarea #picarea').src;
  const pagination = content.querySelector('.newpagewrap');
  const pageLabels = pagination.querySelector('.newpagelabel').innerText.split('/');
  const fileName = /[^/]+(?!.*\/)/.exec(imageUrl)[0];

  return {
    pageUrl,
    imageUrl,
    fileName,
    index: parseInt(pageLabels[0]),
    indexName: formatPageNumber(pageLabels[0], pageLabels[1].length) + '.' + /[^.]+(?!.*\.)/.exec(fileName),
    state: 'pending',
    total: parseInt(pageLabels[1]),
    nextPage: pagination.querySelectorAll('.newpage .btntuzao').item(1).href,
  };
}

export async function resolveAllPage(onChange) {
  const pages = [];
  const pageUrls = new Set();

  let nextPage = document.querySelector('.gallary_wrap .gallary_item .pic_box a').href;

  do {
    const pageInfo = await resolvePage(nextPage);

    onChange([pageInfo]);

    pages.push(pageInfo);
    pageUrls.add(pageInfo.pageUrl);

    nextPage = pageInfo.nextPage;
  } while (!pageUrls.has(nextPage));

  return pages;
}
