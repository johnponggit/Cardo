// pages/profile/profile.js
const { todoDB, cardDB } = require('../../utils/db.js');
const util = require('../../utils/util.js');

const app = getApp();

Page({
  data: {
    userInfo: null,
    openid: '',
    stats: {
      totalTodos: 0,
      totalCards: 0,
      reviewDays: 0
    },
    reminderEnabled: false,
    darkMode: false
  },

  onLoad() {
    this.checkLogin();
    this.loadStats();
    this.loadSettings();
  },

  onShow() {
    this.loadStats();
  },

  async checkLogin() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'login'
      });

      if (res.result && res.result.openid) {
        this.setData({
          openid: res.result.openid.substring(0, 8) + '...'
        });
        app.globalData.openid = res.result.openid;
      }
    } catch (err) {
      console.error('检查登录状态失败:', err);
    }

    // 检查本地用户信息
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

  async onExport() {
    util.showLoading('导出中...');

    try {
      const [todoRes, cardRes] = await Promise.all([
        todoDB.getList({ limit: 1000 }),
        cardDB.getList({ limit: 1000 })
      ]);

      const data = {
        todos: todoRes.data || [],
        cards: cardRes.data || [],
        exportTime: new Date().toISOString()
      };

      // 保存到本地
      wx.setStorageSync('exportData', JSON.stringify(data));

      util.hideLoading();
      util.showSuccess('导出成功');

      wx.showModal({
        title: '导出成功',
        content: '数据已保存到本地，可通过文件管理器查看',
        showCancel: false
      });
    } catch (err) {
      util.hideLoading();
      console.error('导出失败:', err);
      util.showError('导出失败');
    }
  },

  onImport() {
    wx.showModal({
      title: '导入数据',
      content: '确定要导入数据吗？这将覆盖当前数据。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const dataStr = wx.getStorageSync('exportData');
            if (!dataStr) {
              util.showError('没有找到备份数据');
              return;
            }

            const data = JSON.parse(dataStr);
            util.showLoading('导入中...');

            // 导入待办
            if (data.todos && data.todos.length > 0) {
              for (const todo of data.todos) {
                await todoDB.add(todo);
              }
            }

            // 导入卡片
            if (data.cards && data.cards.length > 0) {
              for (const card of data.cards) {
                await cardDB.add(card);
              }
            }

            util.hideLoading();
            util.showSuccess('导入成功');
            this.loadStats();
          } catch (err) {
            util.hideLoading();
            console.error('导入失败:', err);
            util.showError('导入失败');
          }
        }
      }
    });
  },

  onReminderChange(e) {
    const enabled = e.detail.value;
    this.setData({ reminderEnabled: enabled });
    wx.setStorageSync('reminderEnabled', enabled);

    if (enabled) {
      // 请求订阅消息权限
      wx.requestSubscribeMessage({
        tmplIds: ['your-template-id'], // 替换为你的模板ID
        success: () => {
          util.showSuccess('已开启提醒');
        },
        fail: () => {
          this.setData({ reminderEnabled: false });
          wx.setStorageSync('reminderEnabled', false);
        }
      });
    }
  },

  onThemeChange(e) {
    const enabled = e.detail.value;
    this.setData({ darkMode: enabled });
    wx.setStorageSync('darkMode', enabled);
    util.showSuccess(enabled ? '已开启深色模式' : '已关闭深色模式');
  },

  onReminder() {
    // 打开提醒设置
  },

  onTheme() {
    // 切换主题
  },

  onFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  onAbout() {
    wx.showModal({
      title: '关于待办记忆',
      content: '待办记忆是一款帮助你管理待办事项和知识复习的小程序。\n\n版本：1.0.0\n开发者：Cardo Team',
      showCancel: false
    });
  }
});