import { useAppDevChat } from '@/hooks/useAppDevChat';
import { useAppDevModelSelector } from '@/hooks/useAppDevModelSelector';
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
  modelSelector: ReturnType<typeof useAppDevModelSelector>; // 新增：模型选择器状态
  onRefreshVersionList?: () => void; // 新增：刷新版本列表回调
  onClearUploadedImages?: (clearFn: () => void) => void; // 新增：设置图片清空方法回调
}
