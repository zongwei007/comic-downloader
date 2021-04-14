<script context="module">
  const STATE_MAP = {
    error: '下载失败',
    pending: '准备下载',
    downloading: '下载中',
    downloaded: '已下载',
  };
</script>

<script lang="ts">
  import type { Page } from '../resolve';

  export let page: Page = null;

  $: isDownloading = page?.state === 'downloading';
</script>

<div class="row" class:downloading={isDownloading}>
  <div class="index"><slot name="index">{page.index}</slot></div>
  <div>
    <slot name="url">
      {#if isDownloading}
        <div class="progress">
          <div class="progress-bar" style={`width: ${((page.meta?.progress || 0) * 100).toFixed(2)}px`}>
            {page.meta?.progressText || ''}
          </div>
        </div>
      {:else}
        {page.pageUrl}
      {/if}
    </slot>
  </div>
  <div class="state" class:status-failed={page?.state === 'error'}>
    <slot name="state">{STATE_MAP[page.state]}</slot>
  </div>
</div>

<style>
  .row {
    display: flex;
  }

  .row > div {
    padding: 5px;
    flex: 1;
  }

  .row > div.index {
    width: 40px;
    text-align: right;
    flex: 0 1 auto;
  }

  .row > div.state {
    width: 60px;
    flex: 0 1 auto;
  }

  .progress {
    height: 14px;
    overflow: hidden;
    border: 1px solid #eee;
  }

  .progress > .progress-bar {
    float: left;
    height: 100%;
    color: #333;
    text-align: center;
    background-color: #eee;
  }
</style>
