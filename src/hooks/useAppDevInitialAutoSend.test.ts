import {
  createAppDevInitialPayloadKey,
  useAppDevInitialAutoSend,
  type AppDevInitialPayload,
} from '@/hooks/useAppDevInitialAutoSend';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import {
  DataResourceStatus,
  DataResourceType,
} from '@/types/interfaces/dataResource';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseModel, mockGenerateRequestId } = vi.hoisted(() => ({
  mockUseModel: vi.fn(),
  mockGenerateRequestId: vi.fn(),
}));

vi.mock('umi', () => ({
  useModel: (...args: unknown[]) => mockUseModel(...args),
}));

vi.mock('@/utils/chatUtils', () => {
  return {
    generateRequestId: (...args: unknown[]) => mockGenerateRequestId(...args),
  };
});

describe('useAppDevInitialAutoSend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateRequestId.mockReturnValue('request-appdev-1');
  });

  it('消费四类入口共用的首条消息上下文，并带附件、技能、组件和模型发送', () => {
    const payload: AppDevInitialPayload = {
      message: 'build a dashboard',
      modelId: 2002,
      skillIds: [301],
      files: [
        {
          uid: 'image-1',
          name: 'mockup.png',
          type: 'image/png',
          url: 'https://example.test/mockup.png',
          width: 640,
          height: 360,
        },
        {
          uid: 'doc-1',
          key: 'doc-key-1',
          name: 'prd.pdf',
          type: 'application/pdf',
          url: 'https://example.test/prd.pdf',
          size: 2048,
        },
      ],
      infos: [
        {
          id: 11,
          name: 'plugin tool',
          targetType: AgentComponentTypeEnum.Plugin,
          description: 'plugin desc',
        },
        {
          targetId: 12,
          title: 'workflow tool',
          targetType: AgentComponentTypeEnum.Workflow,
        },
      ],
      selectedComputerId: 'computer-1',
      agentMode: 'ask',
    };
    const getContext = vi.fn().mockReturnValue(payload);
    const clearContext = vi.fn();
    mockUseModel.mockImplementation((name: string) => {
      if (name === 'pageHandoffContext') {
        return { getContext, clearContext };
      }
      return {};
    });
    const chat = {
      isChatLoading: false,
      sendMessageWithPrompt: vi.fn(),
    };
    const modelSelector = {
      selectedModelId: 1001,
      models: { chatModelList: [{ id: 2002 }, { id: 1001 }] },
      selectModel: vi.fn(),
    };

    renderHook(() =>
      useAppDevInitialAutoSend({
        projectId: 'project-1',
        hasValidProjectId: true,
        hasPermission: true,
        chat,
        modelSelector,
      }),
    );

    expect(getContext).toHaveBeenCalledWith(
      createAppDevInitialPayloadKey('project-1'),
    );
    expect(modelSelector.selectModel).toHaveBeenCalledWith(2002);
    expect(chat.sendMessageWithPrompt).toHaveBeenCalledWith({
      prompt: 'build a dashboard',
      requestId: 'request-appdev-1',
      selectedModelId: 2002,
      attachments: [
        expect.objectContaining({
          type: 'Image',
          content: expect.objectContaining({
            id: 'image-1',
            filename: 'mockup.png',
            dimensions: { width: 640, height: 360 },
          }),
        }),
        expect.objectContaining({
          type: 'Document',
          content: expect.objectContaining({
            id: 'doc-1',
            filename: 'prd.pdf',
            size: 2048,
          }),
        }),
      ],
      attachmentFiles: [
        {
          url: 'https://example.test/mockup.png',
          mimeType: 'image/png',
          fileName: 'mockup.png',
          fileKey: 'image-1',
        },
        {
          url: 'https://example.test/prd.pdf',
          mimeType: 'application/pdf',
          fileName: 'prd.pdf',
          fileKey: 'doc-key-1',
        },
      ],
      skillIds: [301],
      selectedDataResources: [
        {
          id: 11,
          name: 'plugin tool',
          type: DataResourceType.PLUGIN,
          isSelected: true,
          status: DataResourceStatus.ACTIVE,
          description: 'plugin desc',
          icon: undefined,
        },
        {
          id: 12,
          name: 'workflow tool',
          type: DataResourceType.WORKFLOW,
          isSelected: true,
          status: DataResourceStatus.ACTIVE,
          description: undefined,
          icon: undefined,
        },
      ],
    });
    expect(clearContext).toHaveBeenCalledWith(
      createAppDevInitialPayloadKey('project-1'),
    );
  });

  it('会话正在加载或没有权限时不自动发送，也不清理上下文', () => {
    const getContext = vi.fn().mockReturnValue({
      message: 'do not send yet',
      modelId: 1001,
    });
    const clearContext = vi.fn();
    mockUseModel.mockReturnValue({ getContext, clearContext });
    const chat = {
      isChatLoading: true,
      sendMessageWithPrompt: vi.fn(),
    };

    renderHook(() =>
      useAppDevInitialAutoSend({
        projectId: 'project-1',
        hasValidProjectId: true,
        hasPermission: false,
        chat,
        modelSelector: {
          selectedModelId: 1001,
          models: { chatModelList: [{ id: 1001 }] },
          selectModel: vi.fn(),
        },
      }),
    );

    expect(chat.sendMessageWithPrompt).not.toHaveBeenCalled();
    expect(clearContext).not.toHaveBeenCalled();
  });
});
