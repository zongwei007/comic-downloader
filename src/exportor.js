import { saveAs } from 'file-saver';
import { tpl } from './util';

const textInfoTemplate = tpl(`
\${title}
\${url}
\${labels.join('\\n')}
标签：\${tags.join(' ')}
简介：\${introduction}

页面地址：
\${pages.map(page => page.pageUrl).join('\\n')}

图片地址：
\${pages.map(page => page.imageUrl).join('\\n')}

文件名映射：
\${pages.map(page => page.fileName + ' ' + page.indexName).join('\\n')}
`);

export async function exportUrl(info) {
  const blob = new Blob([textInfoTemplate(info)], { type: 'text/plain;charset=utf-8' });

  saveAs(blob, `${info.title}.info.txt`);
}

export async function exportZip(zip, info, { onProgress, onLoaded, onFail }) {
  const folder = zip.folder(info.title);

  for (const page of info.pages) {
    if (page.state === 'loaded') {
      continue;
    }

    try {
      const buffer = await downloadImage(page.imageUrl, {
        onProgress: info => onProgress({ page, ...info }),
        headers: { Referer: page.pageUrl, 'X-Alt-Referer': page.pageUrl, Cookie: document.cookie },
      });

      onLoaded({ page, buffer });

      folder.file(page.indexName, buffer);
    } catch (error) {
      onFail({ page, error });
    }
  }

  if (info.pages.every(page => page.state === 'loaded')) {
    const blob = await zip.generateAsync({ type: 'blob' });

    saveAs(blob, `${info.title}.zip`);

    return true;
  }

  return false;
}

function downloadImage(imageUrl, { onProgress, ...options }) {
  return new Promise((resolve, reject) => {
    let lastProgress = 0;
    let lastTimestamp = new Date().getTime();

    GM_xmlhttpRequest({
      ...options,
      method: 'GET',
      url: imageUrl,
      responseType: 'arraybuffer',
      timeout: 5 * 60 * 1000,
      headers,
      onprogress(res) {
        let speedText = '0 KB/s';

        const now = new Date().getTime();
        const speedKBs = res.lengthComputable
          ? Number((res.loaded - lastProgress) / (now - lastTimestamp) / 1.024)
          : -1;

        if (now - lastTimestamp >= 1000 || lastProgress === 0) {
          speedText = res.lengthComputable ? `${speedKBs.toFixed(2)} KB/s` : '';
          lastProgress = res.loaded;
          lastTimestamp = now;
        }

        onProgress({
          loaded: res.loaded,
          total: res.total,
          progress: res.lengthComputable ? res.loaded / res.total : '',
          progressText: speedText,
        });
      },
      onload(res) {
        try {
          // cache them to reduce waiting time and CPU usage on Chrome with Tampermonkey
          // (Tampermonkey uses a dirty way to give res.response, transfer string to arraybuffer every time)
          // now store progress just spent ~1s instead of ~8s
          var response = res.response;
          var byteLength = response.byteLength;
          var responseHeaders = res.responseHeaders;

          // use regex to fixed compatibility with http/2, as its headers are lower case (at least fixed with Yandex Turbo)
          var mime = responseHeaders.match(/Content-Type:/i)
            ? responseHeaders
                .split(/Content-Type:/i)[1]
                .split('\n')[0]
                .trim()
                .split('/')
            : ['', ''];
          var responseText;
          if (mime[0] === 'text') {
            responseText = new TextDecoder().decode(new DataView(response));
          }

          if (!response) {
            reject(new Error(`[CD] Image ${imageUrl} download fail: Return empty response`));
            return;
          }
          if (byteLength === 925) {
            // '403 Access Denied' Image Byte Size
            // GM_xhr only support abort()
            reject(new Error(`[CD] Image ${imageUrl} download fail: 403 Access Denied`));
            return;
          }
          if (byteLength === 28) {
            // 'An error has occurred. (403)' Length
            reject(`[CD] Image ${imageUrl} download fail: An error has occurred. (403)`);
            return;
          }

          // res.status should be detected at here, because we should know are we reached image limits at first
          if (res.status !== 200) {
            reject(new Error(`[CD] Image ${imageUrl} download fail: Wrong response status (${res.status})`));
            return;
          }

          resolve(response);
        } catch (error) {
          console.error(error);

          reject(new Error(`[CD] Image ${imageUrl} download fail: Unknown error (Please send feedback)`));
        }
      },
      onerror(res) {
        reject(new Error(`[CD] Image ${imageUrl} download fail: Network Error`));
      },
      ontimeout(res) {
        reject(new Error(`[CD] Image ${imageUrl} download fail: Timed Out`));
      },
    });
  });
}
