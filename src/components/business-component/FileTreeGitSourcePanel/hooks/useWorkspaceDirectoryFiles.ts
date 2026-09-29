import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetStaticFileList } from '@/services/vncDesktop';
import type { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WORKSPACE_SOURCE_ID,
  mergeDirectoryLevelFiles,
  prefetchedChildDirectories,
  resolveDirectoryLevelFiles,
  workspaceNodeId,
} from '../utils/workspaceFileList';

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
  /** 正在拉取文件列表的目录（相对路径）。请求结束（成功或失败）后移除。 */
  const [loadingDirectoryPaths, setLoadingDirectoryPaths] = useState<
    Set<string>
  >(new Set());
  const loadedDirectoryPathsRef = useRef(loadedDirectoryPaths);
  loadedDirectoryPathsRef.current = loadedDirectoryPaths;
  /**
   * depth 2 已经带回内容的直接子目录。
   * 不放进 loadedDirectoryPaths，避免打开文件树时把每个子目录再请求一遍。
   */
  const prefetchedDirectoryPathsRef = useRef(new Set<string>());
  const directoryRequestTokensRef = useRef(new Map<string, number>());
  /** 在途目录请求集合（loadDirectory 写入/finally 清除；首拉与刷新去重用） */
  const inflightDirectoryRequestsRef = useRef(new Set<string>());
  /** 同一目录可能重叠请求，用计数保证最后一次结束才关掉 loading */
  const directoryLoadingCountRef = useRef(new Map<string, number>());
  const activeRequestCountRef = useRef(0);
  const conversationIdRef = useRef(conversationId);

  // 树形懒加载始终从根目录开始；切换会话时清空上一会话的节点缓存。
  useEffect(() => {
    conversationIdRef.current = conversationId;
    directoryRequestTokensRef.current.clear();
    prefetchedDirectoryPathsRef.current.clear();
    inflightDirectoryRequestsRef.current.clear();
    directoryLoadingCountRef.current.clear();
    activeRequestCountRef.current = 0;
    setCurrentPath('');
    setFiles([]);
    setLoadedDirectoryPaths(new Set());
    setLoading(false);
    setLoadingDirectoryPaths(new Set());
  }, [conversationId]);

  /**
   * 拉取 path 及其下一层（depth: 2），并合并进已有列表。
   * silent 用于下级已经在树上的展开：不转圈，只在后台补下下级。
   * 同一目录的后发请求会使先发响应失效，避免旧列表盖住新列表。
   */
  const loadDirectory = useCallback(
    async (path: string, loadOptions?: { silent?: boolean }) => {
      if (!conversationId) return;
      const silent = loadOptions?.silent === true;
      // 工作区相对路径，去掉首尾斜杠；根目录是空字符串
      const requestPath = path.replace(/^\/+|\/+$/g, '');
      // 同一目录递增序号。响应回来时序号不一致，说明已有更新的请求，丢弃本次结果
      const token =
        (directoryRequestTokensRef.current.get(requestPath) || 0) + 1;
      directoryRequestTokensRef.current.set(requestPath, token);
      inflightDirectoryRequestsRef.current.add(requestPath);
      // 已有下级时静默补下下级，不进入文件夹 loading
      if (!silent) {
        // 重叠请求用计数，最后一次结束才关掉该目录的 loading
        const loadingCount =
          (directoryLoadingCountRef.current.get(requestPath) || 0) + 1;
        directoryLoadingCountRef.current.set(requestPath, loadingCount);
        setLoadingDirectoryPaths((previous) => {
          if (previous.has(requestPath)) return previous;
          const next = new Set(previous);
          next.add(requestPath);
          return next;
        });
        activeRequestCountRef.current += 1;
        setLoading(true);
      }
      try {
        // 只取当前层。后端若仍返回全量递归列表，resolveDirectoryLevelFiles 会裁成这一层
        const result = await apiGetStaticFileList(conversationId, {
          relativePath: requestPath,
          recursive: false,
          depth: 2,
          type: 'all',
        });
        // 会话已切换，或同目录有更新的请求：不再写入，避免串数据
        if (
          conversationIdRef.current !== conversationId ||
          directoryRequestTokensRef.current.get(requestPath) !== token
        ) {
          return;
        }
        if (result.code !== SUCCESS_CODE) {
          return;
        }
        // 接口 name 是工作区根相对路径。节点 id 加上 workspace: 前缀，与文件树选中 id 对齐
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
        // 只替换这一层的直接子项，已加载的其它目录和更深层保留
        setFiles((loadedFiles) =>
          mergeDirectoryLevelFiles(loadedFiles, directoryFiles, requestPath),
        );
        setLoadedDirectoryPaths((loadedPaths) => {
          // 本次响应里的直接子目录。更深的已加载目录是否保留，看它的第一段还在不在
          const directDirectoryPaths = new Set(
            directoryFiles
              .filter((file) => file.isDir)
              .map((file) => file.name.replace(/^\/+|\/+$/g, '')),
          );
          const next = new Set(
            [...loadedPaths].filter((loadedPath) => {
              // 不在本次目录下面的路径（兄弟目录、其它分支）原样保留
              if (
                requestPath &&
                loadedPath !== requestPath &&
                !loadedPath.startsWith(`${requestPath}/`)
              ) {
                return true;
              }
              // 相对本次目录的路径。空字符串表示就是正在刷新的这一层
              const relativePath = requestPath
                ? loadedPath.slice(requestPath.length).replace(/^\/+/, '')
                : loadedPath;
              if (!relativePath) {
                return true;
              }
              // 子目录已从本次结果消失时，丢掉它以及它下面已展开的加载记录
              const directChildName = relativePath.split('/')[0];
              const directChildPath = requestPath
                ? `${requestPath}/${directChildName}`
                : directChildName;
              return directDirectoryPaths.has(directChildPath);
            }),
          );
          next.add(requestPath);
          // 只记预取，不记成已打开。刷新已加载目录时不会把这些子目录再请求一遍
          if (result.data?.recursive === false) {
            const prefetched = prefetchedDirectoryPathsRef.current;
            prefetched.forEach((childPath) => {
              const underRequest = requestPath
                ? childPath.startsWith(`${requestPath}/`)
                : true;
              if (underRequest) {
                prefetched.delete(childPath);
              }
            });
            prefetchedChildDirectories(directoryFiles, requestPath).forEach(
              (childPath) => prefetched.add(childPath),
            );
          }
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
        // 会话已切换时，计数和在途标记已清空，不能再改新会话的状态
        if (conversationIdRef.current !== conversationId) {
          return;
        }
        // 静默补层不占用 loading，只清掉在途标记，避免同一目录再也刷不了
        if (silent) {
          inflightDirectoryRequestsRef.current.delete(requestPath);
          return;
        }
        const loadingCount = Math.max(
          0,
          (directoryLoadingCountRef.current.get(requestPath) || 1) - 1,
        );
          if (loadingCount > 0) {
            directoryLoadingCountRef.current.set(requestPath, loadingCount);
          } else {
            directoryLoadingCountRef.current.delete(requestPath);
            inflightDirectoryRequestsRef.current.delete(requestPath);
            setLoadingDirectoryPaths((previous) => {
              if (!previous.has(requestPath)) return previous;
              const next = new Set(previous);
              next.delete(requestPath);
              return next;
            });
          }
        activeRequestCountRef.current = Math.max(
          0,
          activeRequestCountRef.current - 1,
        );
        setLoading(activeRequestCountRef.current > 0);
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
   * 已展开已加载的目录一并重拉（外层 5s 节流兜底）。在途目录跳过防重复。
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
      // 下级已在上次 depth 2 里，或这个目录已经打开过：后台补下下级，不显示 loading
      const silent =
        prefetchedDirectoryPathsRef.current.has(normalizedPath) ||
        loadedDirectoryPathsRef.current.has(normalizedPath);
      void loadDirectory(normalizedPath, { silent });
    },
    [loadDirectory],
  );

  return {
    files,
    loading,
    loadingDirectoryPaths,
    currentPath,
    loadedDirectoryPaths,
    navigate,
    loadDirectory,
    refresh,
    refreshAllLoaded,
  };
}
