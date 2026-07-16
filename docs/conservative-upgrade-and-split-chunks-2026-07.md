# 依赖升级与分包优化（保守方案）

> 分支：`chore/conservative-deps-upgrade` 基线：`dev` (`ed46e3b09`) 日期：2026-07-16

---

## 1. 改动总览

2 个 commit，212 文件变更：

| commit    | 说明                                            |
| --------- | ----------------------------------------------- |
| `16c2d35` | umi/ahooks 升级 + message 桥接 + typecheck 脚本 |
| `0c37447` | 8 个重型三方库独立分包                          |

### 不包含（保持原样）

- antd 5（不升 6）
- @ant-design/icons 5、@ant-design/x 1、@ant-design/pro-components 2
- @antv/g6 4（不升 v5）
- React 18.3.1

> 对应的激进方案在 `feat/antd6-upgrade` 分支，等 pro-components stable 后可切换。

---

## 2. Commit 1 详细说明

### 2.1 依赖升级

| 包             | 升级前 | 升级后 |
| -------------- | ------ | ------ |
| `@umijs/max`   | 4.6.46 | 4.6.75 |
| `@umijs/utils` | 4.6.46 | 4.6.75 |
| `ahooks`       | 3.9.0  | 3.9.7  |

### 2.2 新增 typecheck 脚本

```json
"typecheck": "tsc --noEmit"
```

项目首次具备独立类型检查能力，可直接接入 CI。

### 2.3 message 静态调用桥接

**问题**：209 个文件使用 `import { message } from 'antd'` 静态调用，无法获取 ConfigProvider 的主题和国际化上下文。

**方案**：

```
组件 / services / utils / models
        │
        ▼
  antdStatic.ts (桥接器)
        │
   ┌────┴─────┐
   ▼          ▼
 App.useApp()  antd 静态 message
 实例（有      (fallback)
 主题/i18n）
```

- 新增 `src/utils/antdStatic.ts`，覆盖 7 个方法：success / error / info / warning / loading / open / destroy
- `src/app.tsx` 新增 `AntdStaticBridge` 组件，在 `AppContainer` 内通过 `App.useApp()` 初始化实例
- 209 个文件导入路径从 `'antd'` 切换到 `'@/utils/antdStatic'`
- 未初始化时（首屏极短窗口）自动 fallback 到 antd 静态方法，不崩溃

---

## 3. Commit 2 详细说明

### 3.1 分包配置

`config/config.ts` 的 `chainWebpack` 中新增 8 个 `cacheGroup`：

| vendor chunk | 匹配库 | 体积 | 使用场景 |
| --- | --- | --- | --- |
| `preview-vendor` | @js-preview、pptx-preview | 4.3 MB | 文档预览（docx/excel/pdf/pptx） |
| `mermaid-vendor` | mermaid、ds-markdown | 1.6 MB | Markdown 流程图渲染 |
| `xterm-vendor` | @xterm/\* | 688 KB | 远程桌面终端 |
| `x6-vendor` | @antv/x6、x6-react-shape | 536 KB | 工作流可视化编辑器 |
| `pdf-vendor` | html2canvas、jspdf | 530 KB | 截图 / PDF 导出 |
| `prompt-editor-vendor` | prompt-kit-editor、@coze-editor | 419 KB | 代码编辑器 |
| `tiptap-vendor` | @tiptap/\* | 106 KB | 富文本编辑器 |
| `charts-vendor` | @ant-design/charts、plots | 70 KB | 图表 |
| `markdown-vendor` | react-markdown、rehype、remark | 67 KB | Markdown 渲染 |

**合计 8.3 MB 代码改为按需加载。**

### 3.2 效果

- **Login / Chat / Home 等高频页面**：不再预加载上述 8.3 MB，首屏更快
- **vendor chunk 浏览器缓存**：文件名固定（如 `mermaid-vendor.async.js`），版本不变时命中缓存，二次访问零下载
- `umi.js`（6.4 MB）为 antd + react 核心，每页必需，未进一步拆分

---

## 4. 验证方法

### 4.1 自动化验证

```bash
# 1. 安装依赖
pnpm install

# 2. 重新生成 .umi 类型
pnpm max setup

# 3. 类型检查（新增脚本）
pnpm typecheck

# 4. 构建
pnpm build:dev      # 开发环境
pnpm build:prod     # 生产环境

# 5. 测试
pnpm test --run
```

**预期结果**：

| 检查项 | 基线 | 升级后 | 判定标准 |
| --- | --- | --- | --- |
| build | ✅ 通过 | ✅ 通过 | 无报错 |
| test | 533 passed / 20 failed | 533 passed / 20 failed | failed 数 ≤ 20（既有失败） |
| typecheck | 158 src 错误 | 158 src 错误 | 无新增 |

### 4.2 分包效果验证

```bash
# 构建后查看 chunk 体积
ls -lS dist/*.js | head -15 | awk '{printf "%.0f KB  %s\n", $5/1024, $9}'

# 确认 vendor chunk 存在
ls dist/*vendor*.js
```

**预期**：输出包含 `preview-vendor`、`mermaid-vendor`、`x6-vendor` 等 9 个 vendor 文件。

### 4.3 运行时手动回归

#### message 桥接

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 启动 `pnpm dev`，打开 Login 页 | 无控制台报错 |
| 2 | 切换到暗色主题 | 触发 `message.success()`，弹出消息**跟随暗色主题** |
| 3 | 切换语言（中 → 英） | `message` 文案跟随语言切换 |
| 4 | 打开任意带表单提交的页面，提交成功 | `message.success` 正常弹出 |

> **关键验证点**：主题切换后 message 是否跟随主题色。升级前静态调用不跟随，升级后应跟随。

#### 分包按需加载

| 页面 | 操作 | 预期 Network |
| --- | --- | --- |
| `/login` | 刷新页面 | **不加载** preview-vendor / mermaid-vendor / x6-vendor |
| `/home` | 登录后进入首页 | **不加载** preview-vendor / mermaid-vendor |
| 工作流编辑器 | 打开工作流页面 | **加载** x6-vendor（536 KB） |
| 知识库预览 | 预览文档 | **加载** preview-vendor（4.3 MB） |
| Chat 对话 | 发送含流程图的消息 | **加载** mermaid-vendor（1.6 MB） |

> **验证方法**：Chrome DevTools → Network → Filter `vendor`，观察哪些 vendor chunk 被请求。

#### 高频页面冒烟

| 页面                      | 检查项                               |
| ------------------------- | ------------------------------------ |
| `/login`                  | 登录表单渲染、验证码、语言切换       |
| `/home`                   | 首页加载、智能体卡片、分类切换       |
| `/home/chat/:id/:agentId` | 对话发送、消息流式渲染、message 提示 |
| `/space/:id/develop`      | 空间列表、智能体开发入口             |
| `/edit-agent/:id`         | 智能体编辑、表单提交、模型配置       |

---

## 5. 回滚方案

如需回滚，直接切回 dev 分支：

```bash
git checkout dev
pnpm install
```

本分支改动均为增量（新增文件 + 导入路径替换 + webpack 配置），无破坏性 API 变更，回滚零风险。

---

## 6. 后续路线

| 优先级 | 待办 | 说明 |
| --- | --- | --- |
| 可选 | antd 6 全家桶升级 | 切换到 `feat/antd6-upgrade` 分支，等 pro-components stable |
| 可选 | `umi.js` 进一步拆分 | 将 antd 独立为 vendor chunk（但每页都需 antd，收益有限） |
| 可选 | 路由级 prefetch | umi `links` 配置关键路由预加载 |
| 建议 | 补 CI | `install + typecheck + build + test` 最小工作流 |
