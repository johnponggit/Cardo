// components/todo-item/todo-item.js
const util = require('../../utils/util.js');

Component({
  properties: {
    item: {
      type: Object,
      value: {}
    }
  },

  data: {
    formatTime: ''
  },

  observers: {
    'item.createdAt, item.completedAt': function(createdAt, completedAt) {
      const item = this.properties.item;
      if (item.status === 'done' && completedAt) {
        this.setData({
          formatTime: '完成于 ' + util.formatRelativeTime(completedAt)
        });
      } else if (createdAt) {
        this.setData({
          formatTime: util.formatRelativeTime(createdAt)
        });
      }
    },
    'item.link': function(link) {
      if (link) {
        this.setData({
          'item.linkDomain': util.getDomain(link)
        });
      }
    }
  },

  methods: {
    onTap() {
      const item = this.properties.item;
      this.triggerEvent('tap', { item });
    },

    onCheck() {
      const item = this.properties.item;
      this.triggerEvent('check', { item });
    },

    onLinkTap() {
      const item = this.properties.item;
      if (item.link) {
        wx.setClipboardData({
          data: item.link,
          success: () => {
            wx.showToast({
              title: '链接已复制',
              icon: 'success'
            });
          }
        });
      }
    },

    onCardTap() {
      const item = this.properties.item;
      if (item.linkedCardId) {
        wx.navigateTo({
          url: `/pages/card-detail/card-detail?id=${item.linkedCardId}`
        });
      }
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