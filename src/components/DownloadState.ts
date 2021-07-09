import { writable } from 'svelte/store';

import type { Page } from '../resolve';
import type { Description } from '../exportor';

export type State = {
  description: Description;
  downloadingCount: number;
  exporting: boolean;
  fold: boolean;
  failCount: number;
  loading: boolean;
  pages: Page[];
  pageTotal: number;
  resolved: boolean;
  successCount: number;
  title: string;
};

const { subscribe, update } = writable<State>({
  description: null,
  downloadingCount: 0,
  exporting: false,
  fold: false,
  failCount: 0,
  loading: false,
  pages: [],
  pageTotal: 0,
  resolved: false,
  successCount: 0,
  title: null,
});

const state = {
  subscribe,
  addPage(page: Page) {
    update(state => ({ ...state, pages: state.pages.concat([page]) }));
  },
  setDescription(description: Description) {
    update(state => ({ ...state, description }));
  },
  setExporting(flag: boolean) {
    update(state => ({ ...state, exporting: flag }));
  },
  setFold(flag: boolean) {
    update(state => ({ ...state, fold: flag }));
  },
  setLoading(flag: boolean) {
    update(state => ({ ...state, loading: flag }));
  },
  setPageTotal(total: number) {
    update(state => ({ ...state, pageTotal: total }));
  },
  setResolved(flag: boolean) {
    update(state => ({ ...state, resolved: flag }));
  },
  setTitle(title: string) {
    update(state => ({ ...state, title }));
  },
  updatePage(page: Page) {
    update(state => {
      const [prev] = state.pages.splice(page.index - 1, 1, page);

      if (prev.state !== 'error' && page.state === 'error') {
        state.failCount++;
      } else if (prev.state === 'error' && page.state !== 'error') {
        state.failCount--;
      }

      if (prev.state !== 'downloading' && page.state === 'downloading') {
        state.downloadingCount++;
      } else if (prev.state === 'downloading' && page.state !== 'downloading') {
        state.downloadingCount--;
      }

      if (page.state === 'downloaded') {
        state.successCount++;
      }

      return { ...state };
    });
  },
};

export default state;
