# 依赖升级与性能优化总结

> 日期：2026-07-16 涉及分支：`chore/conservative-deps-upgrade`（上线）、`feat/antd6-upgrade`（备用）

---

## 1. 背景

项目核心依赖长期未更新，存在约 30 个待更新项。lockfile 未纳入 git，导致环境间依赖版本不一致。首屏加载存在多个 5MB+ 的超大 chunk。

本次工作在不引入 API 破坏性变更的前提下，完成依赖升级、message 主题修复、打包分包优化、monaco 懒加载、版本锁定和 CI 补建。

## 2. 产出物

| 分支 | 定位 | 状态 |
| --- | --- | --- |
| `chore/conservative-deps-upgrade` | 保守方案，可直接上线 | ✅ 9 commits |
| `feat/antd6-upgrade` | 激进方案（antd 6 + g6 v5），等 pro-components stable | ✅ 4 commits，备用 |

## 3. 保守方案改动明细

### 3.1 依赖升级

| 包             | 升级前                | 升级后          |
| -------------- | --------------------- | --------------- |
| `@umijs/max`   | 4.6.46                | 4.6.75          |
| `@umijs/utils` | 4.6.46                | 4.6.75          |
| `ahooks`       | 3.9.0                 | 3.9.7           |
| `antd`         | ^5.4.0（实际 5.29.3） | **锁定 5.26.7** |

> antd 从 `^5.4.0` 改为精确版本 `5.26.7`，与线上部署版本一致。

### 3.2 message 静态调用桥接

**问题**：209 个文件使用 `import { message } from 'antd'` 静态调用，无法获取 ConfigProvider 的主题和国际化上下文。

**方案**：

```
组件 / services / utils / models（208 个文件）
        │
        ▼
  src/utils/antdStatic.ts（桥接器）
        │
   ┌────┴─────┐
   ▼          ▼
 App.useApp()  antd 静态 message
 实例（有      （fallback，不崩溃）
 主题/i18n）
```

- 新增 `src/utils/antdStatic.ts`，覆盖 7 个方法：success / error / info / warning / loading / open / destroy
- `src/app.tsx` 新增 `AntdStaticBridge` 组件，在 `AppContainer` 内通过 `App.useApp()` 初始化实例
- 208 个文件导入路径从 `'antd'` 切换到 `'@/utils/antdStatic'`

### 3.3 打包分包优化

`config/config.ts` 新增 10 个 vendor cacheGroup + monaco 懒加载，合计 8.6 MB 改为按需加载：

| vendor chunk           | 体积   | 使用场景                          |
| ---------------------- | ------ | --------------------------------- |
| `preview-vendor`       | 4.3 MB | 文档预览（docx/excel/pdf/pptx）   |
| `mermaid-vendor`       | 1.6 MB | Markdown 流程图                   |
| `xterm-vendor`         | 688 KB | 远程终端                          |
| `x6-vendor`            | 536 KB | 工作流编辑器                      |
| `pdf-vendor`           | 530 KB | 截图 / PDF 导出                   |
| `prompt-editor-vendor` | 419 KB | 代码编辑器                        |
| `dnd-vendor`           | 145 KB | 拖拽组件                          |
| `tiptap-vendor`        | 106 KB | 富文本编辑器                      |
| `charts-vendor`        | 70 KB  | 图表                              |
| `markdown-vendor`      | 67 KB  | Markdown 渲染                     |
| `monaco-bundle`        | 33 KB  | Monaco 编辑器封装层（懒加载入口） |

**monaco 懒加载**：CodeEditor/CodeViewer 通过 `React.lazy` 封装，消费方零改动，Suspense 内置 `Spin` fallback。启用 `esbuildMinifyIIFE` 解决 helper 冲突（与旧 `format: 'iife'` 是不同机制，不影响 xterm）。

**无法进一步拆分**：`umi.js`（6.4 MB，antd + react 核心，每页必需）。

### 3.4 版本锁定

- antd 从 `^5.4.0` 锁定为 `5.26.7`（修复 pnpm 重解析导致的样式 bug）
- `pnpm-lock.yaml`（789 KB）纳入 git 管理

### 3.5 CI 工作流

新增 `.github/workflows/ci.yml`，PR/push 自动执行：

```
install (--frozen-lockfile) → typecheck → build → test
```

### 3.6 其他

- 新增 `pnpm typecheck` 脚本（`tsc --noEmit`）
- 修复 2 处 `import _ from 'lodash'` 全量导入为按需导入
- 删除无引用文件 `NestedForm copy 2.tsx`

## 4. Commit 记录

| commit    | 说明                                               |
| --------- | -------------------------------------------------- |
| `16c2d35` | umi/ahooks 升级 + message 桥接 + typecheck 脚本    |
| `0c37447` | 9 个重型库独立分包                                 |
| `a345f23` | dnd-vendor 分包 + lodash 按需导入 + 删除无引用文件 |
| `1607a46` | 锁定 antd 5.26.7（修复样式 bug）                   |
| `a3048b1` | pnpm-lock.yaml 纳入 git                            |
| `fd15f18` | monaco 懒加载 + CI 工作流                          |
| `9c4148a` | 补充 esbuildMinifyIIFE 注释                        |

## 5. 升级前后对比

### 5.1 依赖版本

| 包 | 之前 (dev) | 之后 |
| --- | --- | --- |
| `@umijs/max` | 4.6.46 | **4.6.75** |
| `ahooks` | 3.9.0 | **3.9.7** |
| `antd` | ^5.4.0（不确定，环境间可能不同） | **5.26.7**（锁定） |
| lockfile | 不在 git，版本漂移 | **pnpm-lock.yaml 纳入 git** |

### 5.2 message 主题

| 维度 | 之前 | 之后 |
| --- | --- | --- |
| 导入方式 | `import { message } from 'antd'`（209 文件） | `import { message } from '@/utils/antdStatic'`（208 文件） |
| 主题跟随 | ❌ 静态调用不跟随 ConfigProvider | ✅ 桥接到 App.useApp() 实例 |
| 暗色模式 | message 弹出为默认蓝色 | message 跟随暗色主题 |

### 5.3 打包分包

| 维度 | 之前 | 之后 |
| --- | --- | --- |
| vendor chunk 数 | 1（xterm 688KB） | **11 个**（共 8.6 MB 按需加载） |
| 最大共享 async chunk | **6.2 MB** | **3.9 MB** |
| 第二大共享 chunk | **5.6 MB** | 已拆散到 vendor |
| CodeEditor/CodeViewer | 同步加载，monaco 在共享 chunk | **React.lazy 懒加载** |
| Login 页首屏额外加载 | 预加载大量无关 vendor | **零额外 vendor** |

### 5.4 工程基建

| 维度     | 之前              | 之后                                  |
| -------- | ----------------- | ------------------------------------- |
| 类型检查 | 无独立脚本        | **`pnpm typecheck`**                  |
| CI       | 无                | **`.github/workflows/ci.yml`**        |
| 版本锁定 | lockfile 不在 git | **lockfile 纳入 git + antd 精确锁定** |

### 5.5 代码清理

| 维度        | 之前                              | 之后         |
| ----------- | --------------------------------- | ------------ |
| lodash 导入 | 3 处全量 `import _ from 'lodash'` | **按需导入** |
| 无引用文件  | `NestedForm copy 2.tsx` 存在      | **已删除**   |

### 5.6 验证结果（不变项）

| 检查项 | 之前 | 之后 |
| --- | --- | --- |
| build | ✅ | ✅ |
| test | 533 passed / 20 failed | **533 passed / 20 failed**（零新增回归） |
| typecheck | 158 src 错误（既有） | **158 src 错误**（零新增） |

## 6. 收益

| 维度 | 具体 |
| --- | --- |
| **message 主题** | 208 个文件的 `message.xxx()` 从此跟随 ConfigProvider 主题/语言 |
| **首屏加载** | 8.6 MB 三方库改为按需加载，Login/Chat/Home 等高频页面不再预加载 |
| **monaco 懒加载** | CodeEditor/CodeViewer 仅在实际渲染时加载 monaco chunk |
| **版本一致性** | antd 锁版本 + lockfile 入 git，杜绝环境间版本漂移 |
| **CI 门禁** | 每次 PR 自动跑 typecheck + build + test |
| **工程基建** | 新增 `pnpm typecheck`，首次具备独立类型检查能力 |
| **代码清理** | 删除无引用文件 + lodash 全量导入修复 |

## 7. 风险

| 风险 | 等级 | 应对 |
| --- | --- | --- |
| antd 被 pnpm 重解析 | 🟢 已解决 | 锁版本 + lockfile 入 git |
| message 桥接首屏 fallback | 🟢 极低 | 未初始化时回退到 antd 静态方法，不崩溃 |
| esbuildMinifyIIFE 影响 xterm | 🟢 低 | 与旧 `format: 'iife'` 是不同机制，xterm 已有 ESM alias 保护，需上线前验证终端功能 |
| antd 6 升级被阻塞 | 🟡 待定 | pro-components 3.x 仍 beta，stable 后切 `feat/antd6-upgrade` |

## 8. 验证方法

```bash
# 安装（按 lockfile）
pnpm install

# 类型检查
pnpm typecheck

# 构建
pnpm build:dev

# 测试
pnpm test --run
```

**预期**：build 通过；test 533 passed / 20 failed（既有失败，零新增回归）。

### 运行时验证

| 验证点 | 操作 | 预期 |
| --- | --- | --- |
| message 主题跟随 | 切换暗色主题后触发 message.success | 消息跟随暗色主题 |
| 分包按需加载 | 打开 Login 页，DevTools → Network → Filter `vendor` | 不加载 preview/mermaid/x6 vendor |
| 分包按需加载 | 打开工作流页面 | 加载 x6-vendor + dnd-vendor |
| 全屏图标布局 | 进入 EditAgent → 系统提示词区域 | 全屏图标在最右侧（antd 5.26.7） |
| xterm 终端 | 打开远程桌面终端 | 正常渲染，无 `Super constructor null` 报错 |
| CodeEditor 懒加载 | 进入含代码编辑器的页面 | 先显示 Spin，随后编辑器加载完成 |

## 9. 回滚

```bash
git checkout dev
pnpm install
```

改动均为增量（新增文件 + 导入路径替换 + webpack 配置），无破坏性 API 变更，回滚零风险。

## 10. 后续路线

| 优先级 | 待办 | 说明 |
| --- | --- | --- |
| 可选 | antd 6 全家桶升级 | 切换到 `feat/antd6-upgrade` 分支，等 pro-components stable |
| 可选 | 两阶段 loading 合并 | CodeEditor 的 Suspense Spin + monaco init loading 合并为一个 |
