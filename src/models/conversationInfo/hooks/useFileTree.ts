/**
 * 文件树管理 Hook
 * 管理文件树数据、视图模式、文件选择等
 */

import { EVENT_TYPE } from '@/constants/event.constants';
import { apiGetStaticFileList } from '@/services/vncDesktop';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  StaticFileInfo,
  StaticFileListResponse,
} from '@/types/interfaces/vncDesktop';
import eventBus from '@/utils/eventBus';
import { useRequest } from 'ahooks';
import { useCallback, useRef, useState } from 'react';
import type { FileTreeReturn } from '../types';

export const useFileTree = (): FileTreeReturn => {
  // 文件树显隐状态
  const [isFileTreeVisible, setIsFileTreeVisible] = useState<boolean>(false);
  // 文件树是否固定（用户点击后固定）
  const [isFileTreePinned, setIsFileTreePinned] = useState<boolean>(false);
  // 文件树数据
  const [fileTreeData, setFileTreeData] = useState<StaticFileInfo[]>([]);
  // 文件树数据加载状态
  const [fileTreeDataLoading, setFileTreeDataLoading] =
    useState<boolean>(false);
  // 文件树视图模式
  const [viewMode, setViewMode] = useState<'preview' | 'desktop'>('preview');
  // 使用 ref 跟踪当前视图模式和文件树可见状态，用于避免不必要的刷新
  const viewModeRef = useRef<'preview' | 'desktop'>('preview');
  const isFileTreeVisibleRef = useRef<boolean>(false);
  // 任务智能体会话中点击选中的文件ID
  const [taskAgentSelectedFileId, setTaskAgentSelectedFileId] =
    useState<string>('');
  // 任务智能体文件选择触发标志
  const [taskAgentSelectTrigger, setTaskAgentSelectTrigger] = useState<
    number | string
  >(0);

  // 查询文件列表
  const { runAsync: runGetStaticFileList } = useRequest(apiGetStaticFileList, {
    manual: true,
    debounceWait: 500,
    onSuccess: (result: RequestResponse<StaticFileListResponse>) => {
      setFileTreeDataLoading(false);
      const files = result?.data?.files || [];
      if (files?.length) {
        const _fileTreeData = files.map((item) => ({
          ...item,
          fileId: item.name,
        }));
        setFileTreeData(_fileTreeData);
      } else {
        setFileTreeData([]);
      }
    },
    onError: () => {
      setFileTreeDataLoading(false);
      setFileTreeData([]);
    },
  });

  // 处理文件列表刷新事件
  const handleRefreshFileList = useCallback(
    async (conversationId?: number) => {
      if (conversationId) {
        setFileTreeDataLoading(true);
        await runGetStaticFileList(conversationId);
      }
    },
    [runGetStaticFileList],
  );

  // 打开预览视图或远程桌面视图时修改状态值
  const openPreviewChangeState = useCallback((mode: 'preview' | 'desktop') => {
    setViewMode(mode);
    setIsFileTreeVisible(true);
    viewModeRef.current = mode;
    isFileTreeVisibleRef.current = true;
  }, []);

  // 关闭预览视图
  const closePreviewView = useCallback(() => {
    setIsFileTreeVisible(false);
    isFileTreeVisibleRef.current = false;
  }, []);

  // 清除文件面板信息，并关闭文件面板
  const clearFilePanelInfo = useCallback(() => {
    closePreviewView();
    setFileTreeData([]);
    setViewMode('preview');
    viewModeRef.current = 'preview';
  }, [closePreviewView]);

  // 打开预览视图
  const openPreviewView = useCallback(
    async (cId: number) => {
      // 检查是否需要刷新文件列表
      const needRefresh =
        viewModeRef.current !== 'preview' || !isFileTreeVisibleRef.current;

      openPreviewChangeState('preview');

      if (needRefresh) {
        eventBus.emit(EVENT_TYPE.RefreshFileList, cId);
      }
    },
    [openPreviewChangeState],
  );

  return {
    isFileTreeVisible,
    setIsFileTreeVisible,
    isFileTreePinned,
    setIsFileTreePinned,
    fileTreeData,
    setFileTreeData,
    fileTreeDataLoading,
    setFileTreeDataLoading,
    viewMode,
    setViewMode,
    viewModeRef,
    isFileTreeVisibleRef,
    taskAgentSelectedFileId,
    setTaskAgentSelectedFileId,
    taskAgentSelectTrigger,
    setTaskAgentSelectTrigger,
    handleRefreshFileList,
    openPreviewChangeState,
    closePreviewView,
    clearFilePanelInfo,
    openPreviewView,
  };
};
