import {
  findSearchFileByRelativePath,
  mapSearchFileToNode,
} from '@/components/business-component/FileTreeGitSourcePanel/FileTreePanel/SearchView/mapSearchFileToNode';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiSearchFiles } from '@/services/vncDesktop';
import type { FileNode } from '@/types/interfaces/appDev';
import { throttle } from 'lodash';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  parentDirectory,
  WORKSPACE_SOURCE_ID,
  workspaceNodeId,
  workspaceRelativePath,
  workspaceSearchKeyword,
} from '../utils/workspaceFileList';
import { useWorkspaceDirectoryFiles } from './useWorkspaceDirectoryFiles';

type SelectWorkspaceFile = (
  fileId: string,
  options?: { selectFolder?: boolean; fallbackNode?: FileNode },
) => Promise<void> | void;

/**
 * 会话工作区文件树：按层加载、服务端搜索、变更后刷新已展开目录。
 * Chat 与 AppDevPro 共用，页面只负责把返回值接到预览面板。
 */
export function useWorkspaceFileTreeSession(options: {
  conversationId?: number;
  /** 为 false 时不主动拉根目录，等刷新信号再拉 */
  enabled?: boolean;
  fileTreeRefreshTrigger?: number;
  /** 面板不可见时忽略刷新信号 */
  refreshEnabled?: boolean;
  taskAgentSelectedFileId?: string;
  taskAgentSelectTrigger?: number | string;
}) {
  const {
    conversationId,
    enabled = true,
    fileTreeRefreshTrigger,
    refreshEnabled = true,
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
  } = options;

  const directory = useWorkspaceDirectoryFiles(conversationId, { enabled });
  /** 预览面板选中文件。本 hook 比预览 hook 更早执行，先放一个空实现，渲染后再赋值 */
  const selectFileRef = useRef<SelectWorkspaceFile>(async () => undefined);

  /**
   * 正在打开的任务结果文件所在目录。
   * 父目录还在加载时，预览侧不要把「树里找不到」当成文件不存在。
   */
  const openingTaskResultRef = useRef<{
    parent: string;
    trigger: number;
  } | null>(null);
  /** 效果里读最新的选中 id，避免触发器没变时闭包仍是上一次的路径 */
  const taskAgentSelectedFileIdRef = useRef(taskAgentSelectedFileId);
  taskAgentSelectedFileIdRef.current = taskAgentSelectedFileId;
  /** 同一次点击只标记一次，重复渲染不再改 openingTaskResultRef */
  const taskResultOpenMarkRef = useRef<number | string | undefined>(undefined);

  // 必须在预览 hook 的自动选中之前写上，否则会把还没加载的目标判成不存在
  if (
    taskAgentSelectTrigger &&
    taskAgentSelectedFileId &&
    taskResultOpenMarkRef.current !== taskAgentSelectTrigger
  ) {
    taskResultOpenMarkRef.current = taskAgentSelectTrigger;
    const openingParent = parentDirectory(
      workspaceRelativePath(taskAgentSelectedFileId).replace(/^\/+|\/+$/g, ''),
    );
    if (openingParent && typeof taskAgentSelectTrigger === 'number') {
      openingTaskResultRef.current = {
        parent: openingParent,
        trigger: taskAgentSelectTrigger,
      };
    }
  }

  /** 刷新函数身份会变，节流回调只调 ref 里的最新一次 */
  const refreshAllLoadedRef = useRef(directory.refreshAllLoaded);
  refreshAllLoadedRef.current = directory.refreshAllLoaded;
  /** 同一个刷新时间戳只处理一次 */
  const handledRefreshTriggerRef = useRef<number>(0);
  // 文件变更可能连续到达，5 秒内合并成一次，并补上节流窗口结束时的最后一次
  const throttledRefresh = useMemo(
    () =>
      throttle(() => refreshAllLoadedRef.current(), 5000, {
        leading: true,
        trailing: true,
      }),
    [],
  );
  useEffect(() => () => throttledRefresh.cancel(), [throttledRefresh]);
  useEffect(() => {
    // 面板不可见时不记下时间戳，等再次可见再用同一次信号补拉
    if (
      !fileTreeRefreshTrigger ||
      handledRefreshTriggerRef.current === fileTreeRefreshTrigger ||
      !refreshEnabled
    ) {
      return;
    }
    handledRefreshTriggerRef.current = fileTreeRefreshTrigger;
    throttledRefresh();
  }, [fileTreeRefreshTrigger, refreshEnabled, throttledRefresh]);

  const loadDirectoryRef = useRef(directory.loadDirectory);
  loadDirectoryRef.current = directory.loadDirectory;

  // 点击会话里生成的文件：按文件名搜索，再用完整相对路径在结果里命中，然后打开内容
  useEffect(() => {
    if (!conversationId || taskAgentSelectTrigger === undefined) {
      return;
    }
    const relativePath = workspaceRelativePath(
      taskAgentSelectedFileIdRef.current || '',
    ).replace(/^\/+|\/+$/g, '');
    if (!relativePath) {
      return;
    }
    const parentPath = parentDirectory(relativePath);
    const trigger = taskAgentSelectTrigger;
    // 搜索还没返回前就标上父目录，自动选中会等到这一层加载完
    if (parentPath) {
      openingTaskResultRef.current = {
        parent: parentPath,
        trigger: Number(trigger),
      };
    }
    let cancelled = false;
    void (async () => {
      try {
        const result = await apiSearchFiles({
          cId: Number(conversationId),
          kw: workspaceSearchKeyword(relativePath),
        });
        if (cancelled || result.code !== SUCCESS_CODE) {
          return;
        }
        const hit = findSearchFileByRelativePath(
          result.data?.files || [],
          relativePath,
        );
        if (!hit) {
          return;
        }
        const node = mapSearchFileToNode(hit, {
          toNodeId: workspaceNodeId,
          dataSourceId: WORKSPACE_SOURCE_ID,
        });
        // 分层树里可能还没有这个文件，先把它的父目录拉进列表
        const directoryPath = parentDirectory(
          node.relativePath || relativePath,
        );
        if (directoryPath) {
          await loadDirectoryRef.current(directoryPath);
        }
        if (cancelled) {
          return;
        }
        // fallbackNode 用搜索结果直接打开，不必等该节点出现在树里
        await selectFileRef.current(node.id, {
          fallbackNode: node,
          selectFolder: node.type === 'folder',
        });
      } catch (error) {
        console.error('搜索任务结果文件失败', error);
      } finally {
        // 只清掉这一次点击的标记，避免后一次点击被前一次的结束清掉
        if (openingTaskResultRef.current?.trigger === Number(trigger)) {
          openingTaskResultRef.current = null;
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, taskAgentSelectTrigger]);

  /** 已加载目录的相对路径换成树节点 id，供展开箭头判断这一层是否还要请求 */
  const loadedFolderIds = useMemo(
    () =>
      new Set(
        [...directory.loadedDirectoryPaths]
          .filter(Boolean)
          .map(workspaceNodeId),
      ),
    [directory.loadedDirectoryPaths],
  );
  /** 正在请求的目录。根目录是空路径，不对应树上的文件夹节点 */
  const loadingFolderIds = useMemo(
    () =>
      new Set(
        [...directory.loadingDirectoryPaths]
          .filter(Boolean)
          .map(workspaceNodeId),
      ),
    [directory.loadingDirectoryPaths],
  );

  /** 文件树搜索框走服务端。没有会话时仍用已加载列表在前端过滤 */
  const remoteFileSearch = conversationId
    ? {
        cId: Number(conversationId),
        toNodeId: workspaceNodeId,
        dataSourceId: WORKSPACE_SOURCE_ID,
      }
    : undefined;

  const onOpenDirectory = useCallback(
    (node: FileNode) => {
      if (node.relativePath) {
        directory.navigate(node.relativePath);
      }
    },
    [directory.navigate],
  );

  /** 搜索命中尚未进树时，先拉它所在的那一层 */
  const ensureFallbackDirectory = useCallback(
    async (selectOptions?: {
      selectFolder?: boolean;
      fallbackNode?: FileNode;
    }) => {
      const fallbackPath = selectOptions?.fallbackNode?.relativePath;
      if (
        selectOptions?.fallbackNode?.type === 'file' &&
        fallbackPath &&
        !selectOptions.selectFolder
      ) {
        await directory.loadDirectory(parentDirectory(fallbackPath));
      }
    },
    [directory.loadDirectory],
  );

  return {
    ...directory,
    loadedFolderIds,
    loadingFolderIds,
    remoteFileSearch,
    onOpenDirectory,
    onLoadDirectory: directory.loadDirectory,
    openingTaskResultRef,
    selectFileRef,
    ensureFallbackDirectory,
  };
}
