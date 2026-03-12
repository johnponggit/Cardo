// pages/index/index.js
const { todoDB, cardDB } = require('../../utils/db.js');
const util = require('../../utils/util.js');

Page({
  data: {
    greeting: '',
    dateText: '',
    todoStats: {
      pending: 0,
      doing: 0,
      done: 0
    },
    cardStats: {
      total: 0,
      dueToday: 0,
      newCards: 0
    },
    recentTodos: []
  },

  onLoad() {
    this.setGreeting();
    this.loadStats();
    this.loadRecentTodos();
  },

  onShow() {
    this.loadStats();
    this.loadRecentTodos();
  },

  onPullDownRefresh() {
    this.loadStats();
    this.loadRecentTodos();
    wx.stopPullDownRefresh();
  },

  setGreeting() {
    const hour = new Date().getHours();
    let greeting = '';

    if (hour < 6) {
      greeting = '夜深了';
    } else if (hour < 9) {
      greeting = '早上好';
    } else if (hour < 12) {
      greeting = '上午好';
    } else if (hour < 14) {
      greeting = '中午好';
    } else if (hour < 17) {
      greeting = '下午好';
    } else if (hour < 19) {
      greeting = '傍晚好';
    } else {
      greeting = '晚上好';
    }

    const now = new Date();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dateText = `${now.getMonth() + 1}月${now.getDate()}日 ${weekDays[now.getDay()]}`;

    this.setData({ greeting, dateText });
  },

  async loadStats() {
    try {
      const [todoRes, cardRes] = await Promise.all([
        todoDB.getStats(),
        cardDB.getStats()
      ]);

      if (todoRes.success) {
        this.setData({ todoStats: todoRes.data });
      }

      if (cardRes.success) {
        this.setData({ cardStats: cardRes.data });
      }
    } catch (err) {
      console.error('加载统计失败:', err);
    }
  },

  async loadRecentTodos() {
    try {
      const res = await todoDB.getTodoList(null, null, 0);
      if (res.success) {
        // 只显示未完成的待办
        const recentTodos = (res.data || [])
          .filter(item => item.status !== 'done')
          .slice(0, 5);
        this.setData({ recentTodos });
      }
    } catch (err) {
      console.error('加载近期待办失败:', err);
    }
  },

  goToTodo() {
    wx.switchTab({
      url: '/pages/todo/todo'
    });
  },

  goToCard() {
    wx.switchTab({
      url: '/pages/card/card'
    });
  },

  startReview() {
    wx.navigateTo({
      url: '/pages/review/review'
    });
  },

  onTodoTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/todo-detail/todo-detail?id=${id}`
    });
  },

  addTodo() {
    wx.navigateTo({
      url: '/pages/todo-detail/todo-detail'
    });
  },

  addCard() {
    wx.navigateTo({
      url: '/pages/card-detail/card-detail'
    });
  }
});