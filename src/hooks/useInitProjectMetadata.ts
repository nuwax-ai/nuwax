import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { applyGeneratedIcon } from '@/utils/applyGeneratedIcon';
import {
  fetchGeneratedMetadata,
  type GeneratedMetadata,
} from '@/utils/generatedMetadata';
import { useEffect, useRef } from 'react';
import { history, useLocation } from 'umi';

interface UseInitProjectMetadataProps {
  targetType: AgentComponentTypeEnum;
  targetId: number;
  /** 自定义生成结果写入逻辑；未传时使用通用资源更新逻辑 */
  applyMetadata?: (meta: GeneratedMetadata) => Promise<void>;
  onSuccess?: () => void;
  /** 为 false 时等待（如应用详情尚未返回）；默认 true */
  ready?: boolean;
  /** 为 false 时跳过 generate-info；默认 true */
  shouldInit?: boolean;
  /** 常驻页面的入页路由；传入后绝不读取其它页面的全局路由状态。 */
  routeSnapshot?: {
    state?: unknown;
    action: 'PUSH' | 'POP' | 'REPLACE';
  };
}

/**
 * Prompt 创建跳转后：generate-info 仅写入 icon（描述空时回填），不覆盖 name
 */
export const useInitProjectMetadata = ({
  targetType,
  targetId,
  applyMetadata,
  onSuccess,
  ready = true,
  shouldInit = true,
  routeSnapshot,
}: UseInitProjectMetadataProps) => {
  const location = useLocation();
  const currentRouteState = routeSnapshot ? undefined : location.state;
  const hasInitRef = useRef(false);

  useEffect(() => {
    if (!targetId || hasInitRef.current || !ready) {
      return;
    }

    if (!shouldInit) {
      hasInitRef.current = true;
      return;
    }

    const state = (
      routeSnapshot
        ? routeSnapshot.state
        : currentRouteState || history.location.state
    ) as { message?: string } | undefined;
    const prompt = state?.message?.trim();

    const action = routeSnapshot ? routeSnapshot.action : history.action;
    if (action !== 'PUSH' || !prompt) {
      return;
    }

    hasInitRef.current = true;

    const initMetadata = async () => {
      try {
        const meta = await fetchGeneratedMetadata(prompt);
        if (meta) {
          if (applyMetadata) {
            await applyMetadata(meta);
          } else {
            await applyGeneratedIcon(targetType, targetId, meta);
          }
          onSuccess?.();
        }
      } catch (error) {
        console.error(
          `Failed to initialize metadata for ${targetType}:`,
          error,
        );
      }
    };

    void initMetadata();
  }, [
    targetType,
    targetId,
    currentRouteState,
    routeSnapshot?.state,
    routeSnapshot?.action,
    applyMetadata,
    onSuccess,
    ready,
    shouldInit,
  ]);
};
