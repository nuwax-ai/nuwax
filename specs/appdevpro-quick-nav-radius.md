# 规格：全栈应用详情快捷导航与面板圆角

- 对应 intent：plans/20260928-appdevpro-quick-nav-radius-intent.md
- 状态：方案已收敛，按用户授权修复

## 方案设计

ConversationQuickNav 接受可选 minContainerWidth，默认 600；UnifiedChatSession 通过 quickNavMinContainerWidth 透传。AppDevPro 的 AgentConversationChatPanel 设置 400。页面会话主体增加 20px 左留白，供导航左移 10px 后仍落在页面内容区内。最低分栏 430px 扣除右侧 8px 间距及左侧 20px 留白，消息区约 402px。

2026-09-28 跟进：用户明确要求在 `/space/752/app-pro/147/1694189` 出现会话快捷导航。实页确认只有一轮，但消息区 684px 高、内容 1034px 高，原有四轮门槛仍隐藏导航。因此新增 displayMode（auto / scrollable），由 UnifiedChatSession 的 quickNavDisplayMode 透传；AppDevPro 使用 scrollable，至少一轮且消息区实际可滚动时显示。

AppDevPro 的 content-container 使用 16px 圆角，与 Chat 文件树和终端工具面板一致；沿用 overflow:hidden，让内部预览和终端在外框圆角内裁剪。现有全屏 0px 圆角覆盖继续生效。

## 数据与契约

只增加可选布局属性；消息、轮次构建、滚动锚点、悬停动画及接口不变。普通会话保持默认 600px 门槛、至少四轮及内容高度至少 1.5 倍视口的原有条件。AppDevPro 的 scrollable 模式仅要求非空轮次、正高度容器及 scrollHeight > clientHeight。

## 异常与失败场景

消息区窄于配置门槛、没有可读轮次、内容不足以滚动时隐藏导航。auto 模式继续要求至少四轮。配置变化、分栏拖拽时重新测量。

## 测试计划

现有快捷导航测试覆盖工作台约 402px 显示、399px 隐藏及配置切换；补充单轮可滚动会话显示、点击和无滚动/空列表隐藏。直接在用户提供的实页验证导航出现、悬停预览及点击定位。运行 test:conversation。
