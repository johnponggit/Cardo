// pages/card/card.js
const { cardDB } = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    cards: [],
    tags: [],
    currentTag: '',
    stats: {
      total: 0,
      dueToday: 0,
      newCards: 0
    },
    loading: false,
    refreshing: false,
    noMore: false,
    page: 0
  },

  onLoad() {
    this.loadCards();
    this.loadStats();
    this.loadTags();
  },

  onShow() {
    this.refreshData();
  },

  onPullDownRefresh() {
    this.refreshData();
  },

  async refreshData() {
    this.setData({
      page: 0,
      noMore: false
    });
    await Promise.all([
      this.loadCards(),
      this.loadStats(),
      this.loadTags()
    ]);
    wx.stopPullDownRefresh();
  },

  async loadCards() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const { currentTag, page } = this.data;
      const res = await cardDB.getCardList(currentTag || null, page * 20);

      if (res.success) {
        const newCards = res.data || [];
        this.setData({
          cards: page === 0 ? newCards : [...this.data.cards, ...newCards],
          noMore: newCards.length < 20,
          page: page + 1
        });
      }
    } catch (err) {
      console.error('加载卡片失败:', err);
      util.showError('加载失败');
    } finally {
      this.setData({
        loading: false,
        refreshing: false
      });
    }
  },

  async loadStats() {
    try {
      const res = await cardDB.getStats();
      if (res.success) {
        this.setData({ stats: res.data });
      }
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  async loadTags() {
    try {
      const res = await cardDB.getAllTags();
      if (res.success) {
        this.setData({ tags: res.data });
      }
    } catch (err) {
      console.error('加载标签失败:', err);
    }
  },

  onTagChange(e) {
    const tag = e.currentTarget.dataset.tag;
    this.setData({
      currentTag: tag,
      page: 0,
      cards: []
    });
    this.loadCards();
  },

  onRefresh() {
    this.setData({ refreshing: true });
    this.refreshData();
  },

  onLoadMore() {
    if (!this.data.noMore) {
      this.loadCards();
    }
  },

  onStartReview() {
    wx.navigateTo({
      url: '/pages/review/review'
    });
  },

  onCardTap(e) {
    const { item } = e.detail;
    wx.navigateTo({
      url: `/pages/card-detail/card-detail?id=${item._id}`
    });
  },

  onCardEdit(e) {
    const { item } = e.detail;
    wx.navigateTo({
      url: `/pages/card-detail/card-detail?id=${item._id}`
    });
  },

  async onCardDelete(e) {
    const { item } = e.detail;

    const confirmed = await util.showConfirm('确认删除', '删除后无法恢复，确定要删除吗？');
    if (!confirmed) return;

    try {
      const res = await cardDB.remove(item._id);
      if (res.success) {
        const cards = this.data.cards.filter(card => card._id !== item._id);
        this.setData({ cards });
        this.loadStats();
        util.showSuccess('已删除');
      }
    } catch (err) {
      console.error('删除失败:', err);
      util.showError('删除失败');
    }
  },

  onAdd() {
    wx.navigateTo({
      url: '/pages/card-detail/card-detail'
    });
  }
});