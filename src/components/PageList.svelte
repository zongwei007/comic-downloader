<script lang="ts">
  import PageItem from './PageItem.svelte';

  import type { Page } from '../resolve';

  export let data: Page[];
</script>

<div class="list">
  <PageItem>
    <span slot="index">序号</span>
    <span slot="url">页面</span>
    <span slot="state">状态</span>
  </PageItem>
  {#each data as page (page.index)}
    <PageItem {page} />
  {/each}
</div>

<style>
  .list {
    width: 100%;
    max-height: calc(100% - 65px);
    overflow: auto;
  }
</style>
