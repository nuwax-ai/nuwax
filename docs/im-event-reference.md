# IM 事件对照表：`window.__im` 监听桥与 WS 协议

宿主（PC Web、nuwaclaw webview、后续独立客户端）接入 IM 事件时的速查表。对照基准为消息子模块 pin `757bcf0d`（2026-09-29）。协议以子模块源码为准，本文记录对照结果和本仓的接线口径；两者冲突时以源码为准。

## 1. 真源

| 内容 | 文件（`submodules/nuwax-im/` 下） |
| --- | --- |
| WS 帧结构、OpCode、deviceId | `nuwax-im-web/src/ws/protocol.ts` |
| 下行帧分发、连接状态机、心跳与重连 | `nuwax-im-web/src/ws/ImSocket.ts` |
| 监听桥契约（`onMessage` / `onUnreadChange` / `onConnectionChange` / `getSnapshot`） | `nuwax-im-web/src/lib/imBridge.ts` |
| 自定义事件通道（`onCustomEvent`） | `nuwax-im-web/src/lib/customEvents.ts` |
| 复用 IM 界面、只订阅事件（路 A） | `docs/10-window.__im 监听接入文档.md` |
| 自己连接 WS、调用 REST（路 B） | `docs/09-Web宿主系统对接文档.md` |

上游文档有以下已知笔误，按源码更正：

- docs/10 §1.3 把 `READ_NOTIFY` / `READ_NOTIFY_AGG` / `SYNC_RESP` 写成 2001 / 2002 / 9001，实际为 4001 / 4002 / 5001。
- docs/09 §11.1 说 3007 是"唯一已对外暴露的"帧。DEV-327 之后，3002 也已经通过 `onMessage` 暴露。
- docs/09 §8.3 写的已读 HTTP 兜底接口是 `/ack`。按 `ImSocket.ts` 注释与 `api/index.ts`：已读（`READ_REPORT`）对应 `POST …/conversations/{convId}/read`，收讫（`MSG_RECV_ACK`）对应 `POST …/conversations/{convId}/ack`。

升级 pin 后，用下面的命令核对 OpCode 有无变化：

```bash
grep -nE "^\s+[A-Z_]+: [0-9]{4}," submodules/nuwax-im/nuwax-im-web/src/ws/protocol.ts
```

## 2. 本仓接线口径（PC Web）

| 项 | 口径 | 代码 |
| --- | --- | --- |
| 订阅时机 | 已登录，且消息微应用 `nuwax-im-web` 挂载完成后订阅一次。切换菜单、隐藏保活期间保持订阅 | `src/layouts/MicroAppHost/index.tsx` |
| 退订 | 登出、`AUTH_SESSION_CLEARED`、实例卸载或重建时退订，未读归零；旧订阅迟到的回调直接丢弃 | `src/services/imEventBridge.ts` |
| 自定义事件 | `eventBus.emit(eventType, payload)`，与 batch 共用同一批处理器 | 同上 |
| 消费标记 | IM 路径**不**调用 `apiClearEvent`；只有 batch 在处理完后调用 `GET /api/notify/event/clear` | `src/hooks/useEventPolling.ts` |
| 去重 | 不去重。同一事件两路可能各到一次，由处理器幂等兜底 | — |
| 未读角标 | 先读 `getSnapshot().unreadTotal` 作初值，再跟随 `onUnreadChange`。0 不显示，1–99 显示数字，超过 99 显示 `99+` | `src/components/business-component/ImMenuBadge` |
| 角标位置 | 经典布局 `DynamicTabs/TabItem`、单栏布局 `SidebarNavHeader`。只加在解析到 `nuwax-im-web` 的当前页菜单上；通知中心沿用原有未读口径 | `src/utils/imMenuPolicy.ts` |
| 按需初始化 | 用户没打开过消息菜单时不加载 IM，没有 IM 事件，也没有角标；业务事件仍由 batch 兜底 | — |
| 全局对象 | 消息应用加载模块时把 `window.__im` 装在真实 `window` 上（vite-plugin-qiankun 的 ESM 产物不运行在 JS 沙箱内），宿主直接读取即可 | `src/types/interfaces/im.ts`（消费端类型，所有键都可选） |

## 3. batch 与 IM 两路对照

|  | batch 轮询 | IM 自定义事件 |
| --- | --- | --- |
| 入口 | `GET /api/notify/event/collect/batch`，每 5 秒一次（已登录、宿主与页面均可见时） | `window.__im.onCustomEvent(cb)`，对应 WS `MSG_CUSTOM_EVENT`(3007) |
| 单条结构 | `data.eventList[]`：`{ type, event }` | `{ eventId, eventType, payload, ts }` |
| 分发 | `eventBus.emit(type, event)` | `eventBus.emit(eventType, payload)` |
| 消费标记 | 处理完调用 `GET /api/notify/event/clear` | 无（服务端不落库） |
| 送达 | 轮询拉取 | 尽力而为：P1 帧拥塞时直接丢弃，离线端收不到，重连后不补发 |
| 去重键 | 无 | 无（`eventId` 不是去重键，同一 `eventId` 推两次就到两次） |
| 载荷约束 | `event: object` | `payload` 不是对象时归一为 `null`；缺少 `eventId` 或 `eventType` 时整帧丢弃并告警 |

eventBus 上已有处理器的事件类型（本地派发的 `directory_*`、`close_mobile_menu` 未列入）：

| `type` / `eventType` | 处理器 | 读取的载荷字段 |
| --- | --- | --- |
| `new_notify_message` | `UserOperateArea`、`OpenApp/BaseTemplate`：重新拉取通知未读数 | 不读载荷 |
| `refresh_chat_message` | `pages/Chat/hooks/useChatConversation`、`EditAgent/PreviewAndDebug`：追加消息 | `conversationId`、`message`（Chat 兼容旧字段 `msg`） |
| `chat_finished` | `utils/conversationTaskStatusSync`、`hooks/useChatFinishedWhenListExecuting`、侧栏 `ProjectPanel`：拉取会话终态 | `conversationId` |
| `refresh_conversation_list` | 侧栏 `ProjectPanel`：静默刷新 | `conversationId`（缺省时忽略） |
| `update_conversation_list_task_status` | `utils/directorySyncEvents`：乐观更新会话状态 | `conversationId`、`taskStatus` |

载荷约束：

- **会话 ID 用字符串。** 多数处理器会用 `String()` 或 `Number()` 归一后再比较会话 ID，但 `subscribeChatFinishedTaskSync` 是严格比较字符串，所以 `conversationId` 应以字符串投递，IM 实例就是字符串。
- **`payload` 必须是对象。** `payload` 为 `null` 时，直接从中取值的处理器会抛错；eventBus 会隔离异常，只打印一条 `console.error`。

IM 实例示例：

```json
{
  "eventId": "plat-evt-1-fa358c88-6901-47aa-8b49-767ee6f84b03",
  "eventType": "chat_finished",
  "payload": {
    "status": "COMPLETE",
    "conversationId": "1694593",
    "requestId": "1baa8b26e86b475894f96597c321f698"
  },
  "ts": 1790683041908
}
```

## 4. `window.__im` 全键表（11 个）

| 键 | 签名 | 来源 |
| --- | --- | --- |
| `onCustomEvent` | `(cb: (e: CustomEventBody) => void) => () => void` | customEvents |
| `offCustomEvent` | `(cb) => void` | customEvents |
| `customEventSubscriberCount` | `() => number` | customEvents |
| `onMessage` | `(cb: (e: ImMessageEvent) => void) => () => void` | imBridge |
| `offMessage` | `(cb) => void` | imBridge |
| `onUnreadChange` | `(cb: (e: { total: number }) => void) => () => void` | imBridge |
| `offUnreadChange` | `(cb) => void` | imBridge |
| `onConnectionChange` | `(cb: (state: ConnState) => void) => () => void` | imBridge |
| `offConnectionChange` | `(cb) => void` | imBridge |
| `getSnapshot` | `() => { connState, connected, unreadTotal, userId }`（返回拷贝） | imBridge |
| `subscriberCounts` | `() => { message, unread, connection }` | imBridge |

订阅语义：

- 同一个函数重复订阅只生效一次；退订函数调用两次也安全。
- 订阅者抛出的异常会被隔离，不影响 IM，也不影响其他订阅者。
- 每个事件先打印 `[IM-BRIDGE]` / `[IM-CUSTOM-EVENT]` 日志，再执行回调。所以 console 里有日志、回调却没执行时，问题在订阅方。
- 接入顺序：先读快照，再订阅。桥不会补发订阅之前的事件。

### 4.1 `CustomEventBody`（`onCustomEvent`）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `eventId` | `string` | 调用方的 `bizMsgId` 原样透传，非空；不是去重键 |
| `eventType` | `string` | 调用方自定义（≤64 字符），按它分流 |
| `payload` | `object \| null` | 调用方自定义（序列化后 ≤16KB），不得假设任何键存在 |
| `ts` | `number \| null` | 服务端生成，同一次扇出的各端看到的值相同 |

### 4.2 `ImMessageEvent`（`onMessage`）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `convId` | `string` | 会话 ID（雪花 ID，字符串） |
| `convType` | `number \| null` | 1 单聊 / 2 群聊 / 4 团队；会话行尚未到达时为 `null` |
| `convName` | `string \| null` | 单聊恒为 `null`，显示发送方请用 `senderName` |
| `msgId` | `string` | 精确的字符串（比 HTTP 响应里的数字可靠） |
| `seq` | `number \| null` | 会话内序号 |
| `senderId` | `string \| null` | 发送者 ID |
| `senderType` | `number \| null` | 1 人 / 2 智能体 / 3 系统 |
| `senderName` | `string \| null` | 可能为空，需要兜底 |
| `senderAvatar` | `string \| null` | 头像 URL |
| `msgType` | `string \| null` | `text` / `image` / `file` / `video` / `audio` / `card` / `system` / `rich_text` / `merge_forward` … |
| `digest` | `string \| null` | 列表摘要（纯文本） |
| `sendTime` | `number \| null` | epoch 毫秒 |
| `selfSent` | `boolean` | 本人在其它设备或标签页发出的消息回声 |
| `mentionedMe` | `boolean` | @我（含 @所有人） |

### 4.3 未读、快照与连接状态

- `onUnreadChange({ total })`：
  - `total` 是服务端 `/unread-total` 口径的全局总数。
  - 只在数值变化时触发，可能跳过中间值。
  - 本人发出的消息不计入未读。
- `getSnapshot()`：`{ connState, connected, unreadTotal, userId }`。
  - `connState` 为 `idle` 且 `userId` 为 `null`，说明 store 接线没有生效。
  - 本仓卸载消息实例时会把快照重置为这个初始值。

| `ConnState` | 含义 | 宿主处置 |
| --- | --- | --- |
| `idle` | 尚未开始连接 | — |
| `connecting` | 建连中 | 可显示"连接中" |
| `connected` | 已连通 | 判断在线只用这个状态 |
| `reconnecting` | 断线重连中 | 短暂抖动会自动恢复，不必急于提示离线 |
| `closed` | 已关闭（包括被踢且不重连） | 离线 |
| `rejected` | 鉴权被拒，不再重连 | 引导用户重新登录 |

## 5. WS 协议对照

### 5.1 常量与连接规则

| 项 | 值 |
| --- | --- |
| 地址 | `wss://{同域}/instant-message/ws`（dev 由 `config/config.development.ts` 代理） |
| 子协议 | `im-v1` |
| 协议版本 `v` | `1`；不符时返回 `IM_10001` 并断开连接 |
| 帧 | 仅 UTF-8 文本 JSON，单帧 ≤256KB（262144 字节） |
| 首帧 | 必须在 10 秒内发出 `CONNECT`（从 TCP accept 起算） |
| 心跳 | `PING` 间隔取 `CONNECT_ACK.heartbeatInterval`，单位是**秒**，默认 30，客户端限制在 5–300 之间；服务端读空闲 90 秒后断开 |
| 重连退避 | 从 1s 起倍增，30s 封顶；收到 `CONNECT_ACK` 后重置 |
| deviceId | 格式 `{baseId}#{tabId}`：<br>• baseId 持久化，Web 存于 localStorage `im.device.baseId`；tabId 每个标签页一个，存于 sessionStorage `im.device.tabId`<br>• 长度 1–128，字符集 `[a-zA-Z0-9-_.]`，`#` 最多 1 个<br>• 同一 baseId 最多 5 个连接，超出返回 `IM_10429` |
| 鉴权 | 凭据取用优先级：`CONNECT.body.token` > `Authorization` 头 > Cookie > query。<br>Web 的 platform 模式依靠同域 Cookie `ticket`，不带 token。<br>Cookie 凭据会校验 Origin 白名单，显式 token 跳过校验 |

### 5.2 帧结构 `ImPacket`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `v` | `number` | 固定为 1 |
| `op` | `number` | 见 5.3 |
| `reqId` | `string` | 上行时由客户端生成，`ERROR` / ACK 原样带回 |
| `seq` | `number` | 会话内序号 |
| `ts` | `number` | 毫秒；服务端不信任上行的值 |
| `code` | `string` | 仅 `ERROR` / `CONNECT_REJECT` 携带 |
| `body` | `object` | 载荷；值为 null 的键整个缺席（`unreadCount` 键缺失 ≠ 0） |

### 5.3 OpCode 全表

↑ 上行，↓ 下行。"桥"列表示该帧能否经 `window.__im` 拿到。

| op | 名称 | 方向 | 优先级 | body 要点 | 处置要点 | 桥 |
| --- | --- | --- | --- | --- | --- | --- |
| 1000 | `CONNECT` | ↑ | — | `deviceId`、`token`、`platform:'web'`、`lastAckSeq?` | 首帧，10 秒内发出 | — |
| 1001 | `CONNECT_ACK` | ↓ | — | `serverTime`、`heartbeatInterval`（秒）、`revalidateInterval`（秒）、`userId`、`tenantId`、`deviceId`、`lastAckSeq?`、`convDigests[]` | 启动心跳、重置退避；如果是重连，接着 `/sync` 补齐 | 间接：`connected` |
| 1002 | `CONNECT_REJECT` | ↓ | — | `code`、`message` | 不重连 | 间接：`rejected` |
| 1003 / 1004 | `AUTH_REFRESH` / `AUTH_REFRESH_ACK` | ↑ / ↓ | — | 新 token | IM Web 未使用 | — |
| 2000 / 2001 | `PING` / `PONG` | ↑ / ↓ | — | — | 心跳 | — |
| 3000 / 3001 | `MSG_SEND` / `MSG_SEND_ACK` | ↑ / ↓ | — | — | 一期发消息走 HTTP `POST /api/instant-message/messages`，WS 通道保留 | — |
| 3002 | `MSG_RECV` | ↓ | P1 | `MessageDto` + `convDigest{convId,lastMsgSeq,unreadCount?,lastMsgDigest,lastMsgAt}` | 落盘后回 3003；不推给来源 deviceId，发送方要自己插入本地 | `onMessage` |
| 3003 | `MSG_RECV_ACK` | ↑ | — | `convId`、`ackSeq` | 落盘后再发；不回的话，重连时这批消息会重复推送；HTTP 等价接口 `…/ack` | — |
| 3004 | `MSG_REVOKE` | ↓ | P0 | `convId/msgId/seq/revokeBy/revokeTime/msgStatus/senderId` | 按 `msgId` 就地更新 | 否 |
| 3005 | `MSG_EDIT` | ↓ | P0 | 完整 `MessageDto` | 按 `msgId` 就地更新 | 否 |
| 3006 | `MSG_AGENT_STATUS` | ↓ | P1 | `AgentMsgStatusDto` | 只投给消息发送者；单调应用（新值 ≥ 本地值才生效） | 否 |
| 3007 | `MSG_CUSTOM_EVENT` | ↓ | P1 | `eventId/eventType/payload/ts` | 纯下行，业务服务端经 `POST /internal/im/rpc/events/push` 投递；不落库、不补发 | `onCustomEvent` |
| 3008 | `MSG_REACTION` | ↓ | P1 | `convId/msgId/reactions[]`（全量快照） | 整体替换；来源端也会收到 | 否 |
| 4000 | `READ_REPORT` | ↑ | — | `convId`、`readSeq` | 上报已读水位；HTTP 等价接口 `…/read`；限流 5 次/秒 | — |
| 4001 | `READ_NOTIFY` | ↓ | P1 | `convId/userId/readSeq` | 他人的已读回执 | 否 |
| 4002 | `READ_NOTIFY_AGG` | ↓ | P1 | `convId/counts[{msgId,readCount}]` | 优先处理聚合版 | 否 |
| 5000 / 5001 | `SYNC_REQ` / `SYNC_RESP` | ↑ / ↓ | — | 与 HTTP `POST /api/instant-message/sync` 同形 | `hasMore=true` 时必须循环拉到底；`/sync` 不推进 ack | 否（补齐的消息不经过桥） |
| 6000 | `CONV_UPDATE` | ↓ | P1 | `ConversationSummaryDto` 投影 + `reason` | 按 `convId` 合并，不要整表替换 | 否 |
| 6001 | `CONV_UNREAD` | ↓ | P2 | `convId/unreadCount=0/readSeq/lastMsgSeq` | 仅当 `readSeq ≥ 本地值` 时应用 | 间接：重拉总数后触发 `onUnreadChange` |
| 8000 | `CONTACT_UPDATE` | ↓ | P1 | `action/peerUserId/actorUserId` | 这一帧表示本地通讯录副本已过期，收到后重拉；`actorUserId == 我` 表示是自己操作的回声 | 否 |
| 9000 | `KICK` | ↓ | — | `reason`、`message?` | 只有 `server_restart` 才重连 | 间接：`closed` / `reconnecting` |
| 9001 | `ERROR` | ↓ | — | `message`，`reqId` 原样带回 | 表示某个上行帧处理失败 | 否 |

`ImSocket` 分发 17 种下行帧，其中只有 3002、3007 直接暴露。其余的需要时由 IM 侧在 `imBridge.ts` 新增键（增量改动，不影响现有契约）。

### 5.4 枚举值

- `KICK.reason`：
  - `auth_expired`：不重连，回登录页
  - `server_restart`：自动重连
  - `too_many_devices`：不重连，提示打开的窗口过多
- `CONTACT_UPDATE.action`：`APPLY`、`ACCEPTED`、`REJECTED`、`REMOVED`。四种都是"去重拉"的信号，只有前两种会提醒用户。
- `CONV_UPDATE.reason`：
  - `PROFILE`：就地合并
  - `DISBANDED`：从列表移除
  - `LAST_MSG_REVOKED` / `LAST_MSG_EDITED`：就地合并
  - `PIN_CHANGED`：合并后重拉 Pin 列表
  - `MUTE_CHANGED`：合并后重拉成员列表
  - 未知的 reason 按 `PROFILE` 处理

### 5.5 错误码

| 码 | 含义 | 处置 |
| --- | --- | --- |
| `IM_10001` | 协议版本不符或非文本帧 | 服务端关闭连接；检查 `v` 与帧类型 |
| `IM_10002` | 单帧超过 256KB | 拆开发送 |
| `IM_10003` | 首帧超时 | 建连后立即发送 `CONNECT` |
| `IM_10401` | token 无效，或首帧不是 `CONNECT` | 不重连，走登录流程 |
| `IM_10402` | 平台要求跳转 | 跳转到 `message` 给出的地址 |
| `IM_10403` | 账号被停用 | 不重连 |
| `IM_10429` | 同一 baseId 连接数超过 5 | 改为全局单例 socket |
| `IM_10503` | 平台鉴权服务不可用 | 可重试，不要跳登录页 |
| `IM_20105` | 会话已解散 | 从列表移除 |
| `IM_90001` | 参数非法（含 deviceId 格式） | 按 5.1 检查 deviceId |
| `IM_90002` | 服务端过载 | 按 `Retry-After` 重试 |
| `IM_90003` | Origin 不在白名单 | 改用显式 token |

## 6. 客户端独立接入要点

- **复用 IM 界面（路 A）**：本仓 PC Web 与 nuwaclaw webview 就是这种形态。消息应用挂载后，按第 2 节订阅 `window.__im`。
- **自己连接 WS（路 B，原生客户端，或不加载 IM 界面的场景）**：完整协议见 docs/09。要与本仓事件口径对齐，至少需要：
  1. **建连**：持久化 deviceId → `new WebSocket(url, 'im-v1')` → 10 秒内发出 `CONNECT` → 等待 `CONNECT_ACK` → 按 `heartbeatInterval` 秒发送 `PING`。
  2. **业务事件**：收到 3007 后按 `eventType` 分发 `payload`；它们与 batch 的 `type` / `event` 一一对应（见第 3 节）。不调用 clear，不去重，保留 batch 轮询作为可靠通道。
  3. **未读总数**：
     - 启动、切回前台时拉取 `GET /api/instant-message/unread-total`，使用 `data.total`。
     - 重拉时机与 IM Web 一致：收到 3002（本人发出的、或当前正在查看的会话除外）或 6001 后重新拉取。
     - 角标口径与第 2 节一致。
  4. **断线**：
     - 鉴权类情况不重连：1002、`IM_10401` / `IM_10403`、`KICK` 的 `auth_expired` / `too_many_devices`。
     - 其余情况按 1s→30s 退避重连；重连成功后调用 `/sync`，循环直到 `hasMore=false`。
  5. **数据格式**：
     - ID 一律按字符串解析（json-bigint `storeAsString`，并归一已知的 ID 字段）。
     - 时间戳均为毫秒，只有 `heartbeatInterval` 的单位是秒。

## 7. 已知限制

- 两路都不是权威数据：
  - 自定义事件与 `onMessage` 都是 P1 帧，断线期间会丢失，且不补发。
  - `onUnreadChange` 可能跳过中间值。
  - 关键数据以 HTTP 重拉结果为准。
- 按需初始化：用户打开消息菜单之前不会订阅 IM，角标不显示。
- 上游说明中，`onUnreadChange` 尚未在真实环境端到端触发过（需要另一个账号制造未读）。本仓用单测覆盖订阅、归零和 99/100 边界。
- 分会话未读、撤回、编辑、表情回应、会话变更等帧都没有经桥暴露，宿主暂时拿不到。
