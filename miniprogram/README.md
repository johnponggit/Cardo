# 卡卡待办 - 微信小程序

一款集待办管理与知识复习于一体的微信小程序，帮助用户高效管理待办事项并通过间隔复习巩固知识。
卡卡待办是一款集待办管理与知识复习于一体的微信小程序。支持快速记录待办事项、链接收藏和分类管理，完成后可一键生成知识卡片。内置SM-2间隔重复算法，智能安排复习计划，帮助你高效巩固学习内容。简洁易用，让待办不遗漏，让知识记得牢。
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

### 三、用户体系

- 微信一键登录
- 云端数据同步
- 数据导入/导出

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
│   ├── db.js                 # 云数据库封装（TodoDB、CardDB）
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
├── cloudfunctions/           # 云函数
│   └── login/                # 登录云函数（获取openid）
│
└── images/                   # 图标资源
```

**文件统计**：
- 总文件数：**85个**
- 配置文件：5个
- 页面文件：28个（7页面 × 4文件）
- 组件文件：12个（3组件 × 4文件）
- 工具文件：3个
- 云函数：2个
- 图标资源：35个

---

## 数据库设计

### todos 表（待办事项）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 文档ID |
| _openid | String | 用户标识 |
| title | String | 标题 |
| link | String | 链接（可选） |
| category | String | 分类 |
| status | String | 状态：pending/doing/done |
| priority | Number | 优先级：1-3 |
| notes | String | 备注 |
| linkedCardId | String | 关联的卡片ID |
| createdAt | Date | 创建时间 |
| updatedAt | Date | 更新时间 |
| completedAt | Date | 完成时间 |

### cards 表（知识卡片）

| 字段 | 类型 | 说明 |
|------|------|------|
| _id | String | 文档ID |
| _openid | String | 用户标识 |
| front | String | 正面（问题） |
| back | String | 背面（答案） |
| tags | Array | 标签列表 |
| sourceTodoId | String | 来源待办ID |
| easeFactor | Number | 难度因子（默认2.5） |
| interval | Number | 当前间隔天数 |
| repetitions | Number | 连续正确次数 |
| nextReview | Date | 下次复习时间 |
| createdAt | Date | 创建时间 |
| updatedAt | Date | 更新时间 |

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

### 难度因子调整公式

```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
```

范围限制：1.3 ~ 3.0

---

## 快速开始

### 1. 环境准备

- 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
- 注册微信小程序账号（mp.weixin.qq.com），获取 AppID

### 2. 导入项目

1. 打开微信开发者工具
2. 选择「导入项目」
3. 选择 `/work/Cardo/miniprogram` 目录
4. 填入 AppID（或使用测试号）

### 3. 配置云开发

1. 在开发者工具中，点击「云开发」按钮
2. 开通云开发服务，创建环境
3. 记录环境ID，替换 `app.js` 中的 `your-env-id`：

```javascript
// app.js
wx.cloud.init({
  env: 'your-env-id', // 替换为你的云开发环境ID
  traceUser: true,
});
```

### 4. 创建数据库集合

在云开发控制台创建以下集合：

- `todos` - 待办事项
- `cards` - 知识卡片
- `users` - 用户信息（可选）

### 5. 部署云函数

1. 右键点击 `cloudfunctions/login` 目录
2. 选择「上传并部署：云端安装依赖」
3. 等待部署完成

### 6. 编译预览

点击开发者工具的「编译」按钮，即可在模拟器中预览小程序。

---

## 页面说明

### 首页（pages/index）

- 显示今日概览
- 待办/卡片统计数据
- 快速开始复习入口
- 近期待办列表
- 快捷操作按钮

### 待办列表（pages/todo）

- 状态筛选（全部/待处理/进行中/已完成）
- 分类筛选
- 下拉刷新、上拉加载更多
- 勾选完成、编辑、删除操作

### 待办详情（pages/todo-detail）

- 标题、链接、分类、状态、优先级、备注
- 链接粘贴与预览
- 完成后生成知识卡片

### 卡片列表（pages/card）

- 标签筛选
- 统计信息（总数/今日复习/新卡片）
- 复习入口
- 卡片预览

### 卡片详情（pages/card-detail）

- 问题、答案、标签
- 复习进度信息
- 标签推荐

### 复习页面（pages/review）

- 卡片翻转效果
- 质量评分按钮（忘记/困难/良好/简单）
- 复习进度条
- 完成统计

### 个人中心（pages/profile）

- 用户信息展示
- 数据统计
- 数据导入/导出
- 复习提醒设置
- 意见反馈

---

## 开发说明

### 云数据库操作示例

```javascript
// 引入数据库模块
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

### SM-2 算法使用示例

```javascript
const sm2 = require('../../utils/sm2.js');

// 计算下次复习间隔
const result = sm2.calculateNextInterval(
  2,     // repetitions - 连续正确次数
  2.5,   // easeFactor - 难度因子
  4      // quality - 回忆质量
);

console.log(result);
// { interval: 7, easeFactor: 2.5, repetitions: 3 }

// 获取卡片状态
const status = sm2.getCardStatus(card);
// "待复习" / "明天复习" / "3天后复习"

// 获取复习进度
const progress = sm2.getReviewProgress(3);
// { level: '掌握', progress: 60 }
```

---

## 注意事项

1. **云开发环境**：首次使用需要开通云开发服务，免费额度足够个人使用
2. **数据库权限**：建议在云开发控制台设置数据库权限为「仅创建者可写，所有人可读」
3. **图标资源**：当前使用 SVG 格式占位图标，实际使用时建议替换为 PNG 格式
4. **订阅消息**：复习提醒功能需要申请订阅消息模板，并在代码中替换模板ID

---

## 版本历史

### v1.0.0 (2024-03)

- 完成基础功能开发
- 待办收藏模块
- 卡片记忆模块
- SM-2 间隔复习算法
- 用户登录
- 数据导入/导出

---

## 后续规划

- [ ] 深色模式支持
- [ ] 富文本卡片内容
- [ ] 图片上传支持
- [ ] 每日复习提醒推送
- [ ] 学习统计图表
- [ ] 分享功能

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | 微信小程序原生开发 |
| 后端 | 微信云开发 |
| 数据库 | 云数据库（MongoDB） |
| 算法 | SM-2 间隔重复算法 |

---

## 许可证

MIT License