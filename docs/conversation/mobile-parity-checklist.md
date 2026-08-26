# 会话优化 PC ↔ Mobile 拉齐清单

> 日期:2026-08-26 · PC 基线:`nuwax@origin/feat/conversation-ux-m1`(a63b77c2a,含 auto-collapse 系列与 M1 五件套) · Mobile:`nuwax-mobile`(uni-app x,Vue3+UTS,App/H5/小程序三端) · 调研依据:mobile 全量探查(渲染链路/列表/输入/预览/分享,2026-08-26)
>
> 结论速览:mobile 文件预览走 PC 仓 `/static/file-preview.html`(**PC 静态页代码块增强 mobile 自动受益,仅需验收**);工具组折叠/Plan 卡/thinking 折叠已有可对齐复用;**终端输出、工具耗时、终态聚合、消息级搜索、输入草稿、会话置顶/归档/收藏**为 mobile 缺口。

## 0. 双端结构对照(拉齐时的落点速查)

| 能力域 | PC(nuwax,React) | Mobile(nuwax-mobile,uni-app x) |
| --- | --- | --- |
| 会话页 | `UnifiedChatSession → ChatView → MarkdownRenderer(ds-markdown)` | `subpackages/pages/chat-conversation-component/`(4116 行,分层 `layers/`),assistant 消息 `components/ai-msg` |
| markdown 渲染 | ds-markdown(react-markdown 体系,单链路) | **双链路**:App 原生 `uni-ai-x`(uni-cmark+fallback,`aiMsgMarkdownParser.uts`)/ H5·小程序 mp-html + markdown-it(`uni_modules/mp-html/`) |
| 过程标签协议 | `<markdown-custom-process(-group)/-think>`(utils 分组) | 同形协议,自研解析 `utils/markdownCustomProcess.uts` + `utils/openUiMarkdown.uts` |
| 文件预览 | React `FilePreview` + 静态页 `/static/file-preview.html` | **不自渲染**,跳 PC 仓 file-preview-page(App web-view / H5 iframe) |
| 会话列表 | 主侧栏 NewHomeSection + 历史页 | 首页会话记录 Tab(`pages/index/home-content/`)+ 会话页内历史弹窗 |
| 会话项操作 | 右键菜单 + hover「⋯」 | **长按 ActionSheet**(已有重命名/删除) |

## 1. 逐项拉齐清单

### A. md 预览代码块增强(PC 已交付)

**PC**:语言标签+复制+下载+Prism 高亮;分享静态页修复 marked v11 highlight 静默失效+复制按钮。

| 子项 | mobile 现状 | 动作 |
| --- | --- | --- |
| 文件预览页代码块 | 跳 PC 仓 file-preview.html,共享同一实现 | ✅ **自动继承,仅验收**:用「多类型渲染验收 md」在 App/H5/小程序 webview 各过一遍(注意小程序 webview 缓存,版本参数已 bump) |
| **会话内消息代码块** | App 链 uni-cmark 代码块无复制;H5 链 mp-html 无复制 | ⚠️ 缺口:ai-msg 渲染层给代码块加复制(移动端形态:代码块右上角「复制」文字按钮,长按全选也可);双链路各一处 |
| markdown 基础能力 | 任务列表 checkbox❌、嵌套列表 ⚠️、App 行内公式降级 LaTeX 原文 ⚠️ | 引用 mobile 已有官方清单 `docs/integration/markdown-capability-checklist.md`,按其推进(与本拉齐无耦合) |

### B. 终态统一「执行过程」折叠(PC 已交付:collapseTerminalProcesses)

**PC**:任务终态除最后一段正文外,中间正文/思考/工具组聚合为单个「执行过程」折叠区;流式中维持逐组折叠。

**Mobile 现状**:工具组折叠+auto-expand 已有(`tool-call-group.uvue` + `shouldAutoExpandToolGroup`);**无终态聚合**(终态仍是各组分别折叠+中间正文平铺)。

拉齐方案:

- 分组逻辑在 mobile 两侧各自实现:App 链 `aiMsgMarkdownParser.uts`/fallback、H5 链 `mp-html/container/container-group.vue`;
- 规则照抄 PC `nuwax/src/components/MarkdownRenderer/utils.ts` 的 `collapseTerminalProcesses`:终态时摊平已有 group、中间正文进组、保留最后一段正文在外;尾部无正文保留最后一个过程块;
- 聚合组标题「执行过程」(i18n mobile 已有中文文案体系,补 key);组件复用 `tool-call-group.uvue`(加 terminal 态标题);中间正文片段在移动端按纯文本段落渲染(App 原生无嵌套 markdown,降级可接受)或 mp-html 子渲染;
- 触发时机对齐 PC:消息 status 离开 EXECUTING/Loading。

### C. 工具耗时徽标(PC 渲染 P0 已交付)

**Mobile 现状**:❌ 不展示。**`startTime/endTime` 已透传到卡组件**(`uni-ai-x-msg.uvue:257-258,336-337`),只差展示。

拉齐:`tool-call-card.uvue` 状态图标旁加 `x.x s`(<1s 显示 ms),数据 `endTime - startTime`,EXECUTING 不显示。**成本最低,建议首批**。

### D. 终端输出渲染(PC 渲染 P0 已交付)

**Mobile 现状**:❌ 完全没有(工具卡只有名称+状态,详情为原始 JSON;`pages/terminal/*` 是桌搭硬件终端,无关)。

拉齐:

- App 链:`tool-call-card.uvue` 加 terminal 分支(命令行摘要+退出码徽标+展开等宽输出,参考 PC `MarkdownCustomProcess` 的尾部 6 行预览/全量 500 行截断);数据协议同 PC:`result.data[].{type:'terminal',command,content,exitCode}`(normalize 兼容 output 别名);
- H5 链:mp-html container 或 tool-call 卡同款(组件是共用的 uni 组件,大概率一处改动双端生效——`tool-call-card` 是 .uvue 组件,H5 也走它,只有 markdown 正文渲染才分链路;确认后可能只需一处);
- 后端确认项与 PC 相同:Bash 类工具 `result.data` 实际形状。

### E. 输入框草稿缓存(PC 已交付:draftStorage)

**Mobile 现状**:❌ 按会话草稿不存在(`messageInfo` 随页面销毁);已有 `utils/pendingChatDraft.uts`(TTL 10min、一次性消费,仅 OpenUI 续作场景)。

拉齐:

- 复用 pendingChatDraft 的形态扩展为通用草稿:`chat_draft:{cid}`(storage key 与 PC 约定同名为宜,虽不跨端同步,至少语义一致)、TTL 24h、恢复/节流写回/发送清除;
- 落点:`chat-input-phone.uvue`(输入态)+ `chat-conversation-component` 切会话生命周期;
- 注意 uni-app x 的 storage API(uni.setStorageSync)与 PC localStorage 行为差异:无痕/配额降级同样要 try/catch。

### F. 会话内搜索(PC 已交付:ConversationSearchPanel)

**Mobile 现状**:❌ 消息级搜索不存在;已有「会话标题搜索」页 `subpackages/pages/conversation-search/`(topic 过滤+分页)。

拉齐:

- 扩展 conversation-search 页加 Tab「消息」:同 PC 策略(apiAgentConversationMessageList 按 index 游标翻页拉全量,上限 50 页)+ 本地 keyword 过滤(text+think);
- 定位交互适配移动端:点击结果跳会话页并滚动到消息(需会话页支持按消息 id 定位加载——mobile 历史是 scrolltoupper 分页,定位前若未加载需先翻页加载到目标,成本高于 PC;**首版可只展示结果片段不做跳转定位**,或限制「仅当前已加载会话」可定位);
- 结果片段命中词高亮、role 标签照 PC。

### G. 会话列表操作:置顶/归档/收藏(PC 已交付:本地 flags 过渡 + 菜单)

**Mobile 现状**:长按 ActionSheet 已有「重命名/删除」;置顶/归档/收藏 ❌(后端接口与 PC 一样不存在)。

拉齐:

- ActionSheet 加「置顶/取消置顶、归档、收藏」三项,本地 flags 过渡方案照抄 PC(`conversationLocalFlags`:pinned/archived/collected id 集合 + 变更通知);
- 列表行为:首页会话记录 Tab 置顶项排前+图标、归档项默认隐藏+「已归档」入口(移动端形态:列表顶部筛选 chip 或头部入口);
- ⚠️ **过渡方案限制要向产品说明**:本地 flags 在 App storage/H5 localStorage/PC 三处互不同步(同一用户手机 App 置顶、PC 看不到),仅作后端就绪前的体验占位;**mobile 侧建议优先催 M2 契约,后端就绪直接接服务端字段,跳过本地过渡**(与 PC 不同,PC 已先行)。
- 「再发消息自动取消归档」同 PC 归 M2(建议后端处理)。

### H. M2 后端契约(双端同步接线,清单见 PC 侧记忆/计划)

| 契约 | PC | Mobile |
| --- | --- | --- |
| 置顶/归档/收藏字段 + list 排序过滤 | 等接线(菜单/UI 骨架已就绪) | 等接线(ActionSheet 加项成本低) |
| 删除消息(deleteMessage + 快照不复活) | 等接线 | 等接线(长按消息 ActionSheet 加删除) |
| 消息分享(type=MESSAGE)/会话分享落地页 | 等接线 | mobile 分享现拼 PC 路由,落地页就绪后双端共用 |
| file-list 按 path/depth 懒加载 + 隐藏文件 | 等接线(整树内嵌 contents 是现状) | **mobile 同受整树返回影响且性能更敏感**(file-tree.uvue 递归渲染),懒加载就绪后 mobile 收益更大,优先接 |
| 本地目录选择(我的电脑) | 产品语义待对齐 | 同步跟进 |

### I. 思考块形态(差异项,暂不拉齐)

PC:思考按流式位置内联(消息体内 `<markdown-custom-think>`);Mobile:独立 thinkText 通道、默认折叠、点标题展开。**移动端独立折叠形态在窄屏更合理,暂不对齐内联**,仅拉齐行为语义:流式中可见增量、终态默认收起(两者现状已一致)。

## 2. 建议实施批次(mobile 侧)

| 批次 | 内容 | 理由 |
| --- | --- | --- |
| M-m1(低成本高感知) | C 工具耗时(字段已透传)、G ActionSheet 三项+列表置顶/归档(或直接等 M2)、E 输入草稿 | 纯 mobile 前端、无协议依赖 |
| M-m2(渲染对齐) | B 终态聚合、D 终端输出、A 会话内代码块复制 | 依赖双链路(App/H5)各一处,量中 |
| M-m3(功能补齐) | F 消息级搜索(先片段展示版) | 定位加载成本高,先降级版 |
| 跟随 M2 | H 全部契约接线(懒加载优先) | 双端同步 |

## 3. 验收物料

- 多类型渲染验收 md(生成提示词见 PC 侧会话记录;含多语言/无语言/长行代码块、公式、表格、锚点)——**双端共用**:PC FilePreview、分享链(file-preview.html,即 mobile 预览链路)、mobile 会话内消息(ai-msg 链路)各验一遍。
- 终态折叠:PC `/mock-chat` 场景 `TERMINAL_COLLAPSE` 可视化对照;mobile 用同场景在真实会话回放(或 mockStreamPerf 基建扩展)。
