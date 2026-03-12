// components/card-item/card-item.js
const sm2 = require('../../utils/sm2.js');

Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },

  data: {
    statusText: '',
    progress: 0,
    level: ''
  },

  observers: {
    'item': function(item) {
      if (item) {
        const statusText = sm2.getCardStatus(item);
        const { level, progress } = sm2.getReviewProgress(item.repetitions || 0);

        this.setData({
          statusText,
          level,
          progress
        });
      }
    }
  },

  methods: {
    onTap() {
      const item = this.properties.item;
      this.triggerEvent('tap', { item });
    },

    onMore() {
      const item = this.properties.item;
      wx.showActionSheet({
        itemList: ['编辑', '删除'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.triggerEvent('edit', { item });
          } else if (res.tapIndex === 1) {
            this.triggerEvent('delete', { item });
          }
        }
      });
    },

    preventPropagation() {}
  }
});