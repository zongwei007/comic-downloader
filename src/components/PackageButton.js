import { resolvePageUrl, resolveImageUrl } from '../resolve';
import { parseHTML, sleep } from '../util';
import ResultBox from './ResultBox';

export default function PackageButton() {
  const [btn] = parseHTML(`<a class="btn" style="width: 130px">打包下载漫画</a>`);

  btn.addEventListener('click', resolveAllUrl);

  return btn;
}

const HOME_PAGE_URL = location.href;

function resolveIndexPageUrl(index) {
  return HOME_PAGE_URL.replace('aid', `page-${index}-aid`);
}

async function resolveAllUrl(event) {
  try {
    event.preventDefault();

    console.log(`解析开始：${new Date().toISOString()}`);

    const result = [];

    const paginations = [...document.querySelectorAll('.bot_toolbar .paginator > a')];
    const lastPage = parseInt(paginations[paginations.length - 1].innerText);

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

    document.body.appendChild(ResultBox({ links: [title, ...result].join('\n') }));

    console.log(`解析完成：${new Date().toISOString()}`);
  } catch (e) {
    console.error(e);
  }
}
