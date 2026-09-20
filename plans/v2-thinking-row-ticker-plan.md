# V2 思考行内容滚动动效 + RunOver 去扫光(对齐参考 GIF)

日期:2026-09-19 · 分支:feat-dong.0930

## 背景与需求

用户提供参考 GIF(飞书截图 `20260919151859_rec_.gif`):一行「🧠 正在思考 · <内容>」,内容在单行内持续流动滚动。要求:

1. **会话消息流内** V2 轨迹区的思考行运行中实现该内容滚动动效(仅会话中渲染的内容;与进度胶囊 ConversationProgressCapsule、头像旁状态无关)。
2. 运行中标题口径改为「正在思考 ·」对齐 GIF(用户拍板),结束后回「思考」静态行。
3. **RunOver 状态栏**(runover 及头像旁的状态,含 V1/V2 所有渲染位)展示思考中/调用中一律**去掉扫光动效**;扫光只保留在会话消息流渲染内容里(V2 轨迹行标题 shimmer、消息内思考块 sheen)。

## 实现口径

- 滚动方案复用 `src/components/MarkdownCustomThink/index.tsx` L64-84 已验证的 **rAF 贴尾 glide**:`scrollLeft += (max - scrollLeft) * 0.08 + 0.5`(指数缓出 + 最低速度)。JS 驱动,不受用户机器 prefers-reduced-motion 冻结 CSS 动画影响;不用 CSS marquee / scroll-behavior:smooth。
- 数据层零改动:`node.summary` 已是流式思考内容的 firstLine(`projectConversation.ts` L416-425),内容追加时贴尾跟随自然形成流动播放感。
- 不加「· Ns」计时(GIF 无);ticker 内容文本不加扫光(GIF 为纯灰)。

## 改动清单

| 文件 | 改动 |
| --- | --- |
| `src/features/conversation/presentation-v2/react/ProcessNodeRow.tsx` | 私有 hook `useTailGlide(ref, active)`;running reasoning 分支:标题词条 `nodeTitleReasoningRunning` + 保留 shimmer + 「·」分隔 + ticker 摘要结构(`data-testid="v2-node-summary-ticker"`) |
| `src/features/conversation/presentation-v2/react/index.less` | `.node-summary-ticker`(overflow-x:auto+隐藏滚动条+左缘 mask 渐隐+重置 ellipsis)、`.node-summary-ticker-text`(inline-block nowrap)、`.node-dot` |
| `src/locales/i18n/{zh-CN,en-US,zh-HK,zh-TW,ja-JP}.ts` | `ConversationRendererV2.nodeTitleReasoningRunning`,译文对齐各语言 `MarkdownCustomThink.thinking` 措辞 |
| `src/components/ChatView/RunOver/index.tsx` | 删两处 `shimmer-text`:思考中分支、EXECUTING「正在调用 X」分支 |
| `src/components/ChatView/RunOver/index.less` | 删无引用的 `.shimmer-text` 与 `runover-shimmer-sweep` keyframes |
| `tests/conversation/` | 新增用例:running 行「正在思考」+ticker 结构、finished 行回退静态 |

## 明确不做

- 不碰进度胶囊 ConversationProgressCapsule、V1 线 `MarkdownCustomThink`、工具行摘要。
- RunOver 两处扫光都删(口径:仅在会话中渲染的才有扫光,RunOver 是状态栏)。

## 质量门

- `npm run test:conversation` 全绿;`tests/conversationRendererComponent.test.tsx` 轨迹行 shimmer 断言(指向 `data-node-kind` 行)保持绿。
- 改动路径 tsc 零新增(全库 tsc 有预存基线,不作门)。
- 浏览器走查:真实会话思考流看「正在思考 ·」+内容流动、RunOver 思考中无扫光、结束回「思考」。
