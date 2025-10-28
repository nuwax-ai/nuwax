# 预览地址不一致问题修复总结

## 问题描述

在重新导入项目加载时，发现预览地址不对。keepAlive 接口会返回预览地址（轮询的），当前发现与 startDev 返回的不一样的时候，需要以 keepAlive 为最新。

## 实际接口数据格式

### start-dev 接口返回格式

```json
{
  "projectId": 8336056151511040,
  "projectIdStr": "8336056151511040",
  "devServerUrl": "/page/8336056151511040-1036/dev/",
  "prodServerUrl": null
}
```

### keepAlive 接口返回格式

```json
{
  "projectId": 8336056151511040,
  "projectIdStr": "8336056151511040",
  "devServerUrl": "/page/8336056151511040-1036/dev/"
}
```

**重要说明**：两个接口的 `devServerUrl` 字段格式完全一致，这确保了预览地址更新的可靠性。

## 解决方案

### 1. 修改 keepAlive 接口返回类型定义

**文件**: `src/types/interfaces/appDev.ts`

添加了新的类型定义：

```typescript
/**
 * 保活接口响应数据
 * 实际接口返回格式: { projectId, projectIdStr, devServerUrl }
 */
export interface KeepAliveResponseData {
  /** 项目ID */
  projectId: number;
  /** 项目ID字符串 */
  projectIdStr: string;
  /** 开发服务器URL（可能更新） */
  devServerUrl: string;
}

/**
 * 保活接口API响应类型
 */
export type KeepAliveResponse = RequestResponse<KeepAliveResponseData>;
```

### 2. 更新 DevServerInfo 类型定义

**文件**: `src/types/interfaces/appDev.ts`

更新了 `DevServerInfo` 接口以匹配实际的 start-dev 接口返回格式：

```typescript
/**
 * 开发服务器信息接口
 * 实际 start-dev 接口返回格式: { projectId, projectIdStr, devServerUrl, prodServerUrl }
 */
export interface DevServerInfo {
  /** 项目ID */
  projectId: number;
  /** 项目ID字符串 */
  projectIdStr: string;
  /** 开发服务器URL */
  devServerUrl: string;
  /** 生产服务器URL */
  prodServerUrl: string | null;
}
```

### 3. 更新 keepAlive 接口实现

**文件**: `src/services/appDev.ts`

- 导入了新的 `KeepAliveResponse` 类型
- 更新了 `keepAlive` 函数的返回类型从 `Promise<any>` 改为 `Promise<KeepAliveResponse>`
- 添加了详细的 JSDoc 注释说明接口返回最新的开发服务器 URL

### 4. 更新 useAppDevServer Hook

**文件**: `src/hooks/useAppDevServer.ts`

#### 4.1 添加保活响应处理函数

```typescript
const handleKeepAliveResponse = useCallback(
  (response: any) => {
    // 详细的日志记录
    console.log('🔍 [Server] 处理保活响应:', {
      hasData: !!response?.data,
      hasDevServerUrl: !!response?.data?.devServerUrl,
      responseData: response?.data,
    });

    if (response?.data?.devServerUrl) {
      const newDevServerUrl = response.data.devServerUrl;
      const currentDevServerUrl = devServerUrl;

      // 如果返回的URL与当前URL不同，更新预览地址
      if (newDevServerUrl !== currentDevServerUrl) {
        console.log('🔄 [Server] 保活接口返回新的预览地址，正在更新:', {
          oldUrl: currentDevServerUrl,
          newUrl: newDevServerUrl,
          timestamp: new Date().toISOString(),
        });

        setDevServerUrl(newDevServerUrl);
        onServerStart?.(newDevServerUrl);

        console.log('✅ [Server] 预览地址更新完成');
      } else {
        console.log(
          'ℹ️ [Server] 预览地址未变化，保持当前地址:',
          currentDevServerUrl,
        );
      }
    } else {
      console.log('⚠️ [Server] 保活响应中未包含 devServerUrl');
    }
  },
  [devServerUrl, onServerStart],
);
```

#### 4.2 修改启动服务器逻辑

在 `startServer` 函数中：

1. **启动后立即进行保活检查**：在 startDev 成功后，立即调用一次 keepAlive 接口获取最新的预览地址
2. **优先级处理**：keepAlive 返回的地址优先于 startDev 返回的地址

```typescript
// 启动后立即进行一次保活检查，获取最新的预览地址
console.log('🔄 [Server] 启动后立即进行保活检查，获取最新预览地址...');
keepAlive(projectId)
  .then((keepAliveResponse) => {
    console.log('💗 [Server] 启动后保活检查成功:', keepAliveResponse);
    handleKeepAliveResponse(keepAliveResponse);
  })
  .catch((error) => {
    console.error('❌ [Server] 启动后保活检查失败:', error);
  });
```

#### 4.3 增强保活轮询逻辑

更新了 `startKeepAlive` 函数：

1. **初始保活请求**：启动保活轮询时立即发送一次请求
2. **定时轮询**：每 30 秒执行一次保活请求
3. **响应处理**：每次保活响应都会调用 `handleKeepAliveResponse` 处理预览地址更新
4. **详细日志**：添加了完整的日志记录，便于调试

### 5. 日志记录增强

添加了详细的日志记录，包括：

- 🔍 保活响应处理过程
- 🔄 预览地址更新过程
- ✅ 更新完成确认
- ⚠️ 异常情况警告
- 💗 保活请求成功
- ❌ 保活请求失败
- ⏰ 定时轮询执行

## 核心逻辑

### 预览地址优先级

1. **startDev 接口**：启动开发环境时返回初始预览地址
2. **keepAlive 接口**：轮询返回最新的预览地址，**优先级更高**
3. **地址更新**：当 keepAlive 返回的地址与当前地址不同时，立即更新

### 工作流程

1. 项目启动时调用 `startDev` 获取初始预览地址
2. 启动后立即调用 `keepAlive` 获取最新预览地址
3. 如果 keepAlive 返回的地址不同，更新预览地址
4. 启动定时保活轮询（30 秒间隔）
5. 每次保活响应都会检查并更新预览地址

## 测试建议

1. **重新导入项目**：测试重新导入项目时预览地址是否正确
2. **地址变化**：模拟后端返回不同预览地址的情况
3. **轮询更新**：验证 30 秒轮询是否正常工作
4. **日志检查**：查看控制台日志确认地址更新过程

## 注意事项

1. **向后兼容**：如果 keepAlive 接口不返回 devServerUrl，系统会继续使用 startDev 返回的地址
2. **错误处理**：保活请求失败不会影响现有功能
3. **性能考虑**：保活轮询间隔为 30 秒，不会对性能造成明显影响
4. **日志级别**：生产环境可能需要调整日志级别

## 相关文件

- `src/types/interfaces/appDev.ts` - 类型定义
- `src/services/appDev.ts` - API 接口
- `src/hooks/useAppDevServer.ts` - 服务器管理逻辑
- `src/pages/AppDev/index.tsx` - 主页面组件
