# 独立会话渲染归属

缓存宿主 ClientConversationKeepAlive 仅解析 /home/chat/:id/:agentId（以及另外两种工作区），OpenApp/BaseTemplate 没有此宿主。ChatPage 只在路径恰为有效 /home/chat 时注册缓存渲染器并让出 Outlet；独立 /app/chat 即使 style3 PC 开启仍直接渲染 ChatCore。隐藏 chrome 参数、窄宽屏切换均不改变归属。验证宽屏 /app/chat 带/不带隐藏参数及 /home/chat 正常常驻。
