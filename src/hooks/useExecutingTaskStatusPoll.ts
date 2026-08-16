// 兼容旧导入路径；实际领域规则已迁入 Conversation Domain Kernel。
export {
  hasActiveStreamingInMessages,
  hasExecutingProcessingInRecentMessages,
  isSessionStreamBusy,
} from '@/features/conversation/domain/runtimeSelectors';
