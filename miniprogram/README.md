# 卡卡待办 - 微信小程序

一款集待办管理与知识复习于一体的微信小程序，帮助用户高效管理待办事项并通过间隔复习巩固知识。

---

## 功能特性

### 一、待办收藏模块

- **快速记录**：支持文字+链接的待办事项
- **分类管理**：技术文章、购物清单、电影书籍、工作事项、其他
- **状态标记**：待处理 / 进行中 / 已完成
- **优先级设置**：高 / 中 / 低三级优先级
- **链接识别**：自动识别并预览链接
- **卡片关联**：待办完成后可一键生成知识点卡片

### 二、卡片记忆模块

- **知识卡片**：创建正面问题+背面答案的知识卡片
- **标签分类**：灵活的标签管理系统
- **间隔复习**：基于 SM-2 算法的智能复习提醒
  - 复习间隔：1天 → 3天 → 7天 → 14天 → 30天
  - 根据记忆质量动态调整间隔
- **复习统计**：记录复习次数、难度因子等数据

### 三、数据管理

- 本地存储，无需服务器
- 数据导入/导出（通过剪贴板）
- 一键清空数据

---

## 项目结构

```
miniprogram/
├── app.js                    # 应用入口
├── app.json                  # 应用配置（页面路由、TabBar等）
├── app.wxss                  # 全局样式
├── project.config.json       # 项目配置
├── sitemap.json              # sitemap配置
│
├── utils/                    # 工具模块
│   ├── db.js                 # 本地存储封装（TodoDB、CardDB）
│   ├── sm2.js                # SM-2 间隔重复算法
│   └── util.js               # 通用工具函数
│
├── components/               # 公共组件
│   ├── todo-item/            # 待办项组件
│   ├── card-item/            # 卡片项组件
│   └── review-card/          # 复习卡片组件
│
├── pages/                    # 页面
│   ├── index/                # 首页（今日概览）
│   ├── todo/                 # 待办列表页
│   ├── todo-detail/          # 待办详情页
│   ├── card/                 # 卡片列表页
│   ├── card-detail/          # 卡片详情页
│   ├── review/               # 复习页面
│   └── profile/              # 个人中心页
│
└── images/                   # 图标资源
```

---

## 数据结构

### todos（待办事项）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 唯一ID |
| title | String | 标题 |
| link | String | 链接（可选） |
| category | String | 分类 |
| status | String | 状态：pending/doing/done |
| priority | Number | 优先级：1-3 |
| notes | String | 备注 |
| linkedCardId | String | 关联的卡片ID |
| createdAt | String | 创建时间 |
| updatedAt | String | 更新时间 |
| completedAt | String | 完成时间 |

### cards（知识卡片）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 唯一ID |
| front | String | 正面（问题） |
| back | String | 背面（答案） |
| tags | Array | 标签列表 |
| sourceTodoId | String | 来源待办ID |
| easeFactor | Number | 难度因子（默认2.5） |
| interval | Number | 当前间隔天数 |
| repetitions | Number | 连续正确次数 |
| nextReview | String | 下次复习时间 |
| createdAt | String | 创建时间 |
| updatedAt | String | 更新时间 |

---

## SM-2 算法说明

SM-2 是一种经典的间隔重复算法，用于优化记忆效果。

### 回忆质量等级

| 等级 | 描述 |
|------|------|
| 0 | 完全忘记 |
| 1 | 错误，但有点印象 |
| 2 | 错误，但想起来觉得简单 |
| 3 | 困难，但正确 |
| 4 | 犹豫后正确 |
| 5 | 完美回忆 |

### 复习间隔计算

- **质量评分 ≥ 3**：复习成功，间隔递增
  - 第1次：1天
  - 第2次：3天
  - 第3次：7天
  - 第4次：14天
  - 第5次：30天
  - 之后：根据难度因子计算

- **质量评分 < 3**：复习失败，重置间隔为1天

---

## 快速开始

### 1. 环境准备

- 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号（mp.weixin.qq.com），获取 AppID

### 2. 导入项目

1. 打开微信开发者工具
2. 选择「导入项目」
3. 选择 `miniprogram` 目录
4. 填入 AppID（或使用测试号）

### 3. 编译预览

点击开发者工具的「编译」按钮，即可在模拟器中预览小程序。

---

## 数据存储说明

本应用使用微信小程序本地存储（wx.setStorageSync），数据保存在用户设备本地。

### 存储键名

- `cardo_todos` - 待办事项数据
- `cardo_cards` - 知识卡片数据

### 数据导出/导入

在「我的」页面可以：
- **导出数据**：将数据复制到剪贴板
- **导入数据**：从剪贴板读取 JSON 数据并合并
- **清空数据**：删除所有本地数据

---

## 开发说明

### 本地存储操作示例

```javascript
// 引入存储模块
const { todoDB, cardDB } = require('../../utils/db.js');

// 添加待办
await todoDB.add({
  title: '学习微信小程序',
  category: '技术文章',
  status: 'pending',
  priority: 1
});

// 获取待办列表
const res = await todoDB.getTodoList('pending', null, 0);

// 更新待办状态
await todoDB.updateStatus(todoId, 'done');

// 添加卡片
await cardDB.add({
  front: '什么是闭包？',
  back: '闭包是指有权访问另一个函数作用域中变量的函数...',
  tags: ['JavaScript', '前端']
});

// 更新复习记录
await cardDB.updateReview(cardId, 4); // quality: 0-5
```

---

## 注意事项

1. **数据安全**：数据存储在用户设备本地，卸载小程序会导致数据丢失，请定期导出备份
2. **存储限制**：微信小程序本地存储上限为 10MB
3. **图标资源**：当前使用占位图标，实际使用时建议替换为合适格式

---

## 版本历史

### v1.0.0

- 完成基础功能开发
- 待办收藏模块
- 卡片记忆模块
- SM-2 间隔复习算法
- 本地数据存储
- 数据导入/导出

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | 微信小程序原生开发 |
| 存储 | 微信本地存储 |
| 算法 | SM-2 间隔重复算法 |

---

## 许可证

MIT License