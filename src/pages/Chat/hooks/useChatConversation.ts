import type { AgentMode } from '@/components/business-component/AgentIntervention';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import { CLOUD_SANDBOX_ID } from '@/constants/workspaceDirPolicy.constants';
import { apiAgentConversationCreate } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import type { AgentSelectedComponentInfo } from '@/types/interfaces/agent';
import type { UploadFileInfo } from '@/types/interfaces/common';
import {
  MessageInfo,
  SendMessageParams,
} from '@/types/interfaces/conversationInfo';
import type { SelectedDocInfo } from '@/types/interfaces/repo';
import { emitConversationChanged } from '@/utils/directorySyncEvents';
import eventBus from '@/utils/eventBus';
import { appendOpenAppChromeFlags } from '@/utils/openAppChromeFlags';
import { FormInstance, message } from 'antd';
import React, { useEffect } from 'react';

export interface UseChatConversationProps {
  id: number;
  agentId: number;
  isAppSidebarMode: boolean;
  history: any;
  form: FormInstance;
  isChatInputDisabled: boolean;
  isSendMessageRef: React.MutableRefObject<boolean>;
  variableParams: any;
  getEffectiveSandboxId: () => string | undefined;
  /**
   * 清空上下文新建会话时绑定的沙箱 id（bug 2451：执行按创建时绑定路由）。
   * 语义=清空重置手动选择后的生效值（智能体绑定/云电脑哨兵），
   * 由页面以渲染期值传入（handleClear 内 state 闭包已过时，不可现场求值）。
   * 类型归一（bug2443）：智能体绑定沙箱可能为非数字形态，number | string。
   */
  createConversationSandboxId?: number | string;
  setClearLoading: (loading: boolean) => void;
  handleClearSideEffect: () => void;
  setIsMoreMessage: (isMore: boolean) => void;
  setMessageList: React.Dispatch<React.SetStateAction<MessageInfo[]>>;
  clearFilePanelInfo: () => void;
  setVariableParams: (params: any) => void;
  setSelectedComputerId: (id: string) => void;
  setIsSelectionLocked: (locked: boolean) => void;
  setHasUserSentMessage: (sent: boolean) => void;
  setIsLoadingOtherInterface: (loading: boolean) => void;
  onMessageSend: (params: SendMessageParams) => void;
  allowAutoScrollRef: React.MutableRefObject<boolean>;
  messageViewRef: React.RefObject<HTMLDivElement>;
  incrementCalledTrialCount: () => void;
  selectedComponentList: any[];
  /** 选中模型 ID(undefined=尚未选择,由 ModelSelector 自动落回后才有值) */
  selectedModelId?: number;
}

export const useChatConversation = ({
  id,
  agentId,
  isAppSidebarMode,
  history,
  form,
  isChatInputDisabled,
  isSendMessageRef,
  variableParams,
  getEffectiveSandboxId,
  createConversationSandboxId,
  setClearLoading,
  handleClearSideEffect,
  setIsMoreMessage,
  setMessageList,
  clearFilePanelInfo,
  setVariableParams,
  setSelectedComputerId,
  setIsSelectionLocked,
  setHasUserSentMessage,
  setIsLoadingOtherInterface,
  onMessageSend,
  allowAutoScrollRef,
  messageViewRef,
  incrementCalledTrialCount,
  selectedComponentList,
  selectedModelId,
}: UseChatConversationProps) => {
  // 清空会话记录并创建新会话
  const handleClear = async () => {
    setClearLoading(true);
    handleClearSideEffect();
    setIsMoreMessage(false);
    setMessageList([]);
    clearFilePanelInfo();
    form.resetFields();
    setVariableParams(null);
    setSelectedComputerId(''); // 显式重置选中电脑ID
    setIsSelectionLocked(false); // 显式解除锁定
    setHasUserSentMessage(false); // 重置发送状态
    setIsLoadingOtherInterface(true);

    try {
      const res = await apiAgentConversationCreate({
        agentId,
        devMode: false,
        // 执行按创建时绑定的沙箱路由（bug 2451）：创建即带清空重置后的生效
        // 绑定（智能体绑定/云电脑哨兵），与选择器清空后显示一致
        sandboxId: createConversationSandboxId ?? Number(CLOUD_SANDBOX_ID),
      });

      if (res.code === SUCCESS_CODE && res.data) {
        // 注意：这里不重置 clearLoading，让它在外部 useEffect([id]) 中重置
        setIsLoadingOtherInterface(false);
        const { id: newConversationId, agentId: newAgentId } = res.data;
        emitConversationChanged({
          operation: 'created',
          conversationId: String(newConversationId),
          origin: 'chat-clear',
          reason: 'create',
        });

        // 会话发起后跳转的页面URL
        let url = '';

        // 应用智能体模式下，跳转到应用智能体会话页面
        if (isAppSidebarMode) {
          const conversationUrl = '/app/chat/:agentId/:id';
          url = conversationUrl
            .replace(':agentId', newAgentId.toString())
            .replace(':id', newConversationId?.toString() || '');

          url = appendOpenAppChromeFlags(url, location.search);
        } else {
          url = `/home/chat/${newConversationId}/${newAgentId}`;
        }

        // 跳转会话页面
        history.replace(url, {
          message: '',
          files: [],
          infos: [],
          skillIds: [],
          messageSourceType: 'new_chat',
          selectedComputerId: null, // 显式清除 location.state 中的 selectedComputerId
        });
      } else {
        throw new Error(
          res.message || t('PC.Pages.Chat.createConversationFailed'),
        );
      }
    } catch (error: any) {
      const errorMsg =
        error?.message ||
        (typeof error === 'string' ? error : null) ||
        t('PC.Pages.Chat.clearAndCreateFailed');
      message.error(errorMsg);
      setClearLoading(false);
      setIsLoadingOtherInterface(false);
    }
  };

  // 消息发送
  const handleMessageSend = (
    messageInfo: string,
    files: UploadFileInfo[] = [],
    skillIds: number[] = [],
    modelId?: number,
    selectedAgentMode?: AgentMode,
    selectedDocs?: SelectedDocInfo[],
    expertComponents?: AgentSelectedComponentInfo[],
  ) => {
    // 变量参数为空，不发送消息
    if (isChatInputDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      return;
    }

    // 标记用户已发送消息
    setHasUserSentMessage(true);

    isSendMessageRef.current = true;
    const effectiveSandboxId = getEffectiveSandboxId();

    // 专家 chip（输入框 @ 选择）合并进组件列表：与外部受控列表按 id+type 去重
    const mergedInfos = [
      ...selectedComponentList,
      ...(expertComponents || []).filter(
        (expert) =>
          !selectedComponentList.some(
            (selected) =>
              selected.id === expert.id && selected.type === expert.type,
          ),
      ),
    ];

    // 发送消息参数
    const sendParams: SendMessageParams = {
      id,
      messageInfo,
      files,
      infos: mergedInfos,
      variableParams: variableParams || undefined,
      sandboxId: effectiveSandboxId || CLOUD_SANDBOX_ID,
      skillIds,
      selectedDocs,
      modelId: modelId || selectedModelId,
      agentMode: selectedAgentMode || 'yolo',
    };

    incrementCalledTrialCount();
    onMessageSend(sendParams);
  };

  // 监听会话更新事件，更新会话记录
  useEffect(() => {
    const handleConversationUpdate = (data: {
      conversationId: string;
      message: MessageInfo;
    }) => {
      const { conversationId, msg } = data as any;
      // 注意：历史代码中有时传递的是 msg，这里做一下兼容
      const targetMessage = data.message || msg;

      if (Number(id) === Number(conversationId)) {
        setMessageList((list: MessageInfo[]) => [...list, targetMessage]);
        // 当用户手动滚动时，暂停自动滚动
        if (allowAutoScrollRef.current) {
          // 在流式输出/高频更新时，使用强制即时置底，避免 smooth 滚动的堆积和抖动
          const element = messageViewRef.current;
          if (element) {
            element.scrollTo({
              top: element.scrollHeight,
              behavior: 'instant',
            });
          }
        }
      }
    };

    eventBus.on(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
    return () => {
      eventBus.off(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
    };
  }, [id, setMessageList, allowAutoScrollRef, messageViewRef]);

  return {
    handleClear,
    handleMessageSend,
  };
};
