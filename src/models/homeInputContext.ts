import useSelectedComponent from '@/hooks/useSelectedComponent';
import type { SummonedExpertInfo } from '@/hooks/useSummonExpertHandoff';
import type { DisplayRecommendInfo } from '@/types/interfaces/displayRecommend';
import type { PinnedProjectInfo } from '@/types/interfaces/userProject';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { useCallback, useEffect, useState } from 'react';

/** 首页草稿的选择上下文：随 SPA 保留，刷新即失效；正文/引用/附件由 draftStorage 保存。 */
export default function useHomeInputContext() {
  const [pinnedProject, setPinnedProject] = useState<PinnedProjectInfo>();
  const [selectedComputerId, setSelectedComputerId] = useState('-1');
  const [workspacePath, setWorkspaceDir] = useState('');
  const [selectedModelId, setSelectedModelId] = useState<number>();
  const [selectedSpaceId, setSelectedSpaceId] = useState<number>();
  const [selectedRecommend, setSelectedRecommend] =
    useState<DisplayRecommendInfo>();
  const [summonedExpert, setSummonedExpert] = useState<SummonedExpertInfo>();
  const [userPickedCategory, setUserPickedCategory] = useState<string | null>(
    null,
  );
  const selectedComponents = useSelectedComponent();
  const [componentAgentKey, setComponentAgentKey] = useState<string>();

  const resetInputContext = useCallback(() => {
    setPinnedProject(undefined);
    setSelectedComputerId('-1');
    setWorkspaceDir('');
    setSelectedModelId(undefined);
    setSelectedSpaceId(undefined);
    setSelectedRecommend(undefined);
    setSummonedExpert(undefined);
    setUserPickedCategory(null);
    selectedComponents.initSelectedComponentList();
    setComponentAgentKey(undefined);
  }, []);

  useEffect(() => {
    eventBus.on(EVENT_NAMES.AUTH_SESSION_CLEARED, resetInputContext);
    return () =>
      eventBus.off(EVENT_NAMES.AUTH_SESSION_CLEARED, resetInputContext);
  }, [resetInputContext]);

  return {
    ...selectedComponents,
    resetInputContext,
    componentAgentKey,
    setComponentAgentKey,
    pinnedProject,
    setPinnedProject,
    selectedComputerId,
    setSelectedComputerId,
    workspacePath,
    setWorkspaceDir,
    selectedModelId,
    setSelectedModelId,
    selectedSpaceId,
    setSelectedSpaceId,
    selectedRecommend,
    setSelectedRecommend,
    summonedExpert,
    setSummonedExpert,
    userPickedCategory,
    setUserPickedCategory,
  };
}
