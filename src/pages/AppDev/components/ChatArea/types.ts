import { useAppDevChat } from '@/hooks/useAppDevChat';
import { useAppDevProjectInfo } from '@/hooks/useAppDevProjectInfo';

export interface ChatAreaProps {
  chatMode: 'chat' | 'design';
  setChatMode: (mode: 'chat' | 'design') => void;
  chat: ReturnType<typeof useAppDevChat>;
  projectInfo: ReturnType<typeof useAppDevProjectInfo>;
  projectId: string; // 项目ID
  onVersionSelect: (version: number) => void;
}
