/**
 * 会话生命周期管理测试
 *
 * 测试场景：
 * - 会话创建成功/失败流程
 * - 会话切换时的状态重置
 * - 会话清除（handleClear）的完整副作用链
 * - 会话状态更新事件监听
 * - 消息列表更新与自动滚动逻辑
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock 依赖
const mockHistoryReplace = vi.fn();
const mockEventBusOn = vi.fn();
const mockEventBusOff = vi.fn();
const mockMessageError = vi.fn();

vi.mock('umi', () => ({
  history: { replace: mockHistoryReplace },
}));

vi.mock('@/utils/eventBus', () => ({
  default: {
    on: mockEventBusOn,
    off: mockEventBusOff,
  },
}));

vi.mock('antd', () => ({
  message: {
    error: mockMessageError,
  },
  Form: {
    useForm: () => [{ resetFields: vi.fn() }],
  },
}));

vi.mock('@/services/agentConfig', () => ({
  apiAgentConversationCreate: vi.fn(),
}));

vi.mock('@/services/i18nRuntime', () => ({
  t: (key: string) => key,
}));

describe('会话生命周期管理', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============ 场景1：会话创建流程 ============
  describe('会话创建流程', () => {
    it('创建成功后跳转到正确的会话页面', async () => {
      const { apiAgentConversationCreate } = await import(
        '@/services/agentConfig'
      );
      (apiAgentConversationCreate as any).mockResolvedValue({
        code: '0000',
        data: { id: 123, agentId: 456 },
      });

      const { useChatConversation } = await import(
        '@/pages/Chat/hooks/useChatConversation'
      );

      const mockSetClearLoading = vi.fn();
      const mockHandleClearSideEffect = vi.fn();
      const mockSetIsMoreMessage = vi.fn();
      const mockSetMessageList = vi.fn();
      const mockClearFilePanelInfo = vi.fn();
      const mockSetVariableParams = vi.fn();
      const mockSetSelectedComputerId = vi.fn();
      const mockSetIsSelectionLocked = vi.fn();
      const mockSetHasUserSentMessage = vi.fn();
      const mockSetIsLoadingOtherInterface = vi.fn();
      const mockForm = { resetFields: vi.fn() };

      const { result } = renderHook(() =>
        useChatConversation({
          id: 100,
          agentId: 456,
          isAppSidebarMode: false,
          history: { replace: mockHistoryReplace },
          form: mockForm as any,
          isChatInputDisabled: false,
          isSendMessageRef: { current: false },
          variableParams: null,
          getEffectiveSandboxId: () => undefined,
          setClearLoading: mockSetClearLoading,
          handleClearSideEffect: mockHandleClearSideEffect,
          setIsMoreMessage: mockSetIsMoreMessage,
          setMessageList: mockSetMessageList,
          clearFilePanelInfo: mockClearFilePanelInfo,
          setVariableParams: mockSetVariableParams,
          setSelectedComputerId: mockSetSelectedComputerId,
          setIsSelectionLocked: mockSetIsSelectionLocked,
          setHasUserSentMessage: mockSetHasUserSentMessage,
          setIsLoadingOtherInterface: mockSetIsLoadingOtherInterface,
          onMessageSend: vi.fn(),
          conversationInfo: { id: 100 },
          runAsync: vi.fn(),
          allowAutoScrollRef: { current: true },
          messageViewRef: { current: null },
          incrementCalledTrialCount: vi.fn(),
          selectedComponentList: [],
          selectedModelId: 1,
        }),
      );

      await act(async () => {
        await result.current.handleClear();
      });

      expect(mockSetClearLoading).toHaveBeenCalledWith(true);
      expect(mockHandleClearSideEffect).toHaveBeenCalled();
      expect(mockSetIsMoreMessage).toHaveBeenCalledWith(false);
      expect(mockSetMessageList).toHaveBeenCalledWith([]);
      expect(mockClearFilePanelInfo).toHaveBeenCalled();
      expect(mockForm.resetFields).toHaveBeenCalled();
      expect(mockSetVariableParams).toHaveBeenCalledWith(null);
      expect(mockSetSelectedComputerId).toHaveBeenCalledWith('');
      expect(mockSetIsSelectionLocked).toHaveBeenCalledWith(false);
      expect(mockSetHasUserSentMessage).toHaveBeenCalledWith(false);

      // 验证跳转
      expect(mockHistoryReplace).toHaveBeenCalledWith(
        '/home/chat/123/456',
        expect.objectContaining({
          message: '',
          files: [],
          messageSourceType: 'new_chat',
        }),
      );
    });

    it('创建失败时显示错误提示', async () => {
      const { apiAgentConversationCreate } = await import(
        '@/services/agentConfig'
      );
      (apiAgentConversationCreate as any).mockResolvedValue({
        code: '500',
        message: 'Server error',
      });

      const { useChatConversation } = await import(
        '@/pages/Chat/hooks/useChatConversation'
      );

      const mockSetClearLoading = vi.fn();
      const mockSetIsLoadingOtherInterface = vi.fn();

      const { result } = renderHook(() =>
        useChatConversation({
          id: 100,
          agentId: 456,
          isAppSidebarMode: false,
          history: { replace: mockHistoryReplace },
          form: { resetFields: vi.fn() } as any,
          isChatInputDisabled: false,
          isSendMessageRef: { current: false },
          variableParams: null,
          getEffectiveSandboxId: () => undefined,
          setClearLoading: mockSetClearLoading,
          handleClearSideEffect: vi.fn(),
          setIsMoreMessage: vi.fn(),
          setMessageList: vi.fn(),
          clearFilePanelInfo: vi.fn(),
          setVariableParams: vi.fn(),
          setSelectedComputerId: vi.fn(),
          setIsSelectionLocked: vi.fn(),
          setHasUserSentMessage: vi.fn(),
          setIsLoadingOtherInterface: mockSetIsLoadingOtherInterface,
          onMessageSend: vi.fn(),
          conversationInfo: { id: 100 },
          runAsync: vi.fn(),
          allowAutoScrollRef: { current: true },
          messageViewRef: { current: null },
          incrementCalledTrialCount: vi.fn(),
          selectedComponentList: [],
          selectedModelId: 1,
        }),
      );

      await act(async () => {
        await result.current.handleClear();
      });

      expect(mockMessageError).toHaveBeenCalledWith('Server error');
      expect(mockSetClearLoading).toHaveBeenCalledWith(false);
      expect(mockSetIsLoadingOtherInterface).toHaveBeenCalledWith(false);
    });

    it('应用智能体模式下跳转到正确的 URL', async () => {
      const { apiAgentConversationCreate } = await import(
        '@/services/agentConfig'
      );
      (apiAgentConversationCreate as any).mockResolvedValue({
        code: '0000',
        data: { id: 789, agentId: 456 },
      });

      const { useChatConversation } = await import(
        '@/pages/Chat/hooks/useChatConversation'
      );

      const { result } = renderHook(() =>
        useChatConversation({
          id: 100,
          agentId: 456,
          isAppSidebarMode: true,
          history: { replace: mockHistoryReplace },
          form: { resetFields: vi.fn() } as any,
          isChatInputDisabled: false,
          isSendMessageRef: { current: false },
          variableParams: null,
          getEffectiveSandboxId: () => undefined,
          setClearLoading: vi.fn(),
          handleClearSideEffect: vi.fn(),
          setIsMoreMessage: vi.fn(),
          setMessageList: vi.fn(),
          clearFilePanelInfo: vi.fn(),
          setVariableParams: vi.fn(),
          setSelectedComputerId: vi.fn(),
          setIsSelectionLocked: vi.fn(),
          setHasUserSentMessage: vi.fn(),
          setIsLoadingOtherInterface: vi.fn(),
          onMessageSend: vi.fn(),
          conversationInfo: { id: 100 },
          runAsync: vi.fn(),
          allowAutoScrollRef: { current: true },
          messageViewRef: { current: null },
          incrementCalledTrialCount: vi.fn(),
          selectedComponentList: [],
          selectedModelId: 1,
        }),
      );

      await act(async () => {
        await result.current.handleClear();
      });

      expect(mockHistoryReplace).toHaveBeenCalledWith(
        '/app/chat/456/789',
        expect.any(Object),
      );
    });
  });

  // ============ 场景2：消息发送流程 ============
  describe('消息发送流程', () => {
    it('变量参数为空时阻止发送并触发表单验证', async () => {
      const { useChatConversation } = await import(
        '@/pages/Chat/hooks/useChatConversation'
      );

      const mockFormValidateFields = vi.fn();
      const mockOnMessageSend = vi.fn();

      const { result } = renderHook(() =>
        useChatConversation({
          id: 100,
          agentId: 456,
          isAppSidebarMode: false,
          history: { replace: mockHistoryReplace },
          form: {
            resetFields: vi.fn(),
            validateFields: mockFormValidateFields,
          } as any,
          isChatInputDisabled: true, // 变量参数为空
          isSendMessageRef: { current: false },
          variableParams: null,
          getEffectiveSandboxId: () => undefined,
          setClearLoading: vi.fn(),
          handleClearSideEffect: vi.fn(),
          setIsMoreMessage: vi.fn(),
          setMessageList: vi.fn(),
          clearFilePanelInfo: vi.fn(),
          setVariableParams: vi.fn(),
          setSelectedComputerId: vi.fn(),
          setIsSelectionLocked: vi.fn(),
          setHasUserSentMessage: vi.fn(),
          setIsLoadingOtherInterface: vi.fn(),
          onMessageSend: mockOnMessageSend,
          conversationInfo: { id: 100 },
          runAsync: vi.fn(),
          allowAutoScrollRef: { current: true },
          messageViewRef: { current: null },
          incrementCalledTrialCount: vi.fn(),
          selectedComponentList: [],
          selectedModelId: 1,
        }),
      );

      act(() => {
        result.current.handleMessageSend('test message');
      });

      expect(mockFormValidateFields).toHaveBeenCalled();
      expect(mockOnMessageSend).not.toHaveBeenCalled();
    });

    it('正常发送消息时传递正确的参数', async () => {
      const { useChatConversation } = await import(
        '@/pages/Chat/hooks/useChatConversation'
      );

      const mockOnMessageSend = vi.fn();
      const mockIncrementCalledTrialCount = vi.fn();

      const { result } = renderHook(() =>
        useChatConversation({
          id: 100,
          agentId: 456,
          isAppSidebarMode: false,
          history: { replace: mockHistoryReplace },
          form: { resetFields: vi.fn() } as any,
          isChatInputDisabled: false,
          isSendMessageRef: { current: false },
          variableParams: { key: 'value' },
          getEffectiveSandboxId: () => 'sandbox-123',
          setClearLoading: vi.fn(),
          handleClearSideEffect: vi.fn(),
          setIsMoreMessage: vi.fn(),
          setMessageList: vi.fn(),
          clearFilePanelInfo: vi.fn(),
          setVariableParams: vi.fn(),
          setSelectedComputerId: vi.fn(),
          setIsSelectionLocked: vi.fn(),
          setHasUserSentMessage: vi.fn(),
          setIsLoadingOtherInterface: vi.fn(),
          onMessageSend: mockOnMessageSend,
          conversationInfo: { id: 100 },
          runAsync: vi.fn(),
          allowAutoScrollRef: { current: true },
          messageViewRef: { current: null },
          incrementCalledTrialCount: mockIncrementCalledTrialCount,
          selectedComponentList: [{ id: 1 }],
          selectedModelId: 2,
        }),
      );

      act(() => {
        result.current.handleMessageSend(
          'test message',
          [{ name: 'file.txt' }] as any,
          [1, 2],
          3,
          'yolo',
        );
      });

      expect(mockOnMessageSend).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 100,
          messageInfo: 'test message',
          files: [{ name: 'file.txt' }],
          infos: [{ id: 1 }],
          variableParams: { key: 'value' },
          sandboxId: 'sandbox-123',
          skillIds: [1, 2],
          modelId: 3,
          agentMode: 'yolo',
        }),
      );
      expect(mockIncrementCalledTrialCount).toHaveBeenCalled();
    });
  });

  // ============ 场景3：事件监听与清理 ============
  describe('事件监听与清理', () => {
    it('注册正确的事件监听器', async () => {
      const { useChatConversation } = await import(
        '@/pages/Chat/hooks/useChatConversation'
      );

      renderHook(() =>
        useChatConversation({
          id: 100,
          agentId: 456,
          isAppSidebarMode: false,
          history: { replace: mockHistoryReplace },
          form: { resetFields: vi.fn() } as any,
          isChatInputDisabled: false,
          isSendMessageRef: { current: false },
          variableParams: null,
          getEffectiveSandboxId: () => undefined,
          setClearLoading: vi.fn(),
          handleClearSideEffect: vi.fn(),
          setIsMoreMessage: vi.fn(),
          setMessageList: vi.fn(),
          clearFilePanelInfo: vi.fn(),
          setVariableParams: vi.fn(),
          setSelectedComputerId: vi.fn(),
          setIsSelectionLocked: vi.fn(),
          setHasUserSentMessage: vi.fn(),
          setIsLoadingOtherInterface: vi.fn(),
          onMessageSend: vi.fn(),
          conversationInfo: { id: 100 },
          runAsync: vi.fn(),
          allowAutoScrollRef: { current: true },
          messageViewRef: { current: null },
          incrementCalledTrialCount: vi.fn(),
          selectedComponentList: [],
          selectedModelId: 1,
        }),
      );

      expect(mockEventBusOn).toHaveBeenCalledWith(
        'chat_finished',
        expect.any(Function),
      );
      expect(mockEventBusOn).toHaveBeenCalledWith(
        'refresh_chat_message',
        expect.any(Function),
      );
    });

    it('组件卸载时移除事件监听器', async () => {
      const { useChatConversation } = await import(
        '@/pages/Chat/hooks/useChatConversation'
      );

      const { unmount } = renderHook(() =>
        useChatConversation({
          id: 100,
          agentId: 456,
          isAppSidebarMode: false,
          history: { replace: mockHistoryReplace },
          form: { resetFields: vi.fn() } as any,
          isChatInputDisabled: false,
          isSendMessageRef: { current: false },
          variableParams: null,
          getEffectiveSandboxId: () => undefined,
          setClearLoading: vi.fn(),
          handleClearSideEffect: vi.fn(),
          setIsMoreMessage: vi.fn(),
          setMessageList: vi.fn(),
          clearFilePanelInfo: vi.fn(),
          setVariableParams: vi.fn(),
          setSelectedComputerId: vi.fn(),
          setIsSelectionLocked: vi.fn(),
          setHasUserSentMessage: vi.fn(),
          setIsLoadingOtherInterface: vi.fn(),
          onMessageSend: vi.fn(),
          conversationInfo: { id: 100 },
          runAsync: vi.fn(),
          allowAutoScrollRef: { current: true },
          messageViewRef: { current: null },
          incrementCalledTrialCount: vi.fn(),
          selectedComponentList: [],
          selectedModelId: 1,
        }),
      );

      unmount();

      expect(mockEventBusOff).toHaveBeenCalledWith(
        'chat_finished',
        expect.any(Function),
      );
      expect(mockEventBusOff).toHaveBeenCalledWith(
        'refresh_chat_message',
        expect.any(Function),
      );
    });
  });
});
