import { parseHTML, formatPageNumber, createPromisePool } from './util';

export type Page = {
  buffer?: ArrayBuffer;
  error?: any;
  fileName: string;
  imageUrl: string;
  index: number;
  indexName: string;
  meta?: { loaded: number; total: number; progress: number; progressText: string };
  pageUrl: string;
  state: 'pending' | 'downloaded' | 'error' | 'downloading';
  total: number;
};

const HOME_PAGE_URL = location.href;
const DOWNLOAD_THREAD_LIMIT = 5;

function resolveIndexPageUrl(index: number) {
  return HOME_PAGE_URL.replace('aid', `page-${index}-aid`);
}

async function requestPage(url: string, options?: RequestInit): Promise<string> {
  const resp = await fetch(url, options);

  return await resp.text();
}

async function resolvePageUrl(indexPageUrl: string): Promise<string[]> {
  const content = parseHTML(await requestPage(indexPageUrl));

  return [...content.querySelectorAll<HTMLAnchorElement>('#bodywrap .gallary_wrap .gallary_item .pic_box a')].map(
    link => link.href
  );
}

async function resolvePage(pageUrl: string): Promise<Page> {
  console.log(`[CD] 正在解析 ${pageUrl}`);

  const content = parseHTML(await requestPage(pageUrl));
  const imageUrl = content.querySelector<HTMLImageElement>('#photo_body #imgarea #picarea').src;
  const pageLabels = content.querySelector<HTMLElement>('.newpagewrap .newpagelabel').innerText.split('/');
  const fileName = /[^/]+(?!.*\/)/.exec(imageUrl)[0];

  try {
    return {
      pageUrl,
      imageUrl,
      fileName,
      index: parseInt(pageLabels[0]),
      indexName: formatPageNumber(pageLabels[0], pageLabels[1].length) + '.' + /[^.]+(?!.*\.)/.exec(fileName),
      state: 'pending',
      total: parseInt(pageLabels[1]),
    };
  } finally {
    console.log(`[CD] 解析 ${pageUrl} 完成`);
  }
}

export async function* resolveAllPage(): AsyncGenerator<Page, void, unknown> {
  const paginations = document.querySelectorAll<HTMLElement>('.bot_toolbar .paginator > a');
  const lastPage = parseInt(paginations.item(paginations.length - 1)?.innerText || '1');
  const indexPageUrls = [];
  const pageUrls = [];

  for (let index = 1; index <= lastPage; index++) {
    indexPageUrls.push(resolveIndexPageUrl(index));
  }

  for await (const pages of createPromisePool(
    indexPageUrls.map(url => () => resolvePageUrl(url)),
    DOWNLOAD_THREAD_LIMIT
  )) {
    pageUrls.push(...pages);
  }

  for await (const page of createPromisePool(
    pageUrls.map(url => () => resolvePage(url)),
    DOWNLOAD_THREAD_LIMIT
  )) {
    yield page;
  }
}
