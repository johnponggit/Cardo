// pages/todo/todo.js
const { todoDB } = require('../../utils/db.js');
const util = require('../../utils/util.js');

const DEFAULT_CATEGORIES = ['技术文章', '购物清单', '电影书籍', '工作事项', '其他'];

Page({
  data: {
    todos: [],
    categories: DEFAULT_CATEGORIES,
    currentStatus: '',
    currentCategory: '',
    loading: false,
    refreshing: false,
    noMore: false,
    page: 0
  },

  onLoad() {
    this.loadTodos();
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
    await this.loadTodos();
    wx.stopPullDownRefresh();
  },

  async loadTodos() {
    if (this.data.loading) return;

    this.setData({ loading: true });

    try {
      const { currentStatus, currentCategory, page } = this.data;
      const res = await todoDB.getTodoList(
        currentStatus || null,
        currentCategory || null,
        page * 20
      );

      if (res.success) {
        const newTodos = res.data || [];
        this.setData({
          todos: page === 0 ? newTodos : [...this.data.todos, ...newTodos],
          noMore: newTodos.length < 20,
          page: page + 1
        });
      } else {
        util.showError('加载失败');
      }
    } catch (err) {
      console.error('加载待办失败:', err);
      util.showError('加载失败');
    } finally {
      this.setData({
        loading: false,
        refreshing: false
      });
    }
  },

  onStatusChange(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      currentStatus: status,
      page: 0,
      todos: []
    });
    this.loadTodos();
  },

  onCategoryChange(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      page: 0,
      todos: []
    });
    this.loadTodos();
  },

  onRefresh() {
    this.setData({ refreshing: true });
    this.refreshData();
  },

  onLoadMore() {
    if (!this.data.noMore) {
      this.loadTodos();
    }
  },

  onTodoTap(e) {
    const { item } = e.detail;
    wx.navigateTo({
      url: `/pages/todo-detail/todo-detail?id=${item._id}`
    });
  },

  async onTodoCheck(e) {
    const { item } = e.detail;
    const newStatus = item.status === 'done' ? 'pending' : 'done';

    try {
      const res = await todoDB.updateStatus(item._id, newStatus);
      if (res.success) {
        const todos = this.data.todos.map(todo => {
          if (todo._id === item._id) {
            return {
              ...todo,
              status: newStatus,
              completedAt: newStatus === 'done' ? new Date() : null
            };
          }
          return todo;
        });
        this.setData({ todos });

        if (newStatus === 'done') {
          util.showSuccess('已完成');
        }
      }
    } catch (err) {
      console.error('更新状态失败:', err);
      util.showError('操作失败');
    }
  },

  onTodoEdit(e) {
    const { item } = e.detail;
    wx.navigateTo({
      url: `/pages/todo-detail/todo-detail?id=${item._id}`
    });
  },

  async onTodoDelete(e) {
    const { item } = e.detail;

    const confirmed = await util.showConfirm('确认删除', '删除后无法恢复，确定要删除吗？');
    if (!confirmed) return;

    try {
      const res = await todoDB.remove(item._id);
      if (res.success) {
        const todos = this.data.todos.filter(todo => todo._id !== item._id);
        this.setData({ todos });
        util.showSuccess('已删除');
      }
    } catch (err) {
      console.error('删除失败:', err);
      util.showError('删除失败');
    }
  },

  onAdd() {
    wx.navigateTo({
      url: '/pages/todo-detail/todo-detail'
    });
  }
});