# AppDev Mock 功能使用指南

## 功能概述

AppDev 现在支持 Mock 模式，可以在后端服务不可用时进行前端开发和调试。Mock 模式提供了完整的 API 模拟，包括开发服务器管理、项目上传、构建等功能。

## Mock 模式状态

### 默认行为

**在开发环境下，Mock 模式默认启用**，无需手动配置。首次访问 AppDev 页面时，系统会自动启用 Mock 模式。

### 启用 Mock 模式

#### 方法 1：自动启用（推荐）

在开发环境下，Mock 模式默认启用，无需额外操作。

#### 方法 2：通过 URL 参数

在 URL 中添加 `?mock=true` 参数强制启用：

```
http://localhost:8000/app-dev?projectId=test&mock=true
```

#### 方法 3：通过工具栏切换

1. 打开 AppDev 页面
2. 在右上角工具栏找到 Mock 开关
3. 点击开关启用/禁用 Mock 模式
4. 页面会自动重新加载以应用设置

#### 方法 4：通过 localStorage

在浏览器控制台执行：

```javascript
// 启用Mock模式
localStorage.setItem('appdev-mock-mode', 'true');
window.location.reload();

// 禁用Mock模式
localStorage.setItem('appdev-mock-mode', 'false');
window.location.reload();

// 重置到默认状态（开发环境默认启用）
localStorage.removeItem('appdev-mock-mode');
window.location.reload();
```

## Mock 功能特性

### 1. 开发服务器管理

- **启动开发服务器**：模拟启动过程，返回随机端口
- **停止开发服务器**：模拟停止过程，清空 URL
- **重启开发服务器**：模拟重启过程，生成新的 URL
- **检查状态**：返回当前服务器状态

### 2. 项目上传

- **上传项目**：模拟文件上传过程
- **自动启动**：上传后自动启动开发服务器
- **项目 ID 生成**：自动生成唯一的项目 ID

### 3. 项目构建

- **构建项目**：模拟构建过程
- **构建时间**：随机生成 10-40 秒的构建时间
- **构建状态**：返回构建完成状态

### 4. 数据持久化

- **内存存储**：Mock 数据存储在内存中
- **会话保持**：在同一会话中数据会保持
- **页面刷新**：刷新页面后数据会重置

## Mock 数据管理

### 查看 Mock 数据

在浏览器控制台执行：

```javascript
import { mockUtils } from '@/services/appDev';
console.log('Mock数据:', mockUtils.getMockData());
```

### 添加 Mock 项目

```javascript
import { mockUtils } from '@/services/appDev';
mockUtils.addMockProject('custom-project', {
  name: '自定义项目',
  description: '这是一个自定义的Mock项目',
});
```

### 重置 Mock 数据

```javascript
import { mockUtils } from '@/services/appDev';
mockUtils.resetMockData();
```

### 重置到默认 Mock 状态

```javascript
import { mockUtils } from '@/services/appDev';
mockUtils.resetToDefault(); // 重置到开发环境默认启用状态
```

## Mock API 响应格式

### 成功响应

```json
{
  "code": "0000",
  "displayCode": "0000",
  "message": "操作成功",
  "data": {
    "projectId": "mock-project-1",
    "devServerUrl": "http://localhost:3000",
    "port": 3000,
    "status": "running"
  },
  "tid": "1234567890"
}
```

### 错误响应

```json
{
  "code": "9999",
  "displayCode": "9999",
  "message": "操作失败",
  "data": null,
  "tid": "1234567890"
}
```

## 支持的 API 端点

### 1. 启动开发环境

- **URL**: `/api/custom-page/start-dev`
- **方法**: POST
- **参数**: `{ projectId: string }`
- **Mock 行为**: 启动开发服务器，返回随机端口

### 2. 停止开发环境

- **URL**: `/api/custom-page/stop-dev`
- **方法**: POST
- **参数**: `{ projectId: string }`
- **Mock 行为**: 停止开发服务器，清空 URL

### 3. 重启开发环境

- **URL**: `/api/custom-page/restart-dev`
- **方法**: POST
- **参数**: `{ projectId: string }`
- **Mock 行为**: 重启开发服务器，生成新 URL

### 4. 构建项目

- **URL**: `/api/custom-page/build`
- **方法**: POST
- **参数**: `{ projectId: string }`
- **Mock 行为**: 模拟构建过程

### 5. 检查开发环境状态

- **URL**: `/api/custom-page/dev-status`
- **方法**: GET
- **参数**: `projectId` (查询参数)
- **Mock 行为**: 返回当前服务器状态

### 6. 上传并启动项目

- **URL**: `/api/custom-page/upload-and-start`
- **方法**: POST
- **参数**: FormData (file, projectName)
- **Mock 行为**: 创建新项目并启动

## 开发调试技巧

### 1. 网络延迟模拟

Mock 模式会模拟 300ms 的网络延迟，更真实地模拟网络请求。

### 2. 随机端口生成

开发服务器端口会在 3000-4000 范围内随机生成，避免端口冲突。

### 3. 状态管理

Mock 数据会正确更新状态，Preview 组件会响应 URL 变化。

### 4. 错误处理

Mock 模式包含完整的错误处理，可以测试各种错误场景。

## 注意事项

### 1. 开发环境限制

- Mock 模式只在开发环境（NODE_ENV === 'development'）下可用
- 生产环境会自动禁用 Mock 模式

### 2. 数据持久化

- Mock 数据存储在内存中，页面刷新后会重置
- 如需持久化，可以修改代码使用 localStorage

### 3. 真实 API 切换

- 启用 Mock 模式后，所有 API 调用都会使用 Mock 数据
- 禁用 Mock 模式后，会切换到真实 API 调用

### 4. 调试信息

- Mock 模式会在控制台输出详细的调试信息
- 可以通过控制台查看 Mock 数据的操作过程

## 故障排除

### 1. Mock 模式不生效

- 检查是否在开发环境
- 检查 localStorage 中的设置
- 检查 URL 参数是否正确

### 2. 数据不持久

- Mock 数据默认存储在内存中
- 页面刷新后会重置
- 这是正常行为

### 3. 端口冲突

- Mock 模式使用随机端口
- 如果仍有冲突，可以修改端口范围

### 4. 状态不同步

- 确保页面已重新加载
- 检查 Mock 数据是否正确更新
- 查看控制台调试信息

## 扩展开发

### 1. 添加新的 Mock API

在 `customRequest` 函数中添加新的 URL 匹配逻辑。

### 2. 自定义 Mock 数据

修改 `MOCK_DATA` 对象和 `initMockData` 函数。

### 3. 添加 Mock 工具函数

在 `mockUtils` 对象中添加新的工具方法。

### 4. 自定义响应格式

修改 `mockSuccessResponse` 和 `mockErrorResponse` 函数。
