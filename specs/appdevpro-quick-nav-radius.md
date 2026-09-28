# 规格：全栈应用详情快捷导航与面板圆角

- 对应 intent：plans/20260928-appdevpro-quick-nav-radius-intent.md
- 状态：方案已收敛，按用户授权修复

## 方案设计

ConversationQuickNav 默认 auto 模式在导航项至少两个（至少两轮；一问一答算一项）时显示，不再限制消息区宽度及滚动高度。显示前仍要求容器正宽高，避免隐藏缓存页留下导航。

用户明确要求在 `/space/752/app-pro/147/1694189` 出现会话快捷导航。实页确认只有一轮，但消息区 684px 高、内容 1034px 高，因此新增 displayMode（auto / scrollable），由 UnifiedChatSession 的 quickNavDisplayMode 透传；AppDevPro 使用 scrollable，少于两项时，至少一轮且消息区实际可滚动也显示。

页面会话主体增加 20px 左留白，供导航左移 10px 后仍落在页面内容区内。最低分栏 430px 扣除右侧 8px 间距及左侧 20px 留白，消息区约 402px。

AppDevPro 的 content-container 使用 16px 圆角，与 Chat 文件树和终端工具面板一致；沿用 overflow:hidden，让内部预览和终端在外框圆角内裁剪。现有全屏 0px 圆角覆盖继续生效。

## 数据与契约

只增加可选显示模式属性；消息、轮次构建、滚动锚点、悬停动画及接口不变。公共规则为至少两项且容器正宽高。AppDevPro 的 scrollable 模式额外支持非空轮次及 scrollHeight > clientHeight。

## 异常与失败场景

没有可读轮次、隐藏页容器宽高为零时隐藏。auto 模式少于两项时隐藏。scrollable 模式少于两项且没有滚动空间时隐藏。显示模式变化及分栏拖拽时重新测量。

## 测试计划

现有快捷导航测试覆盖一项隐藏、两项显示、两项在窄宽和无滚动时仍显示；补充单轮可滚动会话显示、点击和空列表/零尺寸隐藏，以及仅改变模式时重新测量。直接在用户提供的实页验证导航出现、悬停预览及点击定位。运行 test:conversation。
