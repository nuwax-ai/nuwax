import { useAppDevChat } from '@/hooks/useAppDevChat';
import { useAppDevProjectInfo } from '@/hooks/useAppDevProjectInfo';

export interface ChatAreaProps {
  chatMode: 'chat' | 'design';
  setChatMode: (mode: 'chat' | 'design') => void;
  chat: ReturnType<typeof useAppDevChat>;
  projectInfo: ReturnType<typeof useAppDevProjectInfo>;
  projectId: string; // 新增：项目ID
  loadHistorySession: (sessionId: string) => void; // 新增：加载历史会话方法
}
