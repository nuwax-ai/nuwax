import { useAppDevChat } from '@/hooks/useAppDevChat';
import { useAppDevProjectInfo } from '@/hooks/useAppDevProjectInfo';
import type { DataSourceSelection } from '@/types/interfaces/appDev';

export interface ChatAreaProps {
  chatMode: 'chat' | 'design';
  setChatMode: (mode: 'chat' | 'design') => void;
  chat: ReturnType<typeof useAppDevChat>;
  projectInfo: ReturnType<typeof useAppDevProjectInfo>;
  projectId: string; // 项目ID
  onVersionSelect: (version: number) => void;
  selectedDataSources?: DataSourceSelection[]; // 新增：选中的数据源列表
}
