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

export function useWorkspaceDirectoryFiles(
  conversationId: number | undefined,
  options?: {
    /**
     * 首拉门控（「打开文件树面板才拉」口径）：false 时挂载/切会话不主动拉
     * 根层，由面板打开链（openPreviewView → fileTreeRefreshTrigger →
     * refreshAllLoaded）补拉。默认 true 维持原行为。新会话场景保证
     * file-list 不先于 chat 请求发出（后端契约：工作区在 chat 后才建立）。
     */
    enabled?: boolean;
  },
) {
  const enabled = options?.enabled !== false;
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState<WorkspaceStaticFile[]>([]);
  const [loadedDirectoryPaths, setLoadedDirectoryPaths] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(false);
  const directoryRequestTokensRef = useRef(new Map<string, number>());
  /** 在途目录请求集合（loadDirectory 写入/finally 清除；首拉与刷新去重用） */
  const inflightDirectoryRequestsRef = useRef(new Set<string>());
  const activeRequestCountRef = useRef(0);
  const conversationIdRef = useRef(conversationId);

  // 树形懒加载始终从根目录开始；切换会话时清空上一会话的节点缓存。
  useEffect(() => {
    conversationIdRef.current = conversationId;
    directoryRequestTokensRef.current.clear();
    inflightDirectoryRequestsRef.current.clear();
    activeRequestCountRef.current = 0;
    setCurrentPath('');
    setFiles([]);
    setLoadedDirectoryPaths(new Set());
    setLoading(false);
  }, [conversationId]);

  const loadDirectory = useCallback(
    async (path: string) => {
      if (!conversationId) return;
      const requestPath = path.replace(/^\/+|\/+$/g, '');
      const token =
        (directoryRequestTokensRef.current.get(requestPath) || 0) + 1;
      directoryRequestTokensRef.current.set(requestPath, token);
      inflightDirectoryRequestsRef.current.add(requestPath);
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
        setLoadedDirectoryPaths((loadedPaths) => {
          const directDirectoryPaths = new Set(
            directoryFiles
              .filter((file) => file.isDir)
              .map((file) => file.name.replace(/^\/+|\/+$/g, '')),
          );
          const next = new Set(
            [...loadedPaths].filter((loadedPath) => {
              if (
                requestPath &&
                loadedPath !== requestPath &&
                !loadedPath.startsWith(`${requestPath}/`)
              ) {
                return true;
              }
              const relativePath = requestPath
                ? loadedPath.slice(requestPath.length).replace(/^\/+/, '')
                : loadedPath;
              if (!relativePath) {
                return true;
              }
              const directChildName = relativePath.split('/')[0];
              const directChildPath = requestPath
                ? `${requestPath}/${directChildName}`
                : directChildName;
              return directDirectoryPaths.has(directChildPath);
            }),
          );
          next.add(requestPath);
          return next;
        });
      } catch (error) {
        if (conversationIdRef.current === conversationId) {
          message.error(
            error instanceof Error && error.message
              ? error.message
              : dict('PC.Components.LocalFiles.workspaceListFailed'),
          );
        }
      } finally {
        inflightDirectoryRequestsRef.current.delete(requestPath);
        if (conversationIdRef.current === conversationId) {
          activeRequestCountRef.current = Math.max(
            0,
            activeRequestCountRef.current - 1,
          );
          setLoading(activeRequestCountRef.current > 0);
        }
      }
    },
    [conversationId],
  );

  const refresh = useCallback(
    async (path: string = currentPath) => loadDirectory(path),
    [currentPath, loadDirectory],
  );

  /** 同目录在途时跳过（首拉门控与刷新信号同拍触发的去重；用户导航/手动刷新不走此入口） */
  const loadDirectoryIfIdle = useCallback(
    (path: string) => {
      if (inflightDirectoryRequestsRef.current.has(path)) return;
      void loadDirectory(path);
    },
    [loadDirectory],
  );

  // 首拉门控（「打开文件树面板才拉」）：enabled=false 时挂载/切会话不预发
  // file-list（后端契约：新会话工作区在 chat 之后才建立）；面板打开链
  // （openPreviewView → fileTreeRefreshTrigger → refreshAllLoaded）会补拉
  useEffect(() => {
    if (!conversationId || !enabled) return;
    loadDirectoryIfIdle('');
  }, [conversationId, enabled, loadDirectoryIfIdle]);

  /**
   * 刷新全部已加载目录（含根层——切会话后集合为空也不漏）：
   * 「打开的目录不刷新」修复——刷新信号到达时不止刷 currentPath 单层，
   * 已展开已加载的目录一并重拉（外层 2s 节流兜底）。在途目录跳过防重复。
   */
  const refreshAllLoaded = useCallback(() => {
    loadDirectoryIfIdle('');
    loadedDirectoryPaths.forEach((path) => {
      if (path) loadDirectoryIfIdle(path);
    });
  }, [loadDirectoryIfIdle, loadedDirectoryPaths]);

  const navigate = useCallback(
    (path: string) => {
      const normalizedPath = path.replace(/^\/+|\/+$/g, '');
      setCurrentPath(normalizedPath);
      void loadDirectory(normalizedPath);
    },
    [loadDirectory],
  );

  return {
    files,
    loading,
    currentPath,
    loadedDirectoryPaths,
    navigate,
    loadDirectory,
    refresh,
    refreshAllLoaded,
  };
}
