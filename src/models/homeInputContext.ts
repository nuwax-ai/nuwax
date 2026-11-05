import useSelectedComponent from '@/hooks/useSelectedComponent';
import type { SummonedExpertInfo } from '@/hooks/useSummonExpertHandoff';
import type { DisplayRecommendInfo } from '@/types/interfaces/displayRecommend';
import type { PinnedProjectInfo } from '@/types/interfaces/userProject';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { useEffect, useState } from 'react';

/** 首页输入上下文随 SPA 保留，避免文字草稿恢复后丢失项目绑定；刷新即失效。 */
export default function useHomeInputContext() {
  const [pinnedProject, setPinnedProject] = useState<PinnedProjectInfo>();
  const [selectedComputerId, setSelectedComputerId] = useState('-1');
  const [workspacePath, setWorkspaceDir] = useState('');
  const [selectedRecommend, setSelectedRecommend] =
    useState<DisplayRecommendInfo>();
  const [summonedExpert, setSummonedExpert] = useState<SummonedExpertInfo>();
  const [userPickedCategory, setUserPickedCategory] = useState<string | null>(
    null,
  );
  const selectedComponents = useSelectedComponent();
  const [componentAgentKey, setComponentAgentKey] = useState<string>();

  useEffect(() => {
    const reset = () => {
      setPinnedProject(undefined);
      setSelectedComputerId('-1');
      setWorkspaceDir('');
      setSelectedRecommend(undefined);
      setSummonedExpert(undefined);
      setUserPickedCategory(null);
      selectedComponents.initSelectedComponentList();
      setComponentAgentKey(undefined);
    };
    eventBus.on(EVENT_NAMES.AUTH_SESSION_CLEARED, reset);
    return () => eventBus.off(EVENT_NAMES.AUTH_SESSION_CLEARED, reset);
  }, []);

  return {
    ...selectedComponents,
    componentAgentKey,
    setComponentAgentKey,
    pinnedProject,
    setPinnedProject,
    selectedComputerId,
    setSelectedComputerId,
    workspacePath,
    setWorkspaceDir,
    selectedRecommend,
    setSelectedRecommend,
    summonedExpert,
    setSummonedExpert,
    userPickedCategory,
    setUserPickedCategory,
  };
}
