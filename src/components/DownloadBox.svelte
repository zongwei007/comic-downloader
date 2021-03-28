<script context="module">
  const DOWNLOAD_THREAD_LIMIT = 5;
</script>

<script lang="ts">
  import { onMount, onDestroy, tick } from 'svelte';

  import state from './DownloadState';
  import type { Page } from '../resolve';
  import { resolveAllPage } from '../resolve';
  import { downloadImage, exportZip, exportUrl } from '../exportor';
  import { createPromisePool } from '../util';

  import PageList from './PageList.svelte';

  export let onClose: () => void;

  let canceled = false;
  let el: HTMLElement = null;

  function handleToggleFold() {
    state.setFold(!$state.fold);
  }

  function handleExportPage(type: 'txt' | 'zip') {
    return async () => {
      const info = { ...$state.description, pages: $state.pages };

      state.setExporting(true);

      if (type === 'zip') {
        await exportZip(info, ({ percent, currentFile }) => {
          if (currentFile) {
            const fileName = currentFile.substring(currentFile.lastIndexOf('/') + 1);
            state.setTitle(`正在导出：${fileName} | ${percent.toFixed(2)}%`);
          }
        });
      } else if (type === 'txt') {
        await exportUrl(info);
      }

      state.setExporting(false);
    };
  }

  async function handleStart() {
    const comicInfo = {
      finishedAt: null,
      introduction: document.querySelector<HTMLElement>('.asTBcell.uwconn > p').innerText.substring(3),
      labels: [...document.querySelectorAll<HTMLElement>('.asTBcell.uwconn > label')].map(node =>
        node.innerText.trim()
      ),
      startedAt: new Date(),
      tags: [...document.querySelectorAll<HTMLElement>('.asTBcell.uwconn .addtags .tagshow')].map(node =>
        node.innerText.trim()
      ),
      title: document.querySelector<HTMLElement>('.userwrap h2').innerText,
      url: location.href,
    };

    state.setLoading(true);
    state.setDescription(comicInfo);

    console.log(`[CD] 开始解析 ${comicInfo.title}`);

    for await (const page of resolveAllPage()) {
      if (canceled) {
        return;
      }

      if (!$state.pageTotal) {
        state.setPageTotal(page.total);
      }

      state.setTitle(`已解析：${$state.pages.length + 1}`);
      state.addPage(page);
    }

    console.log(`[CD] 解析 ${comicInfo.title} 完毕`);

    state.setResolved(true);

    await downloadAllPage();

    state.setLoading(false);
    state.setTitle(null);
  }

  async function downloadAllPage(): Promise<void> {
    const executors = $state.pages.filter(page => page.state !== 'downloaded').map(page => () => downloadPage(page));

    for await (const _void of createPromisePool(executors, DOWNLOAD_THREAD_LIMIT)) {
      if (canceled) {
        return;
      }

      state.setTitle(`已下载：${$state.downloadingCount}`);
    }

    while (
      !canceled &&
      $state.successCount + $state.failCount >= $state.pages.length &&
      $state.failCount > 0 &&
      confirm('下载未全部完成，是否重试？')
    ) {
      await downloadAllPage();
    }

    if ($state.successCount === $state.pages.length && $state.pages.every(ele => ele.buffer)) {
      state.setDescription({ ...$state.description, finishedAt: new Date() });

      await handleExportPage('zip')();
    }
  }

  async function downloadPage(page: Page): Promise<void> {
    state.updatePage({ ...page, error: null, state: 'downloading' });

    tick().then(() => el.querySelector('.row.downloading')?.scrollIntoView());

    try {
      const buffer = await downloadImage(page.imageUrl, {
        onProgress: meta => state.updatePage({ ...page, meta, state: 'downloading' }),
        headers: { Referer: page.pageUrl, 'X-Alt-Referer': page.pageUrl, Cookie: document.cookie },
      });

      state.updatePage({ ...page, buffer, state: 'downloaded', meta: null });
    } catch (error) {
      state.updatePage({ ...page, error, state: 'error', meta: null });
    }
  }

  onMount(handleStart);
  onDestroy(() => (canceled = true));
</script>

<div class="container" class:fold={$state.fold} bind:this={el}>
  <h4>
    {#if $state.title}
      <span>{$state.title} | </span>
    {/if}
    <span> 总页数：{$state.pageTotal} | 正在下载：{$state.downloadingCount} | 失败：{$state.failCount} </span>
    {#if $state.loading}
      <span class="spinner" />
    {/if}
    <button class="btn-close" on:click={onClose}>╳</button>
    <button class="btn-folder" on:click={handleToggleFold} />
  </h4>
  {#if !$state.fold}
    <hr />
    <PageList data={$state.pages} />
  {/if}
  {#if !$state.fold && $state.resolved}
    <div class="toolbar">
      <div class="download-status" />
      <div class="buttons">
        <button class="btn-export-url" on:click={handleExportPage('txt')}>导出 URL</button>
        <button class="btn-export-zip" disabled={$state.exporting} on:click={handleExportPage('zip')}>导出 ZIP</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    background: #666;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    border: 1px solid #333;
    bottom: 0;
    color: #eee;
    font-size: 14px;
    height: 30%;
    margin: 0;
    opacity: 98%;
    padding: 0.5rem;
    position: fixed;
    right: 1rem;
    width: 33%;
  }

  .btn-close,
  .btn-folder {
    cursor: pointer;
    float: right;
    padding: 0 5px;
    border: 0;
    background: transparent;
    line-height: 18px;
  }

  .btn-folder::after {
    display: inline;
    content: '▼';
  }

  .spinner {
    display: inline;
  }

  .spinner::after {
    content: '';
    display: inline;
    animation: loading-spinner;
    animation-duration: 5s;
    animation-iteration-count: infinite;
  }

  @keyframes loading-spinner {
    20% {
      content: '.';
    }

    40% {
      content: '..';
    }

    60% {
      content: '...';
    }

    80% {
      content: '....';
    }

    100% {
      content: '.....';
    }
  }

  .toolbar {
    display: flex;
    padding-top: 6px;
  }

  .toolbar > div {
    flex: 1;
  }

  .toolbar > .buttons {
    text-align: right;
  }

  .fold .btn-folder::after {
    content: '▲';
  }

  .fold.container {
    height: 15px;
  }
</style>
