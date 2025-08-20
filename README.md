# Agent Platform Front

智能体平台前端项目

## 项目概述

这是一个基于 React 的智能体平台前端项目，提供智能体开发、管理和使用的完整解决方案。

## 技术栈

- **前端框架**: React 18
- **UI 组件库**: Ant Design + ProComponents
- **图形引擎**: AntV X6
- **框架工具**: UmiJS Max
- **状态管理**: UmiJS 内置 model
- **类型检查**: TypeScript
- **样式方案**: CSS Modules + Less
- **包管理**: pnpm

## 主要功能

- 智能体开发与管理
- 工作空间管理
- 知识库管理
- 组件库管理
- MCP 服务管理
- 生态系统管理

## 项目结构

```
src/
├── components/          # 通用组件
├── pages/              # 页面组件
├── models/             # 状态管理
├── services/           # API服务
├── hooks/              # 自定义Hooks
├── utils/              # 工具函数
├── types/              # 类型定义
├── constants/          # 常量定义
└── styles/             # 全局样式
```

## 开发指南

### 启动项目

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

### 代码规范

- 使用 TypeScript 进行类型检查
- 组件采用函数式组件和 Hooks
- 样式使用 CSS Modules 避免全局污染
- 遵循 ESLint 和 Prettier 规范

## 常见问题修复

### Grid 布局间距问题

**问题描述**: 当列表数据不能占满屏幕时，Grid 布局会产生不均匀的上下间距。

**解决方案**: 为 Grid 容器添加以下 CSS 属性：

```less
.main-container {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  /* 关键修复：确保内容从顶部开始排列，避免不均匀的间距分布 */
  align-content: start;
  /* 设置最小高度，确保容器有足够的高度来容纳内容 */
  min-height: 170px;
}
```

**已修复的页面**:

- SpaceDevelop (智能体开发)
- SpaceLibrary (组件库)
- SpaceMcpManage (MCP 管理)
- SpaceSquare (空间广场)
- EcosystemMcp (生态系统 MCP)
- EcosystemTemplate (生态系统模板)
- EcosystemPlugin (生态系统插件)
- Square (广场)
- Home (首页)

**修复原理**:

1. `align-content: start` 确保 Grid 行从顶部开始排列，而不是均匀分布
2. `min-height: 170px` 设置容器最小高度，与卡片高度保持一致
3. 避免使用默认的 `align-content: stretch` 导致的拉伸问题

**预防措施**:

- 在使用 CSS Grid 布局时，始终设置 `align-content: start`
- 为列表容器设置合适的最小高度
- 在移动端考虑使用 Flexbox 布局作为替代方案

## 性能优化

- 路由懒加载
- 组件懒加载
- 使用 useMemo 和 useCallback 优化渲染
- 图片懒加载和压缩

## 部署说明

项目支持多环境部署，通过环境变量配置不同环境的 API 地址和配置。

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 许可证

MIT License
