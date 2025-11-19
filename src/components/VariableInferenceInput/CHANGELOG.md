# Changelog

本文档记录 VariableInferenceInput 组件的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### 计划中

- 支持更多变量引用语法
- 添加变量引用验证功能
- 优化大数据量时的性能
- 增加主题自定义选项

## [1.3.2] - 2024-11-18

### 修复

- ⚡ **自动补全优化**：修复了输入 `{` 时的自动补全行为，光标现在正确保持在 `{}` 中间
- 🔍 **光标管理改进**：只有当用户真正选择变量时，光标才移动到变量引用末尾
- 📝 **调试信息增强**：添加了详细的自动补全调试信息，便于问题排查

### 行为优化

- **输入 `{`** → 自动补全为 `{}` → 光标在中间：`{}`
- **不选择变量** → 光标保持在中间位置
- **选择变量** → 光标移动到末尾：`{{变量名}}`

### 技术改进

- 优化了 `shouldAutoCompleteBrace` 逻辑中的光标位置计算
- 增加了自动补全过程的详细日志记录
- 改进了光标设置的安全性和稳定性

### 用户体验

- ✅ 更直观的变量引用编辑体验
- ✅ 光标始终位于最佳编辑位置
- ✅ 流畅的变量选择和输入流程

## [1.3.1] - 2024-11-18

### 修复

- 🎯 **光标定位优化**：修复了选择变量后光标定位问题，确保光标正确移动到 `}}` 后面
- 🎨 **高亮样式简化**：简化了高亮区块样式，只保留简单的背景色，移除了边框、图标和 hover 提示
- 🔍 **光标位置验证**：增加了光标位置的安全检查和调试信息

### 技术改进

- 修正了 `handleApplyVariable` 函数中的光标位置计算公式
- 增加了光标位置的有效性验证
- 优化了光标设置时机，增加了适当的延时
- 简化了 `.variable-highlight` 样式，移除了复杂的视觉效果

### 向下兼容

- ✅ 保持完全向下兼容
- ✅ 不影响现有的删除行为
- ✅ 只对样式进行了简化优化

## [1.3.0] - 2024-11-18

### 新增

- ⚡ **一次性删除高亮区块**：当光标在高亮变量引用区块中时，退格键和删除键可一次性删除整个高亮区块
- 🎨 **增强高亮区块样式**：添加闪电图标、hover 提示和边框效果，提升用户体验
- 🔍 **高亮区块识别**：智能识别光标位置是否在高亮区块中
- 🧪 **删除功能测试**：在测试页面中添加一次性删除功能的专门测试

### 功能特性

- **智能删除**：光标在高亮区块内时，退格键/删除键一次性删除整个 {{变量名}} 区块
- **视觉反馈**：高亮区块显示 ⚡ 图标，hover 时显示"← 一次删除"提示
- **正常行为保护**：光标在高亮区块外时，保持原有的逐字符删除行为
- **光标位置优化**：删除后光标正确移动到删除位置

### 交互改进

```
示例体验：
文本："用户信息：{{user0.name}} 邮箱：{{user0.email}}"
                   ↑ 将光标放在这里
按退格键 → 删除整个 {{user0.name}} 区块
结果："用户信息： 邮箱：{{user0.email}}"
         ↑ 光标正确位置
```

### 代码变更

- 新增 `findHighlightedBlockAtCursor()` 函数：识别光标位置的高亮区块
- 新增 `deleteHighlightedBlock()` 函数：一次性删除高亮区块
- 增强 `renderHighlightedText()` 函数：为高亮区块添加位置数据
- 更新 `handleInputChange()` 函数：集成删除键检测和处理
- 优化样式：`.variable-highlight` 添加图标、边框和 hover 效果

### 向下兼容

- ✅ 保持完全向下兼容
- ✅ 不影响现有的删除行为
- ✅ 新功能为增量改进，不破坏现有功能

## [1.2.0] - 2024-11-18

### 新增

- 🎯 **智能动态定位功能**：下拉框现在能自动根据光标位置和视口空间计算最佳显示方向
- 📊 **实时位置调试**：在开发模式下显示详细的位置计算信息
- 🔄 **滚动位置同步**：输入框滚动时自动重新计算下拉框位置

### 变更

- ♻️ **API 简化**：移除了 `direction` 参数，现在使用智能自动定位
- 📈 **位置算法优化**：重新设计了位置计算算法，提高定位准确性
- 🔧 **边界处理改进**：更好的视口边界检测和调整

### 移除

- ❌ 移除了固定方向的 `placement` 配置选项
- ❌ 移除了 `calculatePlacementPosition` 函数的手动方向参数

### 技术改进

- 重构了 `calculateDropdownPosition` 函数，使用动态空间检测
- 优化了光标位置计算逻辑，支持滚动偏移
- 增强了边界检测算法，防止下拉框超出视口

## [1.1.1] - 2024-11-18

### 修复

- 🔧 **滚动条定位问题**：修复了输入框出现滚动条后下拉框定位错误的问题
- 📍 **光标位置计算**：修正了光标位置计算时未考虑滚动偏移的 bug
- 🎯 **下拉框跟随**：确保下拉框始终跟随光标实际显示位置

### 新增

- 📱 **滚动监听器**：添加了输入框滚动事件监听，实时更新下拉框位置
- 🧪 **测试页面**：新增了专用的滚动测试页面 `/examples/ScrollTest`

### 改进

- 🔍 **调试信息增强**：添加了更详细的位置计算调试日志
- 📝 **代码注释**：完善了关键逻辑的代码注释

### 代码变更

```tsx
// 修复前
const cursorX = rect.left + currentCol * charWidth;
const cursorY = rect.top + currentLine * lineHeight + lineHeight;

// 修复后
const scrollLeft = textarea.scrollLeft || 0;
const scrollTop = textarea.scrollTop || 0;
const cursorX = rect.left + currentCol * charWidth - scrollLeft;
const cursorY = rect.top + currentLine * lineHeight + lineHeight - scrollTop;
```

## [1.1.0] - 2024-11-17

### 新增

- 🌳 **变量树形结构支持**：完整的嵌套变量和数组索引访问
- 🔍 **智能搜索功能**：支持模糊匹配、精确匹配、前缀匹配和正则表达式
- ⌨️ **键盘导航**：完整的键盘操作支持（↑↓ 选择，Enter 确认，Esc 取消）
- 🎨 **类型图标系统**：不同类型变量显示对应的类型图标
- 🌙 **暗色主题支持**：自动适配暗色主题
- 📱 **响应式布局**：完美适配移动端和桌面端

### 功能特性

- 🔄 **双模式支持**：支持 `{{变量}}` 和 `{变量}` 两种语法
- 🏗️ **自动补全**：输入单个 `{` 时自动补全 `}`
- 📝 **高亮显示**：输入框中高亮显示已输入的变量引用
- 🎯 **精确路径导航**：支持深层嵌套变量路径的精确导航

### 工具函数

- 📊 **解析器工具**：

  - `parseVariableExpression()` - 解析变量表达式
  - `findAllVariableReferences()` - 查找所有变量引用
  - `extractVariableName()` - 提取变量名
  - `isValidVariableReference()` - 验证变量引用格式

- 🌲 **树工具函数**：
  - `buildVariableTree()` - 构建变量树
  - `filterVariableTree()` - 过滤变量树
  - `generateVariableReference()` - 生成变量引用
  - `drillToPath()` - 导航到指定路径

### 组件配置

- 📋 **丰富的 Props**：
  - `variables` - 可用变量列表
  - `onChange` - 值变化回调
  - `onVariableSelect` - 变量选择回调
  - `readonly` - 只读模式
  - `disabled` - 禁用状态
  - `direction` - 弹窗方向（后续版本中废弃）
  - `placeholder` - 占位符文本

### 变量类型系统

- 📝 **完整的类型枚举**：
  ```typescript
  enum VariableType {
    String = 'string',
    Integer = 'integer',
    Boolean = 'boolean',
    Number = 'number',
    Object = 'object',
    Array = 'array',
    ArrayString = 'array_string',
    ArrayInteger = 'array_integer',
    ArrayBoolean = 'array_boolean',
    ArrayNumber = 'array_number',
    ArrayObject = 'array_object',
  }
  ```

### 支持的语法示例

```text
基础变量：{{variable}}
对象属性：{{user.name}}
深层嵌套：{{user.profile.preferences.language}}
数组索引：{{cart[0].name}}
嵌套数组：{{order.items[0].price}}
复合表达式：{{user.name}}购买了{{products[0].name}}
```

### 键盘快捷键

- `↑/↓` - 上下选择变量
- `Enter` - 确认选择变量
- `Esc` - 关闭变量选择菜单
- `{{` - 触发变量选择菜单

## [1.0.0] - 2024-11-16

### 初始版本

- 🎉 **首次发布**：PromptVariableRef 组件正式发布
- ✨ **核心功能**：
  - 基本的变量引用功能
  - 简单的下拉选择
  - 基础的文本高亮

### 初始 API

```tsx
<PromptVariableRef
  variables={variables}
  value={value}
  onChange={setValue}
  direction="bottomLeft"
/>
```

---

## 版本说明

### 版本号规则

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

### 变更类型

- **新增**：新功能
- **变更**：对现有功能的修改
- **废弃**：即将删除的功能
- **移除**：已删除的功能
- **修复**：Bug 修复
- **安全**：安全相关的修复

### 维护状态

- **Active**：积极维护中
- **Maintenance**：仅修复严重问题
- **Deprecated**：即将废弃

## 迁移指南

### 从 v1.1.x 升级到 v1.2.x

**破坏性变更**：

```tsx
// v1.1.x
<PromptVariableRef
  variables={variables}
  value={value}
  onChange={setValue}
  direction="bottomRight"  // 这个参数现在被忽略
/>

// v1.2.x (推荐)
<PromptVariableRef
  variables={variables}
  value={value}
  onChange={setValue}
  // direction 参数已移除，使用智能自动定位
/>
```

**兼容性说明**：

- `direction` 参数仍然被接受，但会被忽略
- 所有现有功能保持完全兼容
- 位置计算现在更加智能和准确

### 从 v1.0.x 升级到 v1.1.x

**主要变化**：

```tsx
// v1.0.x
<PromptVariableRef
  variables={variables}
  value={value}
  onChange={setValue}
/>

// v1.1.x
<PromptVariableRef
  variables={variables}
  value={value}
  onChange={setValue}
  onVariableSelect={(variable, path) => {/* 新功能 */}}
  readonly={false}  // 新增配置
  disabled={false}   // 新增配置
/>
```

## 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进这个组件！

在提交 PR 时，请确保：

- 更新 CHANGELOG
- 添加或更新相关测试
- 保持代码风格一致
- 更新相关文档

## 支持

如果在使用过程中遇到问题：

1. 查看 [GitHub Issues](https://github.com/your-repo/issues)
2. 参考 [README.md](./README.md) 中的使用说明
3. 运行 `/examples/ScrollTest` 测试页面验证功能
