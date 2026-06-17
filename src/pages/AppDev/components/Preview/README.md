# Preview 组件资源错误捕获功能

## 功能概述

Preview 组件现在支持捕获两种类型的资源加载失败：

1. **iframe 本身加载失败** - 通过 iframe 的 `onError` 事件捕获
2. **iframe 内部资源加载失败** - 通过注入监听脚本和 postMessage 通信捕获

## 实现特性

### 1. 错误类型支持

- `iframe`: iframe 本身加载失败
- `script`: JavaScript 文件加载失败
- `style`: CSS 文件加载失败
- `image`: 图片资源加载失败
- `fetch`: 网络请求失败（包括 fetch API）
- `other`: 其他资源加载失败
- `promise`: 未捕获的 Promise 错误

### 2. 详细错误信息

- **网络错误**: 包含 HTTP 状态码、错误消息、堆栈信息
- **资源错误**: 包含文件名、行号、列号等位置信息
- **错误分类**: 根据状态码自动分类（4xx 客户端错误，5xx 服务器错误）

### 2. 错误处理机制

- **UI 提示**: 在预览头部显示错误徽章，鼠标悬停查看详情
- **控制台日志**: 详细的错误信息输出到控制台
- **父组件回调**: 通过 `onResourceError` 回调通知父组件
- **错误限制**: 最多保存 50 个错误，避免内存泄漏

### 3. 跨域处理

- 自动检测跨域限制
- 跨域时只能捕获 iframe 本身错误
- 同域时可以捕获内部资源错误

## 使用方法

```tsx
<Preview
  devServerUrl="http://localhost:3000"
  onResourceError={(error) => {
    console.log('资源错误:', error);
    // 处理错误逻辑
  }}
/>
```

## 错误信息结构

```typescript
interface NetworkErrorInfo {
  code?: number;
  message?: string;
  stack?: string;
}

interface ResourceErrorInfo {
  type: 'iframe' | 'script' | 'style' | 'image' | 'other' | 'promise' | 'fetch';
  url: string;
  message: string;
  timestamp: number;
  errorType?: string;
  filename?: string;
  lineno?: number;
  colno?: number;
  networkError?: NetworkErrorInfo | null;
}
```

## 错误示例

### CSS 文件 500 错误

```javascript
{
  type: 'style',
  url: 'http://testagent.xspaceagi.com/page/9833786380193792-744/dev/src/index.css',
  message: '资源加载失败',
  timestamp: 1703123456789,
  errorType: 'error',
  networkError: {
    code: 500,
    message: 'Internal Server Error'
  }
}
```

### JavaScript 文件 404 错误

```javascript
{
  type: 'script',
  url: 'http://localhost:3000/js/app.js',
  message: '资源加载失败',
  timestamp: 1703123456789,
  errorType: 'error',
  networkError: {
    code: 404,
    message: 'Not Found'
  }
}
```

## 测试建议

1. **iframe 404 测试**: 访问不存在的页面
2. **资源 404 测试**: 在页面中引用不存在的 JS/CSS 文件
3. **网络错误测试**: 断网或服务器停止
4. **跨域测试**: 测试不同域名下的行为

## 跨域处理

### 同源情况

- 可以注入错误监听脚本
- 能够捕获 iframe 内部所有资源加载错误
- 显示完整的错误信息

### 跨域情况

- 无法注入错误监听脚本（浏览器安全限制）
- 只能捕获 iframe 本身的加载错误
- UI 会显示"跨域模式"标识
- 错误徽章会显示 ⚠️ 警告图标

## 注意事项

- 错误监听脚本会在 iframe 加载完成后自动注入
- 跨域限制下无法注入脚本，会显示跨域模式标识
- 关键资源（script、style）错误会显示在 UI 中
- 错误列表会自动限制长度，避免性能问题
- 跨域情况下建议使用同源代理或 CORS 配置来获得完整错误信息
