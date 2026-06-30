import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { applyGeneratedIcon } from '@/utils/applyGeneratedIcon';
import { fetchGeneratedMetadata } from '@/utils/generatedMetadata';
import { useEffect, useRef } from 'react';
import { history, useLocation } from 'umi';

interface UseInitProjectMetadataProps {
  targetType: AgentComponentTypeEnum;
  targetId: number;
  onSuccess?: () => void;
}

/**
 * Prompt 创建跳转后：generate-info 仅写入 icon（描述空时回填），不覆盖 name
 */
export const useInitProjectMetadata = ({
  targetType,
  targetId,
  onSuccess,
}: UseInitProjectMetadataProps) => {
  const location = useLocation();
  const hasInitRef = useRef(false);

  useEffect(() => {
    const state = (location.state || history.location.state) as
      | { message?: string }
      | undefined;
    const prompt = state?.message?.trim();

    if (
      history.action === 'PUSH' &&
      prompt &&
      targetId &&
      !hasInitRef.current
    ) {
      hasInitRef.current = true;

      const initMetadata = async () => {
        try {
          const meta = await fetchGeneratedMetadata(prompt);
          if (meta) {
            await applyGeneratedIcon(targetType, targetId, meta);
            onSuccess?.();
          }
        } catch (error) {
          console.error(
            `Failed to initialize metadata for ${targetType}:`,
            error,
          );
        }
      };

      initMetadata();
    }
  }, [targetType, targetId, location.state, onSuccess]);
};
