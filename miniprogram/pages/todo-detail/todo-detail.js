// pages/todo-detail/todo-detail.js
const { todoDB } = require('../../utils/db.js');
const util = require('../../utils/util.js');

const CATEGORIES = ['技术文章', '购物清单', '电影书籍', '工作事项', '其他'];

Page({
  data: {
    todoId: '',
    todo: {
      title: '',
      link: '',
      category: '',
      status: 'pending',
      priority: 2,
      notes: '',
      linkedCardId: ''
    },
    categories: CATEGORIES,
    categoryIndex: -1,
    linkTitle: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ todoId: options.id });
      this.loadTodo(options.id);
    }
  },

  async loadTodo(id) {
    util.showLoading('加载中...');

    try {
      const res = await todoDB.getById(id);
      if (res.success) {
        const todo = res.data;
        const categoryIndex = CATEGORIES.indexOf(todo.category);

        this.setData({
          todo,
          categoryIndex: categoryIndex >= 0 ? categoryIndex : -1
        });

        wx.setNavigationBarTitle({
          title: '编辑待办'
        });
      } else {
        util.showError('加载失败');
        setTimeout(() => wx.navigateBack(), 1500);
      }
    } catch (err) {
      console.error('加载待办失败:', err);
      util.showError('加载失败');
    } finally {
      util.hideLoading();
    }
  },

  onTitleInput(e) {
    this.setData({
      'todo.title': e.detail.value
    });
  },

  onLinkBlur(e) {
    const link = e.detail.value;
    this.setData({ 'todo.link': link });

    if (link && util.isUrl(link)) {
      this.setData({ linkTitle: util.getDomain(link) });
    }
  },

  async onPaste() {
    try {
      const res = await wx.getClipboardData();
      if (res.data) {
        this.setData({
          'todo.link': res.data
        });

        if (util.isUrl(res.data)) {
          this.setData({ linkTitle: util.getDomain(res.data) });
        }
      }
    } catch (err) {
      console.error('粘贴失败:', err);
    }
  },

  onOpenLink() {
    const link = this.data.todo.link;
    if (link) {
      wx.setClipboardData({
        data: link,
        success: () => {
          util.showSuccess('链接已复制');
        }
      });
    }
  },

  onCategoryChange(e) {
    const index = e.detail.value;
    this.setData({
      categoryIndex: index,
      'todo.category': CATEGORIES[index]
    });
  },

  onStatusChange(e) {
    const status = e.currentTarget.dataset.status;
    this.setData({
      'todo.status': status
    });
  },

  onPriorityChange(e) {
    const priority = parseInt(e.currentTarget.dataset.priority);
    this.setData({
      'todo.priority': priority
    });
  },

  async onSubmit(e) {
    const formData = e.detail.value;

    if (!formData.title && !this.data.todo.title) {
      util.showError('请输入标题');
      return;
    }

    const todoData = {
      title: formData.title || this.data.todo.title,
      link: formData.link || this.data.todo.link,
      category: this.data.todo.category,
      status: this.data.todo.status,
      priority: this.data.todo.priority,
      notes: formData.notes || this.data.todo.notes
    };

    if (todoData.status === 'done' && this.data.todo.status !== 'done') {
      todoData.completedAt = new Date();
    }

    util.showLoading('保存中...');

    try {
      let res;
      if (this.data.todoId) {
        res = await todoDB.update(this.data.todoId, todoData);
      } else {
        res = await todoDB.add(todoData);
      }

      if (res.success) {
        util.showSuccess('保存成功');
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        util.showError('保存失败');
      }
    } catch (err) {
      console.error('保存待办失败:', err);
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
      const res = await todoDB.remove(this.data.todoId);
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
  },

  onViewCard() {
    if (this.data.todo.linkedCardId) {
      wx.navigateTo({
        url: `/pages/card-detail/card-detail?id=${this.data.todo.linkedCardId}`
      });
    }
  },

  onCreateCard() {
    wx.navigateTo({
      url: `/pages/card-detail/card-detail?fromTodo=${this.data.todoId}&title=${encodeURIComponent(this.data.todo.title)}`
    });
  }
});