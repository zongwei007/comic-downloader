import { parseHTML, formatPageNumber } from './util';

async function requestPage(url, options) {
  const resp = await fetch(url, options);

  return await resp.text();
}

export async function resolvePage(pageUrl) {
  console.log(`[CD] 正在解析 ${pageUrl}`);

  const content = await requestPage(pageUrl);
  const doms = [...parseHTML(content)];
  const imageUrl = doms.find(ele => ele.id === 'photo_body').querySelector('#imgarea #picarea').src;
  const pagination = doms.find(ele => ele.className === 'newpagewrap');
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

export async function resolveAllPage(nextPage, onChange) {
  const pages = [];
  const pageUrls = new Set();

  do {
    const pageInfo = await resolvePage(nextPage);

    onChange(pageInfo);

    pages.push(pageInfo);
    pageUrls.add(pageInfo.pageUrl);

    nextPage = pageInfo.nextPage;
  } while (!pageUrls.has(nextPage));

  return pages;
}
