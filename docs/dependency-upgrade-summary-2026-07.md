# 依赖升级与性能优化总结

> 日期：2026-07-16 涉及分支：`chore/conservative-deps-upgrade`（上线）、`feat/antd6-upgrade`（备用） PR：https://github.com/nuwax-ai/nuwax/pull/176

---

## 1. 背景

项目核心依赖长期未更新，存在约 30 个待更新项。lockfile 未纳入 git，导致环境间依赖版本不一致。首屏加载存在多个 5MB+ 的超大 chunk。

本次工作在不引入 API 破坏性变更的前提下，完成依赖升级、message 主题修复、打包分包优化、monaco 懒加载、版本锁定和 CI 补建。

## 2. 产出物

| 分支 | 定位 | 状态 |
| --- | --- | --- |
| `chore/conservative-deps-upgrade` | 保守方案，可直接上线 | ✅ 10 commits |
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

**monaco 懒加载**：CodeEditor/CodeViewer 通过 `React.lazy` 封装，消费方零改动，Suspense 内置 `Spin` fallback。两阶段 loading（chunk 下载 + monaco 初始化）已统一为 `Spin`。启用 `esbuildMinifyIIFE` 解决 helper 冲突（与旧 `format: 'iife'` 是不同机制，不影响 xterm）。

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
| `2ac52ec` | 合并 CodeEditor 两阶段 loading 为统一 Spin         |

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

## 8. 自动化验证

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

## 9. 验收清单

### 9.1 影响范围矩阵

| 改动维度 | 影响文件数 | 影响页面 | 高频页面命中 |
| --- | --- | --- | --- |
| message 桥接（antdStatic） | 208 | 全站所有带消息提示的页面 | Login ✓ Chat ✓ Home ✓ EditAgent ✓ |
| CodeEditor/CodeViewer 懒加载 | 15 | 10 页面 + 5 共享组件 | EditAgent ✓ |
| preview-vendor 分包 | 1 | 文件预览（AppDev / ConversationAgent） | — |
| mermaid-vendor 分包 | 11 | Chat / AppDev / EditAgent | Chat ✓ EditAgent ✓ |
| x6-vendor 分包 | 36 处 | Antv-X6 工作流编辑器 | — |
| dnd-vendor 分包 | 26 | EditAgent / Home / SystemManagement | Home ✓ EditAgent ✓ |
| tiptap-vendor 分包 | 15 | EditAgent（Prompt 编辑器） | EditAgent ✓ |
| pdf-vendor 分包 | 2 | AppDev 预览截图 | — |
| xterm-vendor 分包 | 5 | AppDev 终端 / ConversationAgent | — |
| lodash 按需导入 | 2 | Antv-X6 / EditAgent | — |
| esbuildMinifyIIFE | 全局 | 全站所有 chunk | Login ✓ Chat ✓ Home ✓ EditAgent ✓ |

### 9.2 高频页面验收

#### Login（`/login`）

| # | 验证点 | 操作 | 预期 | 关联改动 |
| --- | --- | --- | --- | --- |
| 1 | 登录表单渲染 | 打开 `/login` | 表单、验证码正常渲染 | antd 5.26.7 |
| 2 | 语言切换提示 | 点击语言切换 | `message.success` 正常弹出 | message 桥接 |
| 3 | 登录成功提示 | 输入正确账号登录 | `message.success` 正常弹出 | message 桥接 |
| 4 | 登录失败提示 | 输入错误密码 | `message.error` 正常弹出 | message 桥接 |
| 5 | 首屏 vendor 加载 | DevTools → Network → Filter `vendor` | **不加载**任何 vendor chunk | 分包优化 |

#### Home（`/home`）

| # | 验证点 | 操作 | 预期 | 关联改动 |
| --- | --- | --- | --- | --- |
| 6 | 首页加载 | 登录后进入首页 | 智能体卡片、分类正常渲染 | — |
| 7 | 拖拽排序 | 拖拽智能体卡片排序 | 拖拽正常，排序生效 | dnd-vendor 分包 |
| 8 | 暗色主题 message | 暗色模式下触发 message | message 跟随暗色主题 | message 桥接 |
| 9 | 首屏 vendor 加载 | DevTools → Network → Filter `vendor` | **不加载** preview/mermaid/x6 vendor | 分包优化 |

#### Chat（`/home/chat/:id/:agentId`）

| # | 验证点 | 操作 | 预期 | 关联改动 |
| --- | --- | --- | --- | --- |
| 10 | 对话发送 | 发送一条消息 | 消息正常发送，流式渲染 | — |
| 11 | AI 回复 mermaid | 发送含流程图的提问 | mermaid 图正常渲染 | mermaid-vendor 分包 |
| 12 | 代码块详情 | 点击 AI 回复中的代码块详情 | CodeViewer 先显示 Spin 再加载 | CodeViewer 懒加载 |
| 13 | message 提示 | 创建会话/删除会话 | `message.success` 正常弹出 | message 桥接 |
| 14 | vendor 按需 | 发送含流程图的消息时 | 加载 `mermaid-vendor`（1.6 MB） | 分包优化 |

#### EditAgent（`/space/:spaceId/agent/:agentId`）

| # | 验证点 | 操作 | 预期 | 关联改动 |
| --- | --- | --- | --- | --- |
| 15 | 全屏图标布局 | 系统提示词区域标题栏 | 全屏图标在最右侧 | antd 5.26.7 锁定 |
| 16 | Prompt 编辑器 | 点击系统/用户提示词输入框 | Tiptap 编辑器正常渲染 | tiptap-vendor 分包 |
| 17 | Hook 代码编辑 | 打开 Hook 编辑弹窗，输入代码 | CodeEditor 先显示 Spin 再加载 | CodeEditor 懒加载 |
| 18 | 变量拖拽排序 | 在变量配置中拖拽排序 | 拖拽正常 | dnd-vendor 分包 |
| 19 | 预览调试 AI 回复 | 在预览调试中发送消息 | mermaid 图 / 代码块正常渲染 | mermaid-vendor + CodeEditor 懒加载 |
| 20 | message 提示 | 保存配置 / 提交表单 | `message.success` 正常弹出 | message 桥接 |

### 9.3 功能模块验收

#### 工作流编辑器（`/space/:spaceId/workflow/:workflowId`）

| # | 验证点 | 操作 | 预期 | 关联改动 |
| --- | --- | --- | --- | --- |
| 21 | 画布渲染 | 打开工作流编辑器 | 节点、边正常渲染 | x6-vendor 分包 |
| 22 | 节点拖拽 | 拖拽节点移动 | 拖拽正常 | dnd-vendor 分包 |
| 23 | 节点代码编辑 | 双击节点，编辑代码 | CodeEditor 先 Spin 再加载 | CodeEditor 懒加载 |
| 24 | 条件分支拖拽 | 拖拽条件分支排序 | 拖拽正常 | dnd-vendor 分包 |
| 25 | vendor 加载 | DevTools → Network | 加载 `x6-vendor` + `dnd-vendor` | 分包优化 |

#### AppDev（`/space/:spaceId/app-dev/:projectId`）

| # | 验证点 | 操作 | 预期 | 关联改动 |
| --- | --- | --- | --- | --- |
| 26 | 终端 | 打开远程终端 | 正常渲染，**无 `Super constructor null` 报错** | esbuildMinifyIIFE + xterm-vendor |
| 27 | 代码编辑 | 编辑项目文件 | CodeEditor 先 Spin 再加载 | CodeEditor 懒加载 |
| 28 | 文件预览 | 预览 docx/pdf 文件 | 文档预览正常 | preview-vendor 分包 |
| 29 | 截图导出 | 点击截图导出按钮 | PDF 生成正常 | pdf-vendor 分包 |

#### SystemManagement（`/system/*`）

| # | 验证点 | 操作 | 预期 | 关联改动 |
| --- | --- | --- | --- | --- |
| 30 | i18n 批量编辑 | 打开 i18n 管理批量编辑弹窗 | CodeEditor 先 Spin 再加载 | CodeEditor 懒加载 |
| 31 | 菜单拖拽排序 | 拖拽菜单/角色排序 | 拖拽正常 | dnd-vendor 分包 |
| 32 | ProTable 渲染 | 打开任意管理列表页 | ProTable 翻页、筛选正常 | — |
| 33 | message 提示 | 增删改操作 | `message.success` 正常弹出 | message 桥接 |

### 9.4 全局验收

| # | 验证点 | 操作 | 预期 | 关联改动 |
| --- | --- | --- | --- | --- |
| 34 | 暗色主题 message | 暗色模式下任意页面触发 message | message 跟随暗色主题色 | message 桥接 |
| 35 | 语言切换 message | 切换语言后触发 message | message 文案跟随语言 | message 桥接 |
| 36 | 控制台报错 | 全站浏览各页面 | 无 `Cannot create proxy` / `Super constructor null` 报错 | antdStatic + esbuildMinifyIIFE |
| 37 | 首屏性能 | 打开 Login 页，观察 Network | 仅加载 `umi.js` + `umi.css` + Login chunk，不加载任何 vendor | 分包优化 |

## 10. 回滚

```bash
git checkout dev
pnpm install
```

改动均为增量（新增文件 + 导入路径替换 + webpack 配置），无破坏性 API 变更，回滚零风险。

## 11. 后续路线

| 优先级 | 待办 | 说明 |
| --- | --- | --- |
| 可选 | antd 6 全家桶升级 | 切换到 `feat/antd6-upgrade` 分支，等 pro-components stable |
