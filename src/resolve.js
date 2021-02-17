import { parseHTML } from './util';

function requestPage(url, options) {
  return fetch(url, options).then(resp => resp.text());
}

export async function resolvePageUrl(indexPageUrl) {
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

export async function resolveImageUrl(pageUrl) {
  const content = await requestPage(pageUrl);

  return [...parseHTML(content)].find(ele => ele.id === 'photo_body').querySelector('#imgarea #picarea').src;
}
