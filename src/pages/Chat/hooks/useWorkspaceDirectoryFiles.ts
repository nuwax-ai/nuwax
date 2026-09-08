import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { apiGetStaticFileList } from '@/services/vncDesktop';
import type { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { message } from 'antd';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WORKSPACE_SOURCE_ID,
  resolveDirectoryLevelFiles,
  workspaceNodeId,
} from '../utils/fileDataSource';

export interface WorkspaceStaticFile extends StaticFileInfo {
  dataSourceId: string;
  relativePath: string;
}

function readStoredPath(storageKey: string): string {
  try {
    return sessionStorage.getItem(storageKey) || '';
  } catch {
    return '';
  }
}

export function useWorkspaceDirectoryFiles(
  conversationId: number | undefined,
  active: boolean,
) {
  const storageKey = `nuwax:workspace-files:${conversationId || ''}`;
  const [currentPath, setCurrentPath] = useState(() =>
    readStoredPath(storageKey),
  );
  const [files, setFiles] = useState<WorkspaceStaticFile[]>([]);
  const [loading, setLoading] = useState(false);
  const requestToken = useRef(0);

  // 切换会话（ChatCore 不随会话 id 重挂载）时重读该会话保存的路径，
  // 避免上一会话的 currentPath/条目泄漏到下一会话
  useEffect(() => {
    requestToken.current += 1;
    setCurrentPath(readStoredPath(storageKey));
    setFiles([]);
  }, [storageKey]);

  const refresh = useCallback(async () => {
    if (!conversationId || !active) return;
    const token = ++requestToken.current;
    setLoading(true);
    try {
      const result = await apiGetStaticFileList(conversationId, {
        relativePath: currentPath,
        recursive: false,
      });
      if (requestToken.current !== token) return;
      if (result.code !== SUCCESS_CODE) {
        setFiles([]);
        return;
      }
      setFiles(
        resolveDirectoryLevelFiles(
          result.data?.files || [],
          result.data?.recursive,
          currentPath,
        ).map((file) => ({
          ...file,
          fileId: workspaceNodeId(file.name),
          dataSourceId: WORKSPACE_SOURCE_ID,
          relativePath: file.name,
        })),
      );
    } catch (error) {
      if (requestToken.current === token) setFiles([]);
      message.error(
        error instanceof Error && error.message
          ? error.message
          : dict('PC.Components.LocalFiles.workspaceListFailed'),
      );
    } finally {
      if (requestToken.current === token) setLoading(false);
    }
  }, [active, conversationId, currentPath]);

  useEffect(() => {
    if (!active) {
      requestToken.current += 1;
      return;
    }
    void refresh();
  }, [active, refresh]);

  const navigate = useCallback(
    (path: string) => {
      setCurrentPath(path);
      try {
        sessionStorage.setItem(storageKey, path);
      } catch {
        /* storage unavailable */
      }
    },
    [storageKey],
  );

  return { files, loading, currentPath, navigate, refresh };
}
