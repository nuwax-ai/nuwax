export enum EventTypeEnum {
  // 有新的通知消息
  NewNotifyMessage = 'new_notify_message',
  // 会话消息列表需要刷新
  RefreshChatMessage = 'refresh_chat_message',
  // 文件列表需要刷新
  RefreshFileList = 'refresh_file_list',
  // (todo: 后续需要更新)会话状态需要刷新
  RefreshConversationStatus = 'refresh_conversation_status',
}
