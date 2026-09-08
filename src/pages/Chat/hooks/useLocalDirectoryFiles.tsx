import type { ChangeFileInfo } from '@/components/business-component/FileTreePreviewPanel';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiDownloadAllFiles,
  apiGetStaticFileList,
  apiSearchFiles,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import type { FileNode } from '@/types/interfaces/appDev';
import type { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { localFiles } from '@/utils/nuwaClawBridge';
import { Input, message, Modal } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { resolveDirectoryLevelFiles } from '../utils/fileDataSource';

/**
 * 本地目录数据源：不走 Electron 桥，统一经 file-server（customTargetDir）HTTP 通道，
 * 浏览器与客户端行为一致（客户端仅在「选目录」时用宿主原生选择器）。
 * targetDir 是会话所在电脑上的绝对路径，由用户显式提供。
 */
interface LocalRootRecord {
  id: string;
  label: string;
  targetDir: string;
}

/** 本地目录条目：file-server 返回 + 数据源标注（fileId/dataSourceId/relativePath） */
type LocalEntry = StaticFileInfo & {
  fileId: string;
  dataSourceId: string;
  relativePath: string;
};

const WORKSPACE_SOURCE_ID = 'workspace';

function baseName(pathValue: string): string {
  return pathValue.split(/[\\/]/).filter(Boolean).pop() || pathValue;
}

function joinPath(parent: string, child: string): string {
  return [parent, child].filter(Boolean).join('/');
}

function localNodeId(rootId: string, relativePath: string): string {
  return `local:${rootId}:${relativePath}`;
}

function loadRoots(storageKey: string): LocalRootRecord[] {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is LocalRootRecord =>
        item &&
        typeof item.id === 'string' &&
        typeof item.label === 'string' &&
        typeof item.targetDir === 'string' &&
        item.targetDir.trim(),
    );
  } catch {
    return [];
  }
}

function restoreState(
  stateKey: string,
  enabled: boolean,
): { sourceId: string; path: string } {
  if (!enabled) return { sourceId: WORKSPACE_SOURCE_ID, path: '' };
  try {
    const value = JSON.parse(sessionStorage.getItem(stateKey) || '{}');
    return {
      sourceId:
        typeof value.sourceId === 'string'
          ? value.sourceId
          : WORKSPACE_SOURCE_ID,
      path: typeof value.path === 'string' ? value.path : '',
    };
  } catch {
    return { sourceId: WORKSPACE_SOURCE_ID, path: '' };
  }
}

export function useLocalDirectoryFiles(conversationId?: number) {
  const enabled = Boolean(conversationId);
  const rootsKey = `nuwax:local-roots:${conversationId || ''}`;
  const stateKey = `nuwax:local-files:${conversationId || ''}`;

  const [roots, setRoots] = useState<LocalRootRecord[]>(() =>
    loadRoots(rootsKey),
  );
  const rootsRef = useRef(roots);
  const [availability, setAvailability] = useState<Record<string, boolean>>({});

  const restored = useMemo(
    () => restoreState(stateKey, enabled),
    [enabled, stateKey],
  );

  const [sourceId, setSourceId] = useState(restored.sourceId);
  const [currentPath, setCurrentPath] = useState(restored.path);
  const [files, setFiles] = useState<LocalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingSelectionId, setPendingSelectionId] = useState('');
  const requestToken = useRef(0);

  const activeRoot = roots.find((root) => root.id === sourceId);
  const active = enabled && sourceId !== WORKSPACE_SOURCE_ID;

  // 切换会话（ChatCore 不随会话 id 重挂载）时整体重置：载入该会话自己的
  // 根列表与导航状态，避免上一会话的目录/路径/条目泄漏到下一会话
  useEffect(() => {
    requestToken.current += 1;
    const nextRoots = loadRoots(rootsKey);
    rootsRef.current = nextRoots;
    setRoots(nextRoots);
    setAvailability({});
    setFiles([]);
    setPendingSelectionId('');
    const next = restoreState(stateKey, enabled);
    if (
      next.sourceId !== WORKSPACE_SOURCE_ID &&
      !nextRoots.some((root) => root.id === next.sourceId)
    ) {
      setSourceId(WORKSPACE_SOURCE_ID);
      setCurrentPath('');
    } else {
      setSourceId(next.sourceId);
      setCurrentPath(next.path);
    }
  }, [enabled, rootsKey, stateKey]);

  const persistRoots = useCallback(
    (next: LocalRootRecord[]) => {
      try {
        localStorage.setItem(rootsKey, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    },
    [rootsKey],
  );

  const updateRoots = useCallback(
    (updater: (prev: LocalRootRecord[]) => LocalRootRecord[]) => {
      const next = updater(rootsRef.current);
      rootsRef.current = next;
      setRoots(next);
      persistRoots(next);
      return next;
    },
    [persistRoots],
  );

  const addRoots = useCallback(
    async (dirs: string[]) => {
      const normalized = Array.from(
        new Set(dirs.map((dir) => dir.trim()).filter(Boolean)),
      );
      if (!normalized.length) return;
      let newestId = '';
      const next = updateRoots((prev) => {
        const added: LocalRootRecord[] = [];
        for (const targetDir of normalized) {
          if (prev.some((root) => root.targetDir === targetDir)) continue;
          added.push({
            id: `local-${Math.random().toString(36).slice(2, 10)}`,
            label: baseName(targetDir) || targetDir,
            targetDir,
          });
        }
        return added.length ? [...added, ...prev] : prev;
      });
      newestId =
        normalized
          .map((dir) => next.find((root) => root.targetDir === dir)?.id)
          .find(Boolean) || '';
      if (newestId) {
        requestToken.current += 1;
        setFiles([]);
        setCurrentPath('');
        setSourceId(newestId);
      }
    },
    [updateRoots],
  );

  const promptForManualPath = useCallback(() => {
    let value = '';
    Modal.confirm({
      title: dict('PC.Components.LocalFiles.openByPathTitle'),
      content: (
        <div>
          <p
            style={{ color: 'var(--ant-color-text-tertiary)', marginBottom: 8 }}
          >
            {dict('PC.Components.LocalFiles.openByPathHint')}
          </p>
          <Input
            placeholder={dict('PC.Components.LocalFiles.pathPlaceholder')}
            onChange={(event) => {
              value = event.target.value;
            }}
          />
        </div>
      ),
      okText: dict('PC.Components.LocalFiles.open'),
      cancelText: dict('PC.Components.LocalFiles.cancel'),
      onOk: async () => {
        await addRoots([value]);
      },
    });
  }, [addRoots]);

  const openRoots = useCallback(async () => {
    if (localFiles.hasNativePicker()) {
      const result = await localFiles.pickDirectory();
      if (!result.canceled && result.paths.length) await addRoots(result.paths);
      return;
    }
    promptForManualPath();
  }, [addRoots, promptForManualPath]);

  const loadEntries = useCallback(
    async (root: LocalRootRecord, pathValue: string) => {
      if (!conversationId) return;
      const token = ++requestToken.current;
      setLoading(true);
      try {
        const result = await apiGetStaticFileList(conversationId, {
          relativePath: pathValue,
          recursive: false,
          customTargetDir: root.targetDir,
        });
        if (requestToken.current !== token) return;
        if (result.code !== SUCCESS_CODE) {
          throw new Error(result.message);
        }
        setAvailability((prev) => ({ ...prev, [root.id]: true }));
        setFiles(
          resolveDirectoryLevelFiles(
            result.data?.files || [],
            result.data?.recursive,
            pathValue,
          ).map((file) => ({
            ...file,
            fileId: localNodeId(root.id, file.name),
            binary: file.binary || false,
            sizeExceeded: file.sizeExceeded || false,
            contents: file.contents || '',
            fileProxyUrl: file.fileProxyUrl || '',
            isDir: file.isDir,
            dataSourceId: root.id,
            relativePath: file.name,
          })),
        );
      } catch (error) {
        if (requestToken.current !== token) return;
        setAvailability((prev) => ({ ...prev, [root.id]: false }));
        setFiles([]);
        message.error(
          error instanceof Error && error.message
            ? error.message
            : dict('PC.Components.LocalFiles.listFailed'),
        );
      } finally {
        if (requestToken.current === token) setLoading(false);
      }
    },
    [conversationId],
  );

  // 恢复的 sourceId 若已不在根列表中则回到项目目录
  useEffect(() => {
    if (
      sourceId !== WORKSPACE_SOURCE_ID &&
      !rootsRef.current.some((root) => root.id === sourceId)
    ) {
      setSourceId(WORKSPACE_SOURCE_ID);
      setCurrentPath('');
    }
  }, [roots, sourceId]);

  useEffect(() => {
    if (!active || !activeRoot) return;
    void loadEntries(activeRoot, currentPath);
    try {
      sessionStorage.setItem(
        stateKey,
        JSON.stringify({ sourceId, path: currentPath }),
      );
    } catch {
      /* storage unavailable */
    }
  }, [active, activeRoot, currentPath, loadEntries, sourceId, stateKey]);

  const refresh = useCallback(async () => {
    if (active && activeRoot) await loadEntries(activeRoot, currentPath);
  }, [active, activeRoot, currentPath, loadEntries]);

  const selectSource = useCallback(
    (id: string) => {
      requestToken.current += 1;
      setFiles([]);
      setPendingSelectionId('');
      setCurrentPath('');
      setSourceId(id);
      try {
        sessionStorage.setItem(
          stateKey,
          JSON.stringify({ sourceId: id, path: '' }),
        );
      } catch {
        /* storage unavailable */
      }
    },
    [stateKey],
  );

  const removeRoot = useCallback(
    (id: string) => {
      updateRoots((prev) => prev.filter((root) => root.id !== id));
      if (id === sourceId) {
        requestToken.current += 1;
        setSourceId(WORKSPACE_SOURCE_ID);
        setCurrentPath('');
        setFiles([]);
        setPendingSelectionId('');
      }
    },
    [sourceId, updateRoots],
  );

  const openDirectory = useCallback((node: FileNode) => {
    if (node.relativePath) setCurrentPath(node.relativePath);
  }, []);

  // rename/create 的同名预检：用当前目录一层 entries 的末段比对（file-server 端
  // create 遇同名跳过、rename 会静默覆盖，前端必须先拦）
  const nameExistsInCurrentDir = useCallback(
    (name: string) =>
      files.some((file) => baseName(file.name) === name && name !== ''),
    [files],
  );

  const rename = useCallback(
    async (node: FileNode, newName: string) => {
      if (!active || !activeRoot || !node.relativePath || !conversationId) {
        return false;
      }
      if (!newName.trim() || newName.includes('/')) return false;
      if (nameExistsInCurrentDir(newName.trim())) {
        message.error(dict('PC.Components.LocalFiles.nameExists'));
        return false;
      }
      const parent = node.relativePath.split('/').slice(0, -1).join('/');
      await apiUpdateStaticFile({
        cId: conversationId,
        files: [
          {
            name: joinPath(parent, newName.trim()),
            renameFrom: node.relativePath,
            operation: 'rename',
          },
        ],
        customTargetDir: activeRoot.targetDir,
      });
      await refresh();
      return true;
    },
    [active, activeRoot, conversationId, nameExistsInCurrentDir, refresh],
  );

  const create = useCallback(
    async (node: FileNode, newName: string) => {
      if (!active || !activeRoot || !conversationId) return false;
      if (!newName.trim() || newName.includes('/')) return false;
      if (nameExistsInCurrentDir(newName.trim())) {
        message.error(dict('PC.Components.LocalFiles.nameExists'));
        return false;
      }
      await apiUpdateStaticFile({
        cId: conversationId,
        files: [
          {
            name: joinPath(currentPath, newName.trim()),
            operation: 'create',
            isDir: node.type === 'folder',
            contents: '',
          },
        ],
        customTargetDir: activeRoot.targetDir,
      });
      await refresh();
      return true;
    },
    [
      active,
      activeRoot,
      conversationId,
      currentPath,
      nameExistsInCurrentDir,
      refresh,
    ],
  );

  const remove = useCallback(
    (node: FileNode) =>
      new Promise<boolean>((resolve) => {
        const relativePath = node.relativePath;
        if (!active || !activeRoot || !relativePath || !conversationId) {
          resolve(false);
          return;
        }
        Modal.confirm({
          title: dict('PC.Components.LocalFiles.deleteTitle'),
          content: dict('PC.Components.LocalFiles.deleteWarning').replace(
            '{name}',
            node.name,
          ),
          okText: dict('PC.Components.LocalFiles.deleteConfirm'),
          okButtonProps: { danger: true },
          cancelText: dict('PC.Components.LocalFiles.cancel'),
          onOk: async () => {
            await apiUpdateStaticFile({
              cId: conversationId,
              files: [
                {
                  name: relativePath,
                  operation: 'delete',
                  isDir: node.type === 'folder',
                },
              ],
              customTargetDir: activeRoot.targetDir,
            });
            await refresh();
            resolve(true);
          },
          onCancel: () => resolve(false),
        });
      }),
    [active, activeRoot, conversationId, refresh],
  );

  const saveOne = useCallback(
    async (fileId: string, content: string): Promise<boolean> => {
      const item = files.find((file) => file.fileId === fileId);
      if (!active || !activeRoot || !item || !conversationId) return false;
      try {
        const result = await apiUpdateStaticFile({
          cId: conversationId,
          files: [
            { name: item.relativePath, operation: 'modify', contents: content },
          ],
          customTargetDir: activeRoot.targetDir,
        });
        if (result.code !== SUCCESS_CODE) throw new Error(result.message);
        await refresh();
        return true;
      } catch (error) {
        message.error(
          error instanceof Error && error.message
            ? error.message
            : dict('PC.Components.LocalFiles.saveFailed'),
        );
        return false;
      }
    },
    [active, activeRoot, conversationId, files, refresh],
  );

  const saveMany = useCallback(
    async (changes: ChangeFileInfo[]) => {
      for (const change of changes) {
        if (!(await saveOne(change.fileId, change.fileContent))) return false;
      }
      return true;
    },
    [saveOne],
  );

  const upload = useCallback(
    async (selectedFiles: File[], relativePaths: string[]) => {
      if (!active || !activeRoot || !conversationId) return;
      await apiUploadFiles({
        files: selectedFiles,
        cId: conversationId,
        filePaths: selectedFiles.map((file, index) =>
          joinPath(currentPath, relativePaths[index] || file.name),
        ),
        customTargetDir: activeRoot.targetDir,
      });
      await refresh();
    },
    [active, activeRoot, conversationId, currentPath, refresh],
  );

  const exportZip = useCallback(async () => {
    if (active && activeRoot && conversationId) {
      await apiDownloadAllFiles(conversationId, activeRoot.targetDir);
    }
  }, [active, activeRoot, conversationId]);

  const search = useCallback(
    async (keyword: string): Promise<FileNode[]> => {
      if (!active || !activeRoot || !conversationId) return [];
      const trimmed = keyword.trim();
      if (!trimmed) return [];
      const toNode = (file: StaticFileInfo): FileNode => ({
        id: localNodeId(activeRoot.id, file.name),
        name: baseName(file.name),
        type: file.isDir ? 'folder' : 'file',
        path: file.name,
        fullPath: file.name,
        parentPath: file.name.split('/').slice(0, -1).join('/') || null,
        children: [],
        dataSourceId: activeRoot.id,
        relativePath: file.name,
        fileProxyUrl: file.fileProxyUrl || '',
        isLink: file.isLink,
      });
      try {
        const result = await apiSearchFiles({
          cId: conversationId,
          kw: trimmed,
          customTargetDir: activeRoot.targetDir,
        });
        if (result.code === SUCCESS_CODE) {
          return (result.data?.files || []).map(toNode);
        }
        throw new Error(result.message);
      } catch {
        // 网关未透传 search-files 或请求失败：退化为当前目录本地过滤
        const lower = trimmed.toLowerCase();
        return files
          .filter((file) => file.name.toLowerCase().includes(lower))
          .map(toNode);
      }
    },
    [active, activeRoot, conversationId, files],
  );

  const selectSearchResult = useCallback((node: FileNode) => {
    const target =
      node.type === 'folder'
        ? node.relativePath || ''
        : (node.relativePath || '').split('/').slice(0, -1).join('/');
    setPendingSelectionId(node.type === 'file' ? node.id : '');
    setCurrentPath(target);
  }, []);

  const clearPendingSelection = useCallback(() => {
    setPendingSelectionId('');
  }, []);

  return {
    enabled,
    active,
    files,
    loading,
    refresh,
    openDirectory,
    rename,
    create,
    remove,
    saveOne,
    saveMany,
    upload,
    exportZip,
    search,
    selectSearchResult,
    pendingSelectionId,
    clearPendingSelection,
    navigation: enabled
      ? {
          conversationId,
          customTargetDir: activeRoot?.targetDir,
          currentSourceId: sourceId,
          currentLabel:
            activeRoot?.label ||
            dict('PC.Components.LocalFiles.workspaceLabel'),
          currentPath,
          roots: roots.map((root) => ({
            id: root.id,
            label: root.label,
            path: root.targetDir,
            available: availability[root.id] !== false,
          })),
          onSelectSource: selectSource,
          onOpenRoots: openRoots,
          onRemoveRoot: removeRoot,
          onNavigate: setCurrentPath,
        }
      : undefined,
  };
}
