/**
 * AppDev 初始自动发送 Hook
 * 用于承接“新建项目 -> 网页应用 -> 详细开发页”的首条需求透传。
 */
import { createPageHandoffKey } from '@/models/pageHandoffContext';
import type {
  Attachment,
  FileStreamAttachment,
} from '@/types/interfaces/appDev';
import type { UploadFileInfo } from '@/types/interfaces/common';
import {
  DataResourceStatus,
  DataResourceType,
  type DataResource,
} from '@/types/interfaces/dataResource';
import { generateRequestId } from '@/utils/chatUtils';
import { useEffect, useMemo, useRef } from 'react';
import { useModel } from 'umi';

const APP_DEV_INITIAL_PAYLOAD_SCOPE = 'appDevInitialPayload';

/**
 * 生成 AppDev 首条消息透传上下文 key
 * @param projectId AppDev 项目 ID
 * @returns 页面间透传上下文 key
 */
export const createAppDevInitialPayloadKey = (
  projectId?: string | number,
): string => {
  return createPageHandoffKey(APP_DEV_INITIAL_PAYLOAD_SCOPE, projectId);
};

/**
 * 新建项目页透传给 AppDev 的首条消息上下文
 * 该状态仅保存在 SPA 内存中，刷新页面后会自然丢失，避免重复自动发送。
 */
export interface AppDevInitialPayload {
  /** 用户在新建项目页输入的提示词 */
  message?: string;
  /** 用户在新建项目页上传的附件 */
  files?: UploadFileInfo[];
  /** 用户通过 @ 或组件选择带来的技能 ID */
  skillIds?: number[];
  /** 用户在新建项目页选择的模型 ID */
  modelId?: number;
  /** 用户在新建项目页选择的工具/组件信息 */
  infos?: any[];
  /** 用户在新建项目页选择的电脑 ID；当前 AppDev ai-chat 请求体暂未消费，仅保留类型说明 */
  selectedComputerId?: string;
  /** 用户在新建项目页选择的 Agent 模式；当前 AppDev ai-chat 请求体暂未消费，仅保留类型说明 */
  agentMode?: string;
}

interface UseAppDevInitialAutoSendParams {
  /** 当前页面项目 ID */
  projectId?: string;
  /** 当前项目 ID 是否有效 */
  hasValidProjectId: boolean;
  /** 当前用户是否拥有项目权限 */
  hasPermission?: boolean;
  /** AppDev 聊天 Hook 返回值 */
  chat: any;
  /** AppDev 模型选择器 Hook 返回值 */
  modelSelector: any;
}

/**
 * 判断路由 state 中是否包含值得自动发送的首条内容
 * @param state 新建项目页透传过来的路由状态
 * @returns 是否存在提示词、附件或技能
 */
const hasInitialMessagePayload = (state?: AppDevInitialPayload | null) => {
  return Boolean(
    state &&
      (state.message?.trim() || state.files?.length || state.skillIds?.length),
  );
};

/**
 * 将新建项目输入框上传的文件转换为 AppDev 聊天展示附件
 * @param files 新建项目页上传文件列表
 * @returns AppDev 消息列表可展示的附件列表
 */
const toChatAttachments = (files?: UploadFileInfo[]): Attachment[] => {
  return (files || [])
    .filter((file) => file?.url)
    .map((file) => {
      const baseContent = {
        id: file.uid || file.key || file.url,
        filename: file.name,
        mime_type: file.type,
        source: {
          source_type: 'Url',
          data: {
            url: file.url,
            mime_type: file.type,
          },
        },
      };

      if (file.type?.startsWith('image')) {
        return {
          type: 'Image',
          content: {
            dimensions: {
              width: file.width || 0,
              height: file.height || 0,
            },
            ...baseContent,
          },
        } as Attachment;
      }

      return {
        type: 'Document',
        content: {
          size: file.size,
          ...baseContent,
        },
      } as Attachment;
    });
};

/**
 * 将新建项目输入框上传的文件转换为 ai-chat 接口附件
 * @param files 新建项目页上传文件列表
 * @returns ai-chat 接口需要的文件流附件列表
 */
const toFileStreamAttachments = (
  files?: UploadFileInfo[],
): FileStreamAttachment[] => {
  return (files || [])
    .filter((file) => file?.url)
    .map((file) => ({
      url: file.url,
      mimeType: file.type,
      fileName: file.name,
      fileKey: file.key || file.uid,
    }));
};

/**
 * 尝试将新建项目页选择的工具组件转换为 AppDev 数据源
 * @param infos 新建项目页透传的工具/组件信息
 * @returns 可传给 ai-chat 的已选数据源
 */
const toSelectedDataResources = (infos?: any[]): DataResource[] => {
  return (infos || [])
    .map((item): DataResource | null => {
      const id = item?.targetId ?? item?.id;
      const name = item?.name || item?.title;
      if (!id || !name) {
        return null;
      }

      const rawType = `${item?.targetType || item?.type || ''}`.toLowerCase();
      const type = rawType.includes('plugin')
        ? DataResourceType.PLUGIN
        : DataResourceType.WORKFLOW;

      return {
        id,
        name,
        type,
        isSelected: true,
        status: DataResourceStatus.ACTIVE,
        description: item?.description,
        icon: item?.icon,
      };
    })
    .filter((item): item is DataResource => Boolean(item));
};

/**
 * 承接新建项目页透传的首条消息并自动发送一次
 * @param params Hook 参数
 * @returns void
 */
export const useAppDevInitialAutoSend = ({
  projectId,
  hasValidProjectId,
  hasPermission,
  chat,
  modelSelector,
}: UseAppDevInitialAutoSendParams) => {
  const { getContext, clearContext } = useModel('pageHandoffContext');
  const hasAutoSentRef = useRef(false);

  const handoffKey = useMemo(
    () => createAppDevInitialPayloadKey(projectId),
    [projectId],
  );

  const initialState = useMemo<AppDevInitialPayload | undefined>(() => {
    return getContext(handoffKey) as AppDevInitialPayload | undefined;
  }, [getContext, handoffKey]);

  const initialDataResources = useMemo(
    () => toSelectedDataResources(initialState?.infos),
    [initialState?.infos],
  );

  useEffect(() => {
    if (
      !hasInitialMessagePayload(initialState) ||
      !initialState?.modelId ||
      !modelSelector?.models?.chatModelList?.length
    ) {
      return;
    }

    const exists = modelSelector.models.chatModelList.some(
      (model: { id: number }) => model.id === initialState.modelId,
    );
    if (exists && modelSelector.selectedModelId !== initialState.modelId) {
      modelSelector.selectModel(initialState.modelId);
    }
  }, [
    initialState?.modelId,
    initialState,
    modelSelector?.models,
    modelSelector?.selectedModelId,
  ]);

  useEffect(() => {
    if (hasAutoSentRef.current) {
      return;
    }

    if (
      !hasValidProjectId ||
      !projectId ||
      !hasPermission ||
      chat.isChatLoading ||
      !hasInitialMessagePayload(initialState)
    ) {
      return;
    }

    const routeModelId = initialState?.modelId;
    const chatModelList = modelSelector?.models?.chatModelList || [];
    const isRouteModelAvailable =
      routeModelId &&
      chatModelList.some((model: { id: number }) => model.id === routeModelId);
    const selectedModelId = isRouteModelAvailable
      ? routeModelId
      : modelSelector?.selectedModelId;
    if (!selectedModelId) {
      return;
    }

    hasAutoSentRef.current = true;

    const files = initialState?.files || [];
    const requestId = generateRequestId();
    const prompt = initialState?.message || '';

    // 首条消息直接带完整上下文发送，避免先写入输入框再触发发送造成状态竞态。
    chat.sendMessageWithPrompt({
      prompt,
      requestId,
      selectedModelId,
      attachments: toChatAttachments(files),
      attachmentFiles: toFileStreamAttachments(files),
      skillIds: initialState?.skillIds || [],
      selectedDataResources: initialDataResources,
    });

    // 首条消息上下文只消费一次；刷新页面后 model 本身也会重置，不会重复发送。
    clearContext(handoffKey);
  }, [
    hasValidProjectId,
    projectId,
    hasPermission,
    chat.isChatLoading,
    chat.sendMessageWithPrompt,
    initialState,
    initialDataResources,
    clearContext,
    handoffKey,
    modelSelector?.selectedModelId,
  ]);
};
