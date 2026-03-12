// utils/sm2.js - SM-2 间隔重复算法

/**
 * SM-2 算法实现 (简化版)
 * 原始算法参考: https://www.supermemo.com/zh/archivo1994
 */

/**
 * 复习间隔配置
 */
const INTERVALS = {
  FIRST: 1,
  SECOND: 3,
  THIRD: 7,
  FOURTH: 14,
  FIFTH: 30
};

/**
 * 默认难度因子
 */
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 3.0;

/**
 * 回忆质量等级
 */
const QUALITY = {
  COMPLETE_BLACKOUT: 0,
  INCORRECT_PARTIAL: 1,
  INCORRECT_EASILY: 2,
  DIFFICULT: 3,
  HESITANT: 4,
  PERFECT: 5
};

/**
 * 计算新的难度因子
 */
function calculateEaseFactor(easeFactor, quality) {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEF));
}

/**
 * 计算下次复习间隔
 */
function calculateNextInterval(repetitions, easeFactor, quality) {
  let newRepetitions;
  let newInterval;
  let newEaseFactor;

  if (quality >= 3) {
    newRepetitions = repetitions + 1;
    newEaseFactor = calculateEaseFactor(easeFactor, quality);

    if (newRepetitions === 1) {
      newInterval = INTERVALS.FIRST;
    } else if (newRepetitions === 2) {
      newInterval = INTERVALS.SECOND;
    } else if (newRepetitions === 3) {
      newInterval = INTERVALS.THIRD;
    } else if (newRepetitions === 4) {
      newInterval = INTERVALS.FOURTH;
    } else if (newRepetitions === 5) {
      newInterval = INTERVALS.FIFTH;
    } else {
      newInterval = Math.round(INTERVALS.FIFTH * Math.pow(newEaseFactor, newRepetitions - 5));
      newInterval = Math.min(newInterval, 365);
    }
  } else {
    newRepetitions = 0;
    newInterval = INTERVALS.FIRST;
    newEaseFactor = calculateEaseFactor(easeFactor, quality);
  }

  return {
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions
  };
}

/**
 * 计算下次复习日期
 */
function calculateNextReviewDate(intervalDays) {
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);
  nextReview.setHours(0, 0, 0, 0);
  return nextReview;
}

/**
 * 获取卡片状态描述
 */
function getCardStatus(card) {
  if (!card.nextReview) return '新卡片';

  const now = new Date();
  const nextReview = new Date(card.nextReview);

  if (nextReview <= now) {
    return '待复习';
  }

  const diffDays = Math.ceil((nextReview - now) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return '明天复习';
  } else if (diffDays <= 7) {
    return `${diffDays}天后复习`;
  } else {
    return formatDate(nextReview);
  }
}

/**
 * 格式化日期
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 获取复习进度
 */
function getReviewProgress(repetitions) {
  const levels = ['入门', '熟悉', '掌握', '精通', '专家', '大师'];
  const level = Math.min(repetitions, levels.length - 1);

  return {
    level: levels[level],
    progress: Math.min(100, repetitions * 20)
  };
}

/**
 * 估算记忆强度
 */
function estimateMemoryStrength(easeFactor, repetitions) {
  const efScore = ((easeFactor - MIN_EASE_FACTOR) / (MAX_EASE_FACTOR - MIN_EASE_FACTOR)) * 50;
  const repScore = Math.min(50, repetitions * 10);
  return Math.round(efScore + repScore);
}

module.exports = {
  INTERVALS,
  DEFAULT_EASE_FACTOR,
  MIN_EASE_FACTOR,
  MAX_EASE_FACTOR,
  QUALITY,
  calculateEaseFactor,
  calculateNextInterval,
  calculateNextReviewDate,
  getCardStatus,
  formatDate,
  getReviewProgress,
  estimateMemoryStrength
};