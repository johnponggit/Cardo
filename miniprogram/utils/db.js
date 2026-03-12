// utils/db.js - 云数据库封装

const db = wx.cloud.database();
const _ = db.command;

// 数据库集合名
const COLLECTIONS = {
  TODOS: 'todos',
  CARDS: 'cards',
  USERS: 'users'
};

/**
 * 通用数据库操作类
 */
class DB {
  constructor(collection) {
    this.collection = db.collection(collection);
  }

  /**
   * 添加文档
   */
  async add(data) {
    try {
      const res = await this.collection.add({
        data: {
          ...data,
          createdAt: db.serverDate(),
          updatedAt: db.serverDate()
        }
      });
      return { success: true, data: res };
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
      const res = await this.collection.doc(id).get();
      return { success: true, data: res.data };
    } catch (err) {
      console.error('获取失败:', err);
      return { success: false, error: err };
    }
  }

  /**
   * 获取用户的所有文档
   */
  async getList(options = {}) {
    const {
      where = {},
      orderBy = 'createdAt',
      order = 'desc',
      limit = 20,
      skip = 0,
      field = {}
    } = options;

    try {
      let query = this.collection
        .where({ ...where })
        .orderBy(orderBy, order)
        .skip(skip)
        .limit(limit);

      if (Object.keys(field).length > 0) {
        query = query.field(field);
      }

      const res = await query.get();
      return { success: true, data: res.data };
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
      const res = await this.collection.doc(id).update({
        data: {
          ...data,
          updatedAt: db.serverDate()
        }
      });
      return { success: true, data: res };
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
      const res = await this.collection.doc(id).remove();
      return { success: true, data: res };
    } catch (err) {
      console.error('删除失败:', err);
      return { success: false, error: err };
    }
  }

  /**
   * 统计数量
   */
  async count(where = {}) {
    try {
      const res = await this.collection.where(where).count();
      return { success: true, data: res.total };
    } catch (err) {
      console.error('统计失败:', err);
      return { success: false, error: err };
    }
  }
}

/**
 * 待办数据库操作
 */
class TodoDB extends DB {
  constructor() {
    super(COLLECTIONS.TODOS);
  }

  /**
   * 获取待办列表
   */
  async getTodoList(status, category, skip = 0) {
    const where = {};
    if (status) where.status = status;
    if (category) where.category = category;

    return this.getList({
      where,
      orderBy: 'createdAt',
      order: 'desc',
      skip,
      limit: 20
    });
  }

  /**
   * 获取今日待办
   */
  async getTodayTodos() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.getList({
      where: {
        status: _.in(['pending', 'doing'])
      },
      orderBy: 'priority',
      order: 'desc',
      limit: 10
    });
  }

  /**
   * 更新待办状态
   */
  async updateStatus(id, status) {
    const updateData = { status };
    if (status === 'done') {
      updateData.completedAt = db.serverDate();
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
      const [pending, doing, done] = await Promise.all([
        this.count({ status: 'pending' }),
        this.count({ status: 'doing' }),
        this.count({ status: 'done' })
      ]);

      return {
        success: true,
        data: {
          pending: pending.data || 0,
          doing: doing.data || 0,
          done: done.data || 0
        }
      };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

/**
 * 卡片数据库操作
 */
class CardDB extends DB {
  constructor() {
    super(COLLECTIONS.CARDS);
  }

  /**
   * 获取今日待复习卡片
   */
  async getTodayReviewCards() {
    const now = new Date();
    return this.getList({
      where: {
        nextReview: _.lte(now)
      },
      orderBy: 'nextReview',
      order: 'asc',
      limit: 50
    });
  }

  /**
   * 获取卡片列表
   */
  async getCardList(tag, skip = 0) {
    const where = {};
    if (tag) where.tags = _.all([tag]);

    return this.getList({
      where,
      orderBy: 'updatedAt',
      order: 'desc',
      skip,
      limit: 20
    });
  }

  /**
   * 更新复习记录
   */
  async updateReview(id, quality) {
    // 先获取卡片信息
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
      nextReview
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
    const now = new Date();
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
      nextReview
    });
  }

  /**
   * 获取所有标签
   */
  async getAllTags() {
    try {
      const res = await this.collection
        .field({ tags: true })
        .get();

      const tagsSet = new Set();
      res.data.forEach(item => {
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
      const now = new Date();
      const [total, dueToday, newCards] = await Promise.all([
        this.count(),
        this.count({ nextReview: _.lte(now) }),
        this.count({ repetitions: 0 })
      ]);

      return {
        success: true,
        data: {
          total: total.data || 0,
          dueToday: dueToday.data || 0,
          newCards: newCards.data || 0
        }
      };
    } catch (err) {
      return { success: false, error: err };
    }
  }
}

// 导出实例
const todoDB = new TodoDB();
const cardDB = new CardDB();

module.exports = {
  db,
  _,
  COLLECTIONS,
  DB,
  TodoDB,
  CardDB,
  todoDB,
  cardDB
};