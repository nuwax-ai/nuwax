# 实施计划：首页附件切换后丢失修复

- 范围：PC 首页已完成上传但尚未发送的附件，在离开首页再返回时恢复。
- 依据：用户提供的复现截图；首页已有 `draftKey="home"`，现有草稿仅保存文本。
- 状态：已完成（本地修复和验收完成，尚未提交或部署）。

## 改动文件清单

| 文件 | 说明 |
| --- | --- |
| `src/features/conversation/domain/conversationPageCache.ts` | 扩展草稿的可序列化附件元数据 |
| `src/features/conversation/runtime/conversationPageCacheManager.ts` | 支持纯附件草稿，读写过滤非法附件及非必要字段 |
| `src/components/business-component/ChatInputUnified/index.tsx` | 保存、恢复附件，切作用域隔离，删除和发送清理 |
| `src/components/business-component/ChatInputUnified/draftStorage.ts` | 同步草稿存储说明 |
| `src/components/business-component/ChatInputUnified/draftStorage.test.ts` | 纯附件、兼容旧草稿、非法数据及序列化回归 |
| `tests/chatConversation/chatInputUnified.home.test.tsx` | 上传后快速离开、恢复发送、删除及作用域隔离回归 |
| `tests/chatConversation/chatInputUnified.plusMenuUpload.test.tsx` | 上传鉴权转发回归 |

## 实施顺序

1. 添加能复现附件丢失的回归用例，并确认旧实现失败。
2. 沿用现有草稿作用域和 24 小时过期策略，只保存已上传完成附件的服务端元数据。
3. 在输入框恢复附件；离开时立即保存，删除立即同步，发送仍清除已消费草稿。
4. 执行定向测试、完整会话合同网和分层依赖检查，以 ego-browser 验证真实页面切换。

## 风险与回退

- 不序列化本地 File、上传响应或进行中的上传，不恢复无法继续的上传进度。
- 保持旧版纯文本草稿兼容，附件沿用服务端返回的 URL 和 key，不重新上传。
- 验证首页与各会话草稿互不污染；回退时撤销本次变更即可。

## 验证结果

- 旧实现：新增附件回归触发 8 个失败，确认复现丢失、无法恢复发送及非法附件未过滤。
- 定向检查：输入框首页、草稿存储、上传调用和统一鉴权共 53 条测试通过；页面缓存 manager 用例由完整合同网覆盖。
- `npm run test:conversation`：105 个测试文件、997 条测试全部通过。
- `npm run lint:arch`：通过，97 条既有豁免，无新增违规。
- `ego-browser`：在 `http://localhost:3000/home` 使用现有登录态，真实上传文本附件成功；切到「消息」再回「主页」后纯附件仍显示，刷新后恢复；删除附件立即切走再返回不复活。截图：`/tmp/nuwax-home-attachment-restored.png`。验收空间已关闭。
- `tsc --noEmit`：全库仍有既有错误；本次涉及源码的报告仅命中原有提示问题填充调用和菜单 items 类型推断，已与 HEAD 原代码核对；新增草稿附件类型及持久化代码无类型报错。
- 工作区有同时进行的账号设置修改和另一份计划，均未纳入本次修复。

## 偏离记录

- 浏览器验收发现：Umi 本地开发使用 Token，但输入框上传仅携带 Cookie，真实上传失败。沿用已有 `getBusinessRequestAuth` 统一函数补齐上传调用的环境适配，避免另建鉴权逻辑；新增调用转发回归并运行已有鉴权合同测试。
