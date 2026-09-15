import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetStaticFileList } from '@/services/vncDesktop';
import type { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WORKSPACE_SOURCE_ID,
  mergeDirectoryLevelFiles,
  resolveDirectoryLevelFiles,
  workspaceNodeId,
} from '../utils/fileDataSource';

export interface WorkspaceStaticFile extends StaticFileInfo {
  dataSourceId: string;
  relativePath: string;
}

export function useWorkspaceDirectoryFiles(conversationId: number | undefined) {
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<WorkspaceStaticFile[]>([]);
  const [loading, setLoading] = useState(false);
  const directoryRequestTokensRef = useRef(new Map<string, number>());
  const activeRequestCountRef = useRef(0);
  const conversationIdRef = useRef(conversationId);

  // 树形懒加载始终从根目录开始；切换会话时清空上一会话的节点缓存。
  useEffect(() => {
    conversationIdRef.current = conversationId;
    directoryRequestTokensRef.current.clear();
    activeRequestCountRef.current = 0;
    setCurrentPath('');
    setFiles([]);
    setLoading(false);
  }, [conversationId]);

  const refresh = useCallback(async () => {
    if (!conversationId) return;
    const requestPath = currentPath;
    const token = (directoryRequestTokensRef.current.get(requestPath) || 0) + 1;
    directoryRequestTokensRef.current.set(requestPath, token);
    activeRequestCountRef.current += 1;
    setLoading(true);
    try {
      const result = await apiGetStaticFileList(conversationId, {
        relativePath: requestPath,
        recursive: false,
      });
      if (
        conversationIdRef.current !== conversationId ||
        directoryRequestTokensRef.current.get(requestPath) !== token
      ) {
        return;
      }
      if (result.code !== SUCCESS_CODE) {
        return;
      }
      const directoryFiles = resolveDirectoryLevelFiles(
        result.data?.files || [],
        result.data?.recursive,
        requestPath,
      ).map((file) => ({
        ...file,
        fileId: workspaceNodeId(file.name),
        dataSourceId: WORKSPACE_SOURCE_ID,
        relativePath: file.name,
      }));
      setFiles((loadedFiles) =>
        mergeDirectoryLevelFiles(loadedFiles, directoryFiles, requestPath),
      );
    } catch (error) {
      if (conversationIdRef.current === conversationId) {
        message.error(
          error instanceof Error && error.message
            ? error.message
            : dict('PC.Components.LocalFiles.workspaceListFailed'),
        );
      }
    } finally {
      if (conversationIdRef.current === conversationId) {
        activeRequestCountRef.current = Math.max(
          0,
          activeRequestCountRef.current - 1,
        );
        setLoading(activeRequestCountRef.current > 0);
      }
    }
  }, [conversationId, currentPath]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const navigate = useCallback((path: string) => {
    setCurrentPath(path.replace(/^\/+|\/+$/g, ''));
  }, []);

  return { files, loading, currentPath, navigate, refresh };
}
