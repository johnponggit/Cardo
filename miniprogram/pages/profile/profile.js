// pages/profile/profile.js
const { todoDB, cardDB, STORAGE_KEYS } = require('../../utils/db.js');
const util = require('../../utils/util.js');

const app = getApp();

Page({
  data: {
    userInfo: null,
    stats: {
      totalTodos: 0,
      totalCards: 0
    },
    reminderEnabled: false,
    darkMode: false
  },

  onLoad() {
    this.loadUserInfo();
    this.loadStats();
    this.loadSettings();
  },

  onShow() {
    this.loadStats();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.setData({ userInfo });
      app.globalData.userInfo = userInfo;
    }
  },

  async loadStats() {
    try {
      const [todoRes, cardRes] = await Promise.all([
        todoDB.count(),
        cardDB.count()
      ]);

      this.setData({
        'stats.totalTodos': todoRes.data || 0,
        'stats.totalCards': cardRes.data || 0
      });
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  loadSettings() {
    const reminderEnabled = wx.getStorageSync('reminderEnabled') || false;
    const darkMode = wx.getStorageSync('darkMode') || false;
    this.setData({ reminderEnabled, darkMode });
  },

  async onLogin() {
    try {
      // 获取用户信息
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      });

      this.setData({ userInfo });
      wx.setStorageSync('userInfo', userInfo);
      app.globalData.userInfo = userInfo;

      util.showSuccess('登录成功');
    } catch (err) {
      console.error('登录失败:', err);
      if (err.errMsg && !err.errMsg.includes('cancel')) {
        util.showError('登录失败');
      }
    }
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ userInfo: null });
          wx.removeStorageSync('userInfo');
          app.globalData.userInfo = null;
          util.showSuccess('已退出登录');
        }
      }
    });
  },

  async onExport() {
    util.showLoading('导出中...');

    try {
      const todos = todoDB.getAll();
      const cards = cardDB.getAll();

      const data = {
        todos,
        cards,
        exportTime: new Date().toISOString()
      };

      // 保存到剪贴板
      const dataStr = JSON.stringify(data, null, 2);

      await wx.setClipboardData({
        data: dataStr
      });

      util.hideLoading();
      util.showSuccess('已复制到剪贴板');

    } catch (err) {
      util.hideLoading();
      console.error('导出失败:', err);
      util.showError('导出失败');
    }
  },

  onImport() {
    wx.showModal({
      title: '导入数据',
      content: '请先复制JSON数据到剪贴板，然后点击确定导入。这将合并现有数据。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const clipboardData = await wx.getClipboardData();
            const dataStr = clipboardData.data;

            if (!dataStr) {
              util.showError('剪贴板为空');
              return;
            }

            const data = JSON.parse(dataStr);

            if (!data.todos && !data.cards) {
              util.showError('数据格式错误');
              return;
            }

            util.showLoading('导入中...');

            // 获取现有数据
            let existingTodos = todoDB.getAll();
            let existingCards = cardDB.getAll();

            // 创建ID映射，避免重复
            const existingTodoIds = new Set(existingTodos.map(t => t._id));
            const existingCardIds = new Set(existingCards.map(c => c._id));

            // 合并待办
            let newTodos = [];
            if (data.todos && Array.isArray(data.todos)) {
              newTodos = data.todos.filter(t => !existingTodoIds.has(t._id));
            }

            // 合并卡片
            let newCards = [];
            if (data.cards && Array.isArray(data.cards)) {
              newCards = data.cards.filter(c => !existingCardIds.has(c._id));
            }

            // 保存合并后的数据
            if (newTodos.length > 0) {
              todoDB.saveAll([...newTodos, ...existingTodos]);
            }
            if (newCards.length > 0) {
              cardDB.saveAll([...newCards, ...existingCards]);
            }

            util.hideLoading();

            const addedTodos = newTodos.length;
            const addedCards = newCards.length;

            wx.showModal({
              title: '导入成功',
              content: `新增 ${addedTodos} 条待办，${addedCards} 张卡片`,
              showCancel: false
            });

            this.loadStats();

          } catch (err) {
            util.hideLoading();
            console.error('导入失败:', err);
            util.showError('导入失败，请检查数据格式');
          }
        }
      }
    });
  },

  onClearData() {
    wx.showModal({
      title: '清空数据',
      content: '确定要清空所有数据吗？此操作不可恢复！',
      confirmColor: '#FF4D4F',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync(STORAGE_KEYS.TODOS);
            wx.removeStorageSync(STORAGE_KEYS.CARDS);
            util.showSuccess('数据已清空');
            this.loadStats();
          } catch (err) {
            console.error('清空失败:', err);
            util.showError('操作失败');
          }
        }
      }
    });
  },

  onReminderChange(e) {
    const enabled = e.detail.value;
    this.setData({ reminderEnabled: enabled });
    wx.setStorageSync('reminderEnabled', enabled);
    util.showSuccess(enabled ? '已开启提醒' : '已关闭提醒');
  },

  onThemeChange(e) {
    const enabled = e.detail.value;
    this.setData({ darkMode: enabled });
    wx.setStorageSync('darkMode', enabled);
    util.showSuccess(enabled ? '已开启深色模式' : '已关闭深色模式');
  },

  onAbout() {
    wx.showModal({
      title: '关于卡卡待办',
      content: '卡卡待办是一款帮助你管理待办事项和知识复习的小程序。\n\n版本：1.0.0\n数据存储：本地存储',
      showCancel: false
    });
  }
});