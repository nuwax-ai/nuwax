import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiNormalProjectGetById,
  apiNormalProjectUpdate,
} from '@/services/userProjectApp';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { ConversationInfo } from '@/types/interfaces/conversationInfo';
import type { UserNormalProjectInfo } from '@/types/interfaces/userProject';
import { emitProjectChanged } from '@/utils/directorySyncEvents';
import { fetchGeneratedMetadata } from '@/utils/generatedMetadata';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRequest } from 'umi';

export interface UseChatNormalProjectNameSyncOptions {
  /** 当前会话详情 */
  conversationInfo?: ConversationInfo | null;
  /** 创建跳转携带的首条 Prompt，用于 generate-info */
  prompt?: string;
  /** 会话实例创建时的导航动作，避免常驻页读取之后其他页面的动作。 */
  navigationAction?: string;
}

/**
 * 常规项目会话在 Chat 宿主下的项目元数据补全。
 *
 * - 会话 devTargetType=NormalProject 时拉取项目详情；
 * - nameDefined 为 false 时，用 Prompt 调 generate-info 生成名称/图标/描述并写回；
 * - 用户已在侧栏/详情页改过名（nameDefined=true）则不再覆盖。
 */
export const useChatNormalProjectNameSync = ({
  conversationInfo,
  prompt,
  navigationAction,
}: UseChatNormalProjectNameSyncOptions): void => {
  const normalProjectId = useMemo(() => {
    if (
      !conversationInfo?.id ||
      conversationInfo.devTargetType !== AgentComponentTypeEnum.NormalProject ||
      !conversationInfo.devTargetId
    ) {
      return undefined;
    }
    const parsed = Number(conversationInfo.devTargetId);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [conversationInfo]);

  // 常规项目详情
  const [normalProjectInfo, setNormalProjectInfo] =
    useState<UserNormalProjectInfo | null>(null);
  // 常规项目详情是否已获取
  const [normalProjectInfoFetched, setNormalProjectInfoFetched] =
    useState(false);

  // 按ID查询常规项目详情
  const { run: runGetNormalProjectInfo } = useRequest(apiNormalProjectGetById, {
    manual: true,
    onSuccess: (data: UserNormalProjectInfo) => {
      setNormalProjectInfo(data);
      setNormalProjectInfoFetched(true);
    },
    onError: () => {
      setNormalProjectInfoFetched(true);
    },
  });

  useEffect(() => {
    if (!normalProjectId) {
      setNormalProjectInfo(null);
      setNormalProjectInfoFetched(false);
      return;
    }
    setNormalProjectInfoFetched(false);
    runGetNormalProjectInfo(normalProjectId);
  }, [normalProjectId, runGetNormalProjectInfo]);

  const metadataSyncRef = useRef<number | null>(null);

  useEffect(() => {
    // 重置元数据同步状态
    metadataSyncRef.current = null;
  }, [normalProjectId, conversationInfo?.id]);

  useEffect(() => {
    if (
      !normalProjectId ||
      !normalProjectInfoFetched ||
      normalProjectInfo?.nameDefined !== false ||
      !conversationInfo?.id
    ) {
      return;
    }

    const trimmedPrompt = prompt?.trim();
    // 与 AppDevPro 一致：仅 Prompt 创建 PUSH 跳转时补全元数据
    if (navigationAction !== 'PUSH' || !trimmedPrompt) {
      return;
    }

    // 如果当前正在同步元数据，则直接返回
    if (metadataSyncRef.current === normalProjectId) {
      return;
    }
    // 设置当前正在同步元数据
    metadataSyncRef.current = normalProjectId;

    // 同步元数据
    const syncMetadata = async () => {
      try {
        const meta = await fetchGeneratedMetadata(trimmedPrompt);
        // 如果生成元数据失败，则重置元数据同步状态
        if (!meta) {
          metadataSyncRef.current = null;
          return;
        }

        // 更新常规项目详情
        const result = await apiNormalProjectUpdate({
          id: normalProjectId,
          name: meta.name?.trim() || undefined,
          description: meta.description?.trim() || undefined,
          icon: meta.iconUrl?.trim() || undefined,
        });

        if (result?.code !== SUCCESS_CODE) {
          metadataSyncRef.current = null;
          return;
        }

        // 触发项目变更事件
        emitProjectChanged({
          operation: 'updated',
          project: {
            projectId: String(normalProjectId),
            projectType: AgentComponentTypeEnum.NormalProject,
            ...(conversationInfo.devSpaceId
              ? { spaceId: String(conversationInfo.devSpaceId) }
              : {}),
          },
          patch: {
            name: meta.name?.trim() || undefined,
            description: meta.description?.trim() || undefined,
            icon: meta.iconUrl?.trim() || undefined,
          },
          origin: 'chat',
          reason: 'auto-metadata',
        });
        // 重新获取常规项目详情
        runGetNormalProjectInfo(normalProjectId);
      } catch (error) {
        // 重置元数据同步状态
        metadataSyncRef.current = null;
        console.error(
          'Failed to sync normal project metadata from chat:',
          error,
        );
      }
    };

    void syncMetadata();
  }, [
    conversationInfo?.devSpaceId,
    conversationInfo?.id,
    normalProjectId,
    normalProjectInfo?.nameDefined,
    normalProjectInfoFetched,
    prompt,
    navigationAction,
    runGetNormalProjectInfo,
  ]);
};
