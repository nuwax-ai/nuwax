# PromptVariableRef 组件文件清单

## 核心组件文件

- `PromptVariableRef.tsx` (41KB, 1223 lines) - 主要组件实现
- `types.ts` (2.7KB, 125 lines) - TypeScript 类型定义
- `index.ts` (575B, 24 lines) - 组件导出入口

## 样式文件

- `styles.less` (10KB, 539 lines) - 组件样式

## 工具函数

### utils/ 目录

- `positionUtils.ts` - 位置计算和智能定位算法
- `treeUtils.ts` - 变量树构建和操作工具
- `parser.ts` - 变量表达式解析工具
- `index.ts` - 工具函数统一导出

## 文档文件

- `README.md` - 组件使用文档
- `CHANGELOG.md` - 版本变更日志（新增）
- `index.ts` - 组件入口文件

## 示例文件

- `example.tsx` (7.6KB, 270 lines) - 完整使用示例

## 测试文件

- `../examples/ScrollTest/index.tsx` - 滚动条定位测试页面（新增）

## 版本历史

### v1.3.0 (2024-11-18) - 一次性删除功能版本（新增）

- ✅ 新增一次性删除高亮区块功能
- ✅ 增强高亮区块视觉效果（闪电图标、hover 提示）
- ✅ 智能删除逻辑和保护机制
- ✅ 添加 DELETE_FEATURE_TEST.md 测试指南

### v1.2.0 (2024-11-18) - 智能定位版本

- ✅ 新增智能动态定位功能
- ✅ 优化位置计算算法
- ✅ 添加 CHANGELOG.md

### v1.1.1 (2024-11-18) - 滚动修复版本

- ✅ 修复输入框滚动时定位问题
- ✅ 添加滚动监听器
- ✅ 新增滚动测试页面

### v1.1.0 (2024-11-17) - 功能完善版本

- ✅ 完整的变量树形结构支持
- ✅ 智能搜索和键盘导航
- ✅ 双模式语法支持

### v1.0.0 (2024-11-16) - 初始版本

- ✅ 基础变量引用功能
- ✅ 简单的下拉选择
- ✅ 基础文本高亮

## 功能特性概览

- 🎯 智能提示和自动补全
- 🌳 树形变量结构支持
- 🔍 实时搜索和过滤
- ⌨️ 完整键盘导航
- 🎨 类型图标系统
- 🌙 暗色主题适配
- 📱 响应式布局
- 🔧 滚动条定位修复
- 🎯 智能动态定位
- ⚡ 一次性删除高亮区块（新增）
- 🧪 完整的测试覆盖

## 技术栈

- React 18 + TypeScript
- Ant Design 组件库
- Less 样式预处理器
- ESLint + Prettier 代码规范

## 维护状态

- ✅ 积极维护中
- 🆕 最新版本：v1.3.0
- 📝 详细变更记录请查看 CHANGELOG.md
- 🧪 功能测试请访问 /examples/ScrollTest
- 📖 新功能测试指南：DELETE_FEATURE_TEST.md
