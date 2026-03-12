// components/review-card/review-card.js
Component({
  properties: {
    card: {
      type: Object,
      value: {}
    },
    currentIndex: {
      type: Number,
      value: 0
    },
    total: {
      type: Number,
      value: 0
    }
  },

  data: {
    showBack: false
  },

  methods: {
    onFlip() {
      this.setData({
        showBack: !this.data.showBack
      });
    },

    onRate(e) {
      const quality = parseInt(e.currentTarget.dataset.quality);
      this.triggerEvent('rate', { quality });
      // 重置状态
      this.setData({ showBack: false });
    }
  }
});