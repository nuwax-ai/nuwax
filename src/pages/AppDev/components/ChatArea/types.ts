import { useAppDevChat } from '@/hooks/useAppDevChat';
import { useAppDevProjectInfo } from '@/hooks/useAppDevProjectInfo';
import type {
  DataSourceSelection,
  FileContentState,
} from '@/types/interfaces/appDev';

export interface ChatAreaProps {
  chatMode: 'chat' | 'design';
  setChatMode: (mode: 'chat' | 'design') => void;
  chat: ReturnType<typeof useAppDevChat>;
  projectInfo: ReturnType<typeof useAppDevProjectInfo>;
  projectId: string; // 项目ID
  onVersionSelect: (version: number) => void;
  selectedDataSources?: DataSourceSelection[]; // 新增：选中的数据源列表
  onUpdateDataSources?: (dataSources: DataSourceSelection[]) => void; // 新增：更新数据源回调
  fileContentState?: FileContentState; // 新增：文件内容状态
}
