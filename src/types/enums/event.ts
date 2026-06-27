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
}
