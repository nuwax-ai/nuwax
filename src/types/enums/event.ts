export enum EventTypeEnum {
  // 有新的通知消息
  NewNotifyMessage = 'new_notify_message',
  // 会话消息列表需要刷新
  RefreshChatMessage = 'refresh_chat_message',
  // 会话结束后，更新会话状态
  ChatFinished = 'chat_finished',
  // 左侧会话列表需要静默刷新
  RefreshConversationList = 'refresh_conversation_list',
  // 左侧会话列表需要乐观更新会话状态
  UpdateConversationListTaskStatus = 'update_conversation_list_task_status',
  // 项目/会话目录元数据发生变化
  ConversationChanged = 'directory_conversation_changed',
  ProjectChanged = 'directory_project_changed',
  // 移动端菜单关闭请求（会话行点击）：经事件总线下发，消费方 SidebarShell 调
  // layout model 的 handleCloseMobileMenu——避免列表数据层直接订阅 layout
  // 被全量广播卷入重渲染（2026-09 侧栏收展卡顿）
  CloseMobileMenu = 'close_mobile_menu',
}
