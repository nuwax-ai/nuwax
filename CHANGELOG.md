# 更新日志

本项目的所有重要变更都会记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范。

## [1.0.1] - 2025-11-10

### 📝 文档

- 更新 README 文档内容和结构
- 更新 nuwax-cli 版本信息

### 🔧 构建/工具

- 新增项目开发规则文档
- 优化构建配置和依赖管理
- 更新依赖版本（prompt-kit-editor、simple-edit-markdown、ds-markdown 等）
- 优化 Husky 和 Git 钩子配置
- 清理未使用的文件和依赖

### ✨ 新功能

- 为 MCP 管理添加官方服务与自定义服务分类
- 为生态市场添加 MCP 模块和分类筛选功能
- 为智能体添加设置展开扩展页面区域与隐藏聊天区域切换
- 为页面开发中的聊天会话框新增复制粘贴图片功能
- 为输入框添加复制粘贴功能
- 为预置引导问题添加图标和字数限制
- 为创建分享添加组件弹窗优化样式以及添加 loading 和空状态
- 临时会话手机端添加 clear 刷子功能
- 优化 AppDev 页面逻辑和 UI 状态处理

### 🐛 Bug 修复

- 修复 MCP 搜索以及滚动加载问题
- 修复会话框向下滑动时无法鼠标滚动的问题
- 修复事件绑定与预置问题设置必填参数校验
- 优化会话主题闪现问题
- 移除调试日志输出

### ⚡️ 性能优化

- 优化代码逻辑和组件性能
- 优化 loading 效果
- 优化 iframe 内部导出添加新的 sandbox 值
- 为智能体组件设置卡片添加 placeholder
- 优化会话处理卡片和智能体编排交互

### ♻️ 重构

- 重构 AppDev 页面开发日志查看器，从悬浮式改为内嵌式
- 重构页面开发聊天框关于数据源切换
- 重构页面开发输入框组件
- 重构广场组件和生态市场模板逻辑
- 重构智能体开发卡片和数据表

## [1.0.0] - 2025-11-01

### ✨ 新功能

- 智能体平台前端项目初始版本发布
- 基于 React 18 + UmiJS Max + Ant Design 的智能体平台前端项目
- 提供智能体开发、管理和使用的完整解决方案
- 集成先进的 AI Agent 系统，支持文件管理、代码编辑、实时预览和 AI 助手聊天功能
- AppDev Web IDE：集成开发环境，支持文件管理、代码编辑和实时预览
- AI 助手聊天：基于新的 OpenAPI 规范的实时 AI 对话功能，支持流式响应和工具调用
- 工作空间管理：项目文件树管理、文件上传和版本控制
- 知识库管理：智能体知识库的创建和维护
- 组件库管理：可复用组件的管理和发布
- MCP 服务管理：Model Context Protocol 服务集成
- 生态系统管理：插件、模板和服务的生态系统
- 动态主题背景切换：支持 8 种预设背景图片，实时切换，状态持久化

### 🎨 技术栈

- **前端框架**: React 18 + TypeScript 5.0
- **UI 组件库**: Ant Design 5.4 + ProComponents
- **代码编辑器**: Monaco Editor 0.53.0
- **图形引擎**: AntV X6 2.18.1
- **框架工具**: UmiJS Max 4.x
- **状态管理**: UmiJS 内置 model
- **样式方案**: CSS Modules + Less
- **包管理**: pnpm 10.17.1
- **SSE 通信**: @microsoft/fetch-event-source 2.0.1

[1.0.0]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.0
[1.0.1]: https://github.com/nuwax-ai/nuwax/releases/tag/v1.0.1
