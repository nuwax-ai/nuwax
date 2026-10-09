import type {
  ConversationEffect,
  ConversationEffectsAdapter,
  PagePreviewPayload,
} from '@/features/conversation/runtime/effectDispatcher';
import type { ConversationChatSuggestParams } from '@/types/interfaces/conversationInfo';
import { emitConversationListTaskStatus } from '@/utils/conversationTaskStatusSync';

export interface PreviewEffectsAdapterDeps {
  /** 拉取问题建议（model 的 useRequest 句柄，经 ref 转发保持最新闭包）。 */
  fetchSuggest: (params: ConversationChatSuggestParams) => void;
  /** 显示扩展页面预览（useModel 'chat' 句柄，经 ref 转发保持最新闭包）。 */
  showPagePreview: (preview: PagePreviewPayload) => void;
}

/**
 * ConversationAgent 隔离入口的 Effects Adapter：只执行隔离允许的子集。
 *
 * 与主 Chat 的差异（保持既有行为，不是裁剪遗漏）：
 * - 不做发送时的乐观「执行中」标记（隔离面板不驱动侧栏新会话入列表）；
 * - 不做流结束后的列表刷新（由主 Chat 实例负责）；
 * - 不做会话主题更新（隔离面板不驱动主题与历史列表刷新）；
 * - 不处理卡片与远程桌面（隔离 model 无展示台/桌面状态）。
 * 因此消费无 context 的终态补丁、suggest.fetch 与页面/链接预览，其余 effect 静默忽略。
 */
export function createPreviewEffectsAdapter(
  deps: PreviewEffectsAdapterDeps,
): ConversationEffectsAdapter {
  return {
    dispatch(effect: ConversationEffect) {
      if (effect.type === 'suggest.fetch') {
        deps.fetchSuggest(effect.params);
        return;
      }
      if (effect.type === 'preview.page.open') {
        deps.showPagePreview(effect.preview);
        return;
      }
      if (effect.type === 'preview.link.open') {
        window.open(effect.url, '_blank');
        return;
      }
      if (effect.type !== 'recent.status.patch' || effect.context) {
        return;
      }
      emitConversationListTaskStatus(effect.conversationId, effect.status);
    },
  };
}
