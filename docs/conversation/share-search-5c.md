# 需求 5c 交付:会话内搜索收尾 + 会话/消息分享落地页

> 分支:`feat/conversation-share`(基于 `feat/conversation-renderer-v2` @`08b8597a3`) 状态:mock 全链路可验收,后端契约定型后按「后端替换点」切换

## 一、范围与决策

| 项 | 决策 | 说明 |
| --- | --- | --- |
| 会话内搜索 | 前端方案收尾(最终走后端) | ux-m1 已交付 `ConversationSearchPanel`(全量拉取+本地过滤+定位);本轮补两缺口(见二) |
| 分享落地页形态 | **file-preview.html 静态页思路**(用户定调) | 分享产物=前端组装的 markdown,落在静态页已支持的 md 类型之上;mobile 拼 PC URL 天然跨端 |
| 后端接口未 ready | **mock 打通全链路**(用户确认) | mock 层独立路径,不拦真实文件/桌面分享;后端 ready 只删 mock+改 service 一处 |

## 二、会话内搜索收尾

1. **显隐条件对齐 5c「有会话记录时」**:`Chat/index.tsx` 的 `searchHasMessages` 由 `hasUserSentMessage`(仅本会话发过消息)改为 `hasUserSentMessage || messageList.length > 0`——从历史打开旧会话(未发过消息)首屏加载后即显示搜索图标。
2. **V2 渲染线定位锚点**:`FinalAnswerBlock` 根节点挂 `data-server-message-ids`(turn 内 assistant 消息 server id 空格词列表);`locateMessage` 选择器扩 `[data-server-message-ids~="id"]`(CSS 词匹配)——V2(默认线)assistant 消息定位从「toast 兜底」变可用,定位到 turn 常显区并高亮。

## 三、分享链路(入口 → 弹窗 → 静态落地页)

```
消息操作栏「分享」(用户/助手 × V1/V2)/ 标题栏「分享会话」
  └─ ConversationShareModal(有效期+允许下载,复刻 ShareDesktopModal 交互)
       └─ utils/conversationShareMd.ts 组装 markdown(标题+角色块,剥思考)
            └─ POST /api/agent/conversation/share-md(mock)→ shareKey
                 └─ 复制 /static/file-preview.html?sk=…&dl=1
                      └─ 静态页 GET /api/agent/conversation/share-md/detail/{sk}(mock,响应形态对齐真实接口)
                           └─ content = /api/conversation-share-md/{sk}/{标题}.md(相对路径,静态页零改动)
                                └─ GET 该路径返回 md 正文 → marked 渲染(标题=路径末段文件名)
```

### 关键设计点

- **静态页零改动**:detail 的 `content` 是 `.md` 结尾的相对路径,`file-preview.js` 按既有逻辑取文件名(标题)与类型(md),fetch 内容渲染;过期由 detail 返回错误码走 `showError`。标题经 `sanitizeShareTitle` 清理路径危险字符(`\ / : * ? " < > | # & %`),中文不 encode——静态页取原始字符串作文件名,fetch 时浏览器自动编码。
- **mock 不拦真实分享**:三个端点全走独立路径(`/share-md`),与 `/api/agent/conversation/share`(文件/桌面)零冲突。
- **入口四接线**:V1 用户消息(ChatView)、V1 助手(ChatBottomMore)、V2 助手(FinalAnswerBlock,用户消息走 ChatView 自动覆盖)、标题栏会话分享(ChatTitleActions,有会话且有消息时显示)。
- **分享产物不含思考**:`stripThinkBlocks` 剥内联思考块,只有正文进入分享 md。

## 四、后端替换点(契约定型后)

1. `services/agentConfig.ts` 的 `apiConversationShareMd`:路径切回 `/api/agent/conversation/share`,参数形态按最终契约(建议 `{conversationId, type: MESSAGE|CONVERSATION, messageId?, content: md, expireSeconds, allowDownload}`;`ShareFileInfo.type` 已预留 `MESSAGE` 枚举)。
2. 删除 `mock/conversationShareMd.ts`(三端点),detail 改由真实接口返回(建议 content 指向服务端生成的 md 文件 URL,或后端直接消费 md 内容)。
3. 弹窗与落地页链路不动。

## 五、质量与验收

- `npm run test:conversation`:44 文件 / **419 用例**全绿(基线 409 + 新增 10:搜索面板 4 + md 组装 6);tsc 改动路径零新增。
- 手动验收(mock,本地 dev server):
  - 搜索:历史旧会话直接打开 → 图标显示;V2 线输入关键词 → 点命中 → 滚动定位 turn 常显区+高亮
  - 消息分享:V1 用户/助手、V2 助手操作栏「分享」→ 弹窗 → 生成 → 剪贴板链接浏览器打开 →md 渲染(标题=会话 topic);`dl=1` 可下载 .md
  - 会话分享:标题栏「分享会话」→ 同上,md 含全部消息角色块
  - 过期:有效期选最短档(1 小时)后改 mock 内存时间或等待,刷新落地页 → 错误态
- 移动端:分享 URL 双端共用,无需 mobile 侧改动(mobile-parity-checklist §H 对应行已更新)

## 六、关键文件

| 文件 | 内容 |
| --- | --- |
| `src/utils/conversationShareMd.ts` | md 组装+标题安全化(纯函数,6 单测) |
| `src/components/business-component/ConversationShareModal/` | 分享弹窗 + ShareMessageButton 入口 |
| `src/pages/Chat/components/ConversationSearchPanel/index.tsx` | 定位选择器扩 V2 ids 锚点(4 组件测试) |
| `src/features/conversation/presentation-v2/react/FinalAnswerBlock.tsx` | V2 锚点 `data-server-message-ids` + 分享入口 |
| `src/components/ChatView/index.tsx` / `ChatBottomMore/` | V1 用户/助手分享入口 |
| `src/components/AgentSidebar/ChatTitleActions/index.tsx` | 会话分享入口 |
| `mock/conversationShareMd.ts` | mock 三端点(创建/详情/正文) |
| `src/services/agentConfig.ts` | `apiConversationShareMd` 封装(后端替换单点) |
