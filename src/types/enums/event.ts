export enum EventTypeEnum {
  // 有新的通知消息
  NewNotifyMessage = 'new_notify_message',
  // 会话消息列表需要刷新
  RefreshChatMessage = 'refresh_chat_message',
  // 文件列表需要刷新
  RefreshFileList = 'refresh_file_list',
  // 会话结束后，更新会话状态
  ChatFinished = 'chat_finished',
}
