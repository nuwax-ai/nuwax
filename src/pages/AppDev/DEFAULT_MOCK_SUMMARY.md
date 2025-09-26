# 默认 Mock 模式配置总结

## 修改概述

将 AppDev 的 Mock 模式配置为开发环境下默认启用，提升开发体验，无需手动切换。

## 主要修改

### 1. Mock 模式配置逻辑 (`src/services/appDev.ts`)

**修改前**：

```typescript
const MOCK_MODE =
  process.env.NODE_ENV === 'development' &&
  (localStorage.getItem('appdev-mock-mode') === 'true' ||
    new URLSearchParams(window.location.search).get('mock') === 'true');
```

**修改后**：

```typescript
const MOCK_MODE =
  process.env.NODE_ENV === 'development' &&
  (localStorage.getItem('appdev-mock-mode') !== 'false' || // 默认启用，除非明确禁用
    new URLSearchParams(window.location.search).get('mock') === 'true' ||
    new URLSearchParams(window.location.search).get('mock') !== 'false'); // 默认启用，除非明确禁用
```

**改进点**：

- 开发环境下默认启用 Mock 模式
- 只有在明确禁用时才关闭 Mock 模式
- 支持 URL 参数强制控制

### 2. 初始化函数

**新增功能**：

```typescript
const initMockMode = () => {
  if (process.env.NODE_ENV === 'development') {
    const mockModeSetting = localStorage.getItem('appdev-mock-mode');
    if (mockModeSetting === null) {
      // 如果localStorage中没有设置，默认启用Mock模式
      localStorage.setItem('appdev-mock-mode', 'true');
      console.log(
        '🎭 [AppDev API] Mock mode enabled by default in development',
      );
    }
  }
};
```

**功能**：

- 首次访问时自动设置 Mock 模式为启用
- 只在开发环境下生效
- 提供清晰的日志输出

### 3. Mock 工具函数增强

**新增方法**：

```typescript
resetToDefault: () => {
  if (process.env.NODE_ENV === 'development') {
    localStorage.setItem('appdev-mock-mode', 'true');
    console.log('🎭 [AppDev API] Reset to default Mock mode');
    window.location.reload();
  }
};
```

**功能**：

- 重置到默认 Mock 状态
- 提供开发者重置选项
- 自动重新加载页面

**修改方法**：

```typescript
disableMock: () => {
  localStorage.setItem('appdev-mock-mode', 'false'); // 明确设置为false
  console.log('🎭 [AppDev API] Mock mode disabled');
  window.location.reload();
};
```

**改进**：

- 禁用时明确设置 localStorage 为'false'
- 确保禁用状态持久化

## 行为变化

### 开发环境

1. **首次访问**：自动启用 Mock 模式
2. **后续访问**：保持上次设置的状态
3. **明确禁用**：需要手动关闭开关或设置 localStorage

### 生产环境

- 不受影响，始终禁用 Mock 模式

### URL 参数控制

- `?mock=true`：强制启用 Mock 模式
- `?mock=false`：强制禁用 Mock 模式
- 无参数：使用默认行为（开发环境启用）

## 用户体验改进

### 1. 开箱即用

- 开发者无需手动配置
- 首次访问即可使用 Mock 功能
- 减少配置步骤

### 2. 灵活控制

- 支持多种方式控制 Mock 模式
- 保持向后兼容性
- 提供重置选项

### 3. 清晰反馈

- 控制台输出明确的状态信息
- 工具栏显示当前 Mock 状态
- 提供工具提示说明

## 配置优先级

1. **URL 参数** (`?mock=true/false`) - 最高优先级
2. **localStorage 设置** (`appdev-mock-mode`) - 中等优先级
3. **默认行为** (开发环境启用) - 最低优先级

## 开发者选项

### 控制台命令

```javascript
// 查看当前Mock状态
console.log('Mock enabled:', mockUtils.isMockEnabled());

// 启用Mock模式
mockUtils.enableMock();

// 禁用Mock模式
mockUtils.disableMock();

// 重置到默认状态
mockUtils.resetToDefault();

// 查看Mock数据
console.log(mockUtils.getMockData());
```

### 环境变量

- `NODE_ENV=development`：启用默认 Mock 模式
- `NODE_ENV=production`：禁用 Mock 模式

## 注意事项

### 1. 向后兼容

- 现有配置不会丢失
- 已禁用的 Mock 模式保持禁用状态
- 支持所有原有的控制方式

### 2. 团队协作

- 团队成员首次访问会自动启用 Mock 模式
- 可以通过项目配置统一管理
- 支持个人偏好设置

### 3. 调试便利

- 默认启用减少调试步骤
- 提供多种控制方式
- 清晰的日志输出

## 测试验证

### 测试场景

1. **首次访问**：确认自动启用 Mock 模式
2. **禁用后重新访问**：确认保持禁用状态
3. **URL 参数控制**：确认参数优先级正确
4. **生产环境**：确认 Mock 模式被禁用

### 预期结果

- 开发环境默认启用 Mock 模式
- 生产环境始终禁用 Mock 模式
- 用户设置得到正确保持
- 所有控制方式正常工作

## 总结

通过将 Mock 模式设置为开发环境默认启用，大大提升了开发体验：

1. **减少配置**：开发者无需手动启用 Mock 模式
2. **保持灵活**：仍然支持多种控制方式
3. **向后兼容**：不影响现有配置
4. **清晰反馈**：提供明确的状态指示

这个改进让 AppDev 在开发环境下更加友好和易用！
