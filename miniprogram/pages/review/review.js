// pages/review/review.js
const { cardDB } = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    cards: [],
    currentIndex: 0,
    loading: true,
    finished: false,
    reviewedCount: 0,
    easyCount: 0,
    goodCount: 0,
    hardCount: 0,
    failCount: 0
  },

  onLoad() {
    this.loadCards();
  },

  async loadCards() {
    try {
      const res = await cardDB.getTodayReviewCards();
      if (res.success) {
        this.setData({
          cards: res.data || [],
          loading: false
        });
      }
    } catch (err) {
      console.error('加载复习卡片失败:', err);
      util.showError('加载失败');
    } finally {
      this.setData({ loading: false });
    }
  },

  async onRate(e) {
    const { quality } = e.detail;
    const currentCard = this.data.cards[this.data.currentIndex];

    // 更新统计
    const stats = {
      reviewedCount: this.data.reviewedCount + 1,
      easyCount: this.data.easyCount + (quality === 5 ? 1 : 0),
      goodCount: this.data.goodCount + (quality === 4 ? 1 : 0),
      hardCount: this.data.hardCount + (quality === 3 ? 1 : 0),
      failCount: this.data.failCount + (quality < 3 ? 1 : 0)
    };

    this.setData(stats);

    // 保存复习结果
    try {
      await cardDB.updateReview(currentCard._id, quality);
    } catch (err) {
      console.error('更新复习记录失败:', err);
    }

    // 进入下一张卡片
    const nextIndex = this.data.currentIndex + 1;
    if (nextIndex >= this.data.cards.length) {
      this.setData({ finished: true });
    } else {
      this.setData({ currentIndex: nextIndex });
    }
  },

  onFinish() {
    wx.navigateBack();
  },

  onBack() {
    wx.navigateBack();
  }
});