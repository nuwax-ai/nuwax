import { mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

// 会话保护网按业务目录收集，同时覆盖 tests/ 合同与源码旁的回归用例。
export default mergeConfig(baseConfig, {
  test: {
    include: [
      'tests/{conversation,chatConversation,unifiedChatSession}/**/*.{test,spec}.{ts,tsx}',
      'tests/{conversation,chatConversation,createConversation,liveConnection,resume,snapshot,terminal,runtimeLine,messageQueue,queueStorage,unifiedChatSession,useConversation,useExecutingTaskStatusPoll,useChatFinishedWhenListExecuting,interventionDock}*.{test,spec}.{ts,tsx}',
      'src/features/conversation/**/*.{test,spec}.{ts,tsx}',
      'src/components/business-component/{UnifiedChatSession,ChatInputUnified,MessageQueue,AgentIntervention}/**/*.{test,spec}.{ts,tsx}',
      'src/components/ChatInputHome/**/*.{test,spec}.{ts,tsx}',
      'src/pages/{Chat,ConversationAgent}/**/*.{test,spec}.{ts,tsx}',
      'src/pages/EditAgent/PreviewAndDebug/**/*.{test,spec}.{ts,tsx}',
      'src/pages/SpacePluginTool/components/PluginChatSession/**/*.{test,spec}.{ts,tsx}',
      'src/models/conversation*.{test,spec}.{ts,tsx}',
      'src/utils/conversation*.{test,spec}.{ts,tsx}',
      'src/hooks/{useConversation,useInitialConversationAutoSend}*.{test,spec}.{ts,tsx}',
    ],
  },
});
