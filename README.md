# 中国近现代史纲要 · 知识图谱与全景时间轴

基于横向时间轴标准尺度与立体思维导图构建的中国近现代史纲要交互画布，把大会决策、武装斗争、经典文献与历史规律编织成可缩放、可连线溯源的全景知识网络。

**在线体验：[https://losecloud.github.io/Modern-and-Contemporary-Chinese-History/](https://losecloud.github.io/Modern-and-Contemporary-Chinese-History/)**

## 主要特性

- **全景时间轴**：以统一尺度横向铺开历史阶段，可自由缩放、拖拽浏览
- **立体思维导图**：事件卡片按主题轨道分层排布，节点间用连线表达因果与继承关系
- **知识溯源**：点击卡片查看详情，并高亮其上下游关联事件
- **快速检索**：关键词搜索直达具体事件与时间点
- **学习指引**：内置复习导引，串联阶段特征与核心线索
- **单文件离线可用**：构建产物把脚本与样式内联，双击 `index.html` 即可运行

## 本地运行

```bash
npm install
npm run dev      # 开发预览
npm run build    # 构建到 dist/，同时刷新根目录 index.html
```

> 直接双击根目录 `index.html` 也能离线使用，无需起服务。

## 数据维护

全部史料与连线配置集中在 `data/historyData.js`（挂载到 `window.HISTORY_DATA`），包含 `tracks`、`periods`、`events` 三部分。修改后刷新页面即可生效，无需重新构建。

`scripts/` 下为数据批量维护脚本，供新增事件或批量修订时使用。

## 目录结构

```
├─ data/historyData.js     # 史料与连线数据
├─ src/                    # React + TypeScript 源码
│  ├─ components/          # 画布、时间轴、卡片、详情弹窗等
│  └─ utils/               # 布局计算
├─ index.html              # 构建后的单文件页面（GitHub Pages 入口）
├─ vite.config.ts          # 构建配置（产物内联 + 发布目录同步）
└─ .github/workflows/      # Pages 自动部署
```

## 部署

推送到 `main` 分支后，GitHub Actions 会自动执行 `npm run build` 并把 `dist/` 发布到 GitHub Pages。
