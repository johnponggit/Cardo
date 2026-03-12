// pages/card-detail/card-detail.js
const { cardDB, todoDB } = require('../../utils/db.js');
const util = require('../../utils/util.js');
const sm2 = require('../../utils/sm2.js');

const COMMON_TAGS = ['前端', '后端', '算法', '网络', '数据库', '设计模式', '工具', '其他'];

Page({
  data: {
    cardId: '',
    card: {
      front: '',
      back: '',
      tags: []
    },
    tagInput: '',
    suggestedTags: COMMON_TAGS,
    fromTodo: '',
    fromTodoTitle: '',
    nextReviewText: '',
    progress: 0,
    level: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ cardId: options.id });
      this.loadCard(options.id);
    } else if (options.fromTodo) {
      this.setData({
        fromTodo: options.fromTodo,
        fromTodoTitle: decodeURIComponent(options.title || ''),
        'card.front': decodeURIComponent(options.title || '')
      });
      wx.setNavigationBarTitle({
        title: '创建卡片'
      });
    }
  },

  async loadCard(id) {
    util.showLoading('加载中...');

    try {
      const res = await cardDB.getById(id);
      if (res.success) {
        const card = res.data;
        const { level, progress } = sm2.getReviewProgress(card.repetitions || 0);

        this.setData({
          card,
          nextReviewText: sm2.getCardStatus(card),
          progress,
          level
        });

        wx.setNavigationBarTitle({
          title: '编辑卡片'
        });
      } else {
        util.showError('加载失败');
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (err) {
      console.error('加载卡片失败:', err);
      util.showError('加载失败');
    } finally {
      util.hideLoading();
    }
  },

  onTagInput(e) {
    this.setData({ tagInput: e.detail.value });
  },

  onAddTag() {
    const tag = this.data.tagInput.trim();
    if (!tag) return;

    const tags = this.data.card.tags || [];
    if (tags.includes(tag)) {
      util.showError('标签已存在');
      return;
    }

    this.setData({
      'card.tags': [...tags, tag],
      tagInput: ''
    });
  },

  onRemoveTag(e) {
    const index = e.currentTarget.dataset.index;
    const tags = this.data.card.tags.filter((_, i) => i !== index);
    this.setData({ 'card.tags': tags });
  },

  onSelectTag(e) {
    const tag = e.currentTarget.dataset.tag;
    const tags = this.data.card.tags || [];
    if (!tags.includes(tag)) {
      this.setData({
        'card.tags': [...tags, tag]
      });
    }
  },

  async onSubmit(e) {
    const formData = e.detail.value;

    if (!formData.front) {
      util.showError('请输入问题');
      return;
    }

    if (!formData.back) {
      util.showError('请输入答案');
      return;
    }

    const cardData = {
      front: formData.front,
      back: formData.back,
      tags: this.data.card.tags || []
    };

    // 如果是从待办创建的，设置初始复习时间
    if (this.data.fromTodo) {
      const nextReview = new Date();
      nextReview.setDate(nextReview.getDate() + 1);
      cardData.sourceTodoId = this.data.fromTodo;
      cardData.easeFactor = 2.5;
      cardData.interval = 0;
      cardData.repetitions = 0;
      cardData.nextReview = nextReview;
    }

    util.showLoading('保存中...');

    try {
      let res;
      if (this.data.cardId) {
        res = await cardDB.update(this.data.cardId, cardData);
      } else {
        res = await cardDB.add(cardData);
      }

      if (res.success) {
        // 如果是从待办创建的，更新待办的关联卡片ID
        if (this.data.fromTodo && res.data._id) {
          await todoDB.linkCard(this.data.fromTodo, res.data._id);
        }

        util.showSuccess('保存成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        util.showError('保存失败');
      }
    } catch (err) {
      console.error('保存卡片失败:', err);
      util.showError('保存失败');
    } finally {
      util.hideLoading();
    }
  },

  async onDelete() {
    const confirmed = await util.showConfirm('确认删除', '删除后无法恢复，确定要删除吗？');
    if (!confirmed) return;

    util.showLoading('删除中...');

    try {
      const res = await cardDB.remove(this.data.cardId);
      if (res.success) {
        util.showSuccess('删除成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (err) {
      console.error('删除失败:', err);
      util.showError('删除失败');
    } finally {
      util.hideLoading();
    }
  }
});