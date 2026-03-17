// utils/db.js - 本地存储封装

const STORAGE_KEYS = {
  TODOS: 'cardo_todos',
  CARDS: 'cardo_cards',
  USER: 'cardo_user'
};

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * 通用本地存储操作类
 */
class LocalDB {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  /**
   * 获取所有数据
   */
  getAll() {
    try {
      const data = wx.getStorageSync(this.storageKey);
      return data || [];
    } catch (err) {
      console.error('读取数据失败:', err);
      return [];
    }
  }

  /**
   * 保存所有数据
   */
  saveAll(data) {
    try {
      wx.setStorageSync(this.storageKey, data);
      return true;
    } catch (err) {
      console.error('保存数据失败:', err);
      return false;
    }
  }

  /**
   * 添加文档
   */
  async add(data) {
    try {
      const list = this.getAll();
      const now = new Date().toISOString();
      const newItem = {
        _id: generateId(),
        ...data,
        createdAt: now,
        updatedAt: now
      };
      list.unshift(newItem);
      this.saveAll(list);
      return { success: true, data: newItem };
    } catch (err) {
      console.error('添加失败:', err);
      return { success: false, error: err };
    }
  }

  /**
   * 根据ID获取文档
   */
  async getById(id) {
    try {
      const list = this.getAll();
      const item = list.find(item => item._id === id);
      if (item) {
        return { success: true, data: item };
      }
      return { success: false, error: '未找到' };
    } catch (err) {
      console.error('获取失败:', err);
      return { success: false, error: err };
    }
  }

  /**
   * 获取列表
   */
  async getList(options = {}) {
    const {
      filter = () => true,
      sort = (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      skip = 0,
      limit = 20
    } = options;

    try {
      let list = this.getAll();
      list = list.filter(filter);
      list.sort(sort);
      const result = list.slice(skip, skip + limit);
      return { success: true, data: result };
    } catch (err) {
      console.error('获取列表失败:', err);
      return { success: false, error: err };
    }
  }

  /**
   * 更新文档
   */
  async update(id, data) {
    try {
      const list = this.getAll();
      const index = list.findIndex(item => item._id === id);
      if (index === -1) {
        return { success: false, error: '未找到' };
      }
      list[index] = {
        ...list[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      this.saveAll(list);
      return { success: true, data: list[index] };
    } catch (err) {
      console.error('更新失败:', err);
      return { success: false, error: err };
    }
  }

  /**
   * 删除文档
   */
  async remove(id) {
    try {
      const list = this.getAll();
      const index = list.findIndex(item => item._id === id);
      if (index === -1) {
        return { success: false, error: '未找到' };
      }
      list.splice(index, 1);
      this.saveAll(list);
      return { success: true };
    } catch (err) {
      console.error('删除失败:', err);
      return { success: false, error: err };
    }
  }

  /**
   * 统计数量
   */
  async count(filter = () => true) {
    try {
      const list = this.getAll();
      const count = list.filter(filter).length;
      return { success: true, data: count };
    } catch (err) {
      console.error('统计失败:', err);
      return { success: false, error: err };
    }
  }
}

/**
 * 待办数据库操作
 */
class TodoDB extends LocalDB {
  constructor() {
    super(STORAGE_KEYS.TODOS);
  }

  /**
   * 获取待办列表
   */
  async getTodoList(status, category, skip = 0) {
    const filter = (item) => {
      if (status && item.status !== status) return false;
      if (category && item.category !== category) return false;
      return true;
    };

    return this.getList({
      filter,
      sort: (a, b) => {
        // 按优先级和创建时间排序
        const priorityOrder = { 1: 0, 2: 1, 3: 2 };
        const pa = priorityOrder[a.priority] ?? 1;
        const pb = priorityOrder[b.priority] ?? 1;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt) - new Date(a.createdAt);
      },
      skip,
      limit: 20
    });
  }

  /**
   * 获取今日待办
   */
  async getTodayTodos() {
    return this.getList({
      filter: item => item.status === 'pending' || item.status === 'doing',
      sort: (a, b) => {
        const priorityOrder = { 1: 0, 2: 1, 3: 2 };
        const pa = priorityOrder[a.priority] ?? 1;
        const pb = priorityOrder[b.priority] ?? 1;
        return pa - pb;
      },
      limit: 10
    });
  }

  /**
   * 更新待办状态
   */
  async updateStatus(id, status) {
    const updateData = { status };
    if (status === 'done') {
      updateData.completedAt = new Date().toISOString();
    }
    return this.update(id, updateData);
  }

  /**
   * 关联卡片
   */
  async linkCard(todoId, cardId) {
    return this.update(todoId, { linkedCardId: cardId });
  }

  /**
   * 获取统计数据
   */
  async getStats() {
    try {
      const list = this.getAll();
      const stats = {
        pending: 0,
        doing: 0,
        done: 0
      };
      list.forEach(item => {
        if (item.status === 'pending') stats.pending++;
        else if (item.status === 'doing') stats.doing++;
        else if (item.status === 'done') stats.done++;
      });
      return { success: true, data: stats };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

/**
 * 卡片数据库操作
 */
class CardDB extends LocalDB {
  constructor() {
    super(STORAGE_KEYS.CARDS);
  }

  /**
   * 获取今日待复习卡片
   */
  async getTodayReviewCards() {
    const now = new Date();
    return this.getList({
      filter: item => {
        if (!item.nextReview) return true;
        return new Date(item.nextReview) <= now;
      },
      sort: (a, b) => new Date(a.nextReview || 0) - new Date(b.nextReview || 0),
      limit: 50
    });
  }

  /**
   * 获取卡片列表
   */
  async getCardList(tag, skip = 0) {
    const filter = (item) => {
      if (tag && (!item.tags || !item.tags.includes(tag))) return false;
      return true;
    };

    return this.getList({
      filter,
      sort: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      skip,
      limit: 20
    });
  }

  /**
   * 更新复习记录
   */
  async updateReview(id, quality) {
    const cardRes = await this.getById(id);
    if (!cardRes.success) return cardRes;

    const card = cardRes.data;
    const { nextInterval, easeFactor, repetitions } = this.calculateNextReview(
      card.interval || 0,
      card.easeFactor || 2.5,
      card.repetitions || 0,
      quality
    );

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + nextInterval);

    return this.update(id, {
      interval: nextInterval,
      easeFactor,
      repetitions,
      nextReview: nextReview.toISOString()
    });
  }

  /**
   * SM-2 算法计算下次复习时间
   */
  calculateNextReview(interval, easeFactor, repetitions, quality) {
    let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEaseFactor = Math.max(1.3, newEaseFactor);

    let newRepetitions;
    let newInterval;

    if (quality >= 3) {
      if (repetitions === 0) {
        newInterval = 1;
      } else if (repetitions === 1) {
        newInterval = 3;
      } else if (repetitions === 2) {
        newInterval = 7;
      } else if (repetitions === 3) {
        newInterval = 14;
      } else {
        newInterval = Math.round(interval * newEaseFactor);
        newInterval = Math.min(newInterval, 180);
      }
      newRepetitions = repetitions + 1;
    } else {
      newRepetitions = 0;
      newInterval = 1;
    }

    return {
      nextInterval: newInterval,
      easeFactor: newEaseFactor,
      repetitions: newRepetitions
    };
  }

  /**
   * 从待办创建卡片
   */
  async createFromTodo(todoId, front, back, tags = []) {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 1);

    return this.add({
      front,
      back,
      tags,
      sourceTodoId: todoId,
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      nextReview: nextReview.toISOString()
    });
  }

  /**
   * 获取所有标签
   */
  async getAllTags() {
    try {
      const list = this.getAll();
      const tagsSet = new Set();
      list.forEach(item => {
        if (item.tags && Array.isArray(item.tags)) {
          item.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      return { success: true, data: Array.from(tagsSet) };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  /**
   * 获取统计信息
   */
  async getStats() {
    try {
      const list = this.getAll();
      const now = new Date();
      const stats = {
        total: list.length,
        dueToday: 0,
        newCards: 0
      };
      list.forEach(item => {
        if (!item.nextReview || new Date(item.nextReview) <= now) {
          stats.dueToday++;
        }
        if (!item.repetitions || item.repetitions === 0) {
          stats.newCards++;
        }
      });
      return { success: true, data: stats };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

// 导出实例
const todoDB = new TodoDB();
const cardDB = new CardDB();

module.exports = {
  STORAGE_KEYS,
  LocalDB,
  TodoDB,
  CardDB,
  todoDB,
  cardDB
};