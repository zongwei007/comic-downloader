const STATE_MAP = {
  error: '下载失败',
  pending: '准备下载',
  downloading: '下载中',
  downloaded: '已下载',
};

export default {
  props: ['class', 'index', 'url', 'progress', 'progressText', 'state'],

  computed: {
    hasError() {
      return this.state === 'error';
    },
    isDownloading() {
      return this.state === 'downloading';
    },
    progressWidth() {
      return `${(this.progress || 0) * 100}%`;
    },
    stateText() {
      return STATE_MAP[this.state];
    },
  },

  template: `
    <div class="row" v-bind:class="{ downloading: isDownloading }">
      <div class="index"><slot name="index">{{ index }}</slot></div>
      <div>
        <slot name="url">
          <div v-if="isDownloading" class="progress">
            <div class="progress-bar" v-bind:style="{ width: progressWidth }">{{ progressText }}</div>
          </div>
          <template v-else>
            {{ url }}
          </template>
        </slot>
      </div>
      <div class="state" v-bind:class="{ 'status-failed': hasError }"><slot name="state">{{ stateText }}</slot></div>
    </div>
  `,
};
