/** Development-only native file-panel fixture. Start with scripts/acceptance/file-panel-dev.mjs. */
import FileTreePanel from '@/components/business-component/FileTreeGitSourcePanel/FileTreePanel';
import { workspaceRelativePath } from '@/components/business-component/FileTreeGitSourcePanel/utils/workspaceFileList';
import { useFileTreePreviewView } from '@/components/business-component/FileTreePreviewPanel/hooks/useFileTreePreviewView';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  getLocalFileReference,
  useLocalFilesContext,
} from '@/features/client-shell/localFileService';
import { pickLocalWorkspaceDirectory } from '@/features/client-shell/workspaceDirectoryPicker';
import ImportProjectModal from '@/pages/ConversationAgent/ImportProjectModal';
import {
  apiDownloadAllFiles,
  apiGetStaticFileList,
  apiImportProject,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import type { UpdateFileInfo } from '@/types/interfaces/fileTree';
import type { StaticFileInfo } from '@/types/interfaces/vncDesktop';
import { Alert, Button, Modal, Space } from 'antd';
import { useCallback, useEffect, useState } from 'react';

const cId = 999999;
export default function FilePanelNativeDev() {
  const root = new URLSearchParams(window.location.search).get('root') || '';
  useLocalFilesContext({
    cId,
    sandboxId: 'file-panel-native-dev',
    workspacePath: root,
  });
  const [files, setFiles] = useState<StaticFileInfo[]>([]);
  const [error, setError] = useState('');
  const [directory, setDirectory] = useState('');
  const [importing, setImporting] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const reload = useCallback(async () => {
    try {
      const result = await apiGetStaticFileList(cId, {
        recursive: true,
        depth: 8,
      });
      setFiles(result.data.files);
      setError('');
    } catch (reason) {
      setError(String(reason));
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  const update = async (changes: UpdateFileInfo[]) => {
    const result = await apiUpdateStaticFile({ cId, files: changes });
    if (result.code !== SUCCESS_CODE) return false;
    await reload();
    return true;
  };
  const view = useFileTreePreviewView({
    targetId: String(cId),
    originalFiles: files,
    readOnly: false,
    onRefreshFileTree: reload,
    onUploadFiles: async (selected, filePaths) => {
      await apiUploadFiles({ cId, files: selected, filePaths });
      await reload();
    },
    onImportProject: async () => setImportVisible(true),
    isImportingProject: importing,
    onExportProject: async () => {
      await apiDownloadAllFiles(cId, 'file-panel-native-dev');
    },
    onCreateFileNode: (node, name) =>
      update([
        {
          name: `${node.parentPath ? `${node.parentPath}/` : ''}${name}`,
          operation: 'create',
          isDir: node.type === 'folder',
          contents: '',
        },
      ]),
    onRenameFile: (node, name) => {
      const source = workspaceRelativePath(node.id),
        parent = source.split('/').slice(0, -1).join('/');
      return update([
        {
          name: parent ? `${parent}/${name}` : name,
          renameFrom: source,
          operation: 'rename',
          isDir: node.type === 'folder',
          localFile: getLocalFileReference(node, cId),
        },
      ]);
    },
    onDeleteFile: (node) =>
      new Promise((resolve) => {
        Modal.confirm({
          title: `将 ${node.name} 移入系统回收站？`,
          onOk: async () => {
            const done = await update([
              {
                name: workspaceRelativePath(node.id),
                operation: 'delete',
                isDir: node.type === 'folder',
                localFile: getLocalFileReference(node, cId),
              },
            ]);
            resolve(done);
          },
          onCancel: () => resolve(false),
        });
      }),
    onSaveFileContent: (id, content) =>
      update([
        {
          name: workspaceRelativePath(id),
          operation: 'modify',
          contents: content,
        },
      ]),
  });
  return (
    <div
      style={{
        padding: 16,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <Space>
        <strong>Nuwax 文件面板 · 原生调试</strong>
        <span>{root}</span>
        <Button
          onClick={() => {
            void pickLocalWorkspaceDirectory(
              'file-panel-native-dev',
              new AbortController().signal,
            )
              .then((result) =>
                setDirectory(
                  result && !result.canceled ? result.path : '已取消',
                ),
              )
              .catch((reason) => setError(String(reason)));
          }}
        >
          选择本机目录
        </Button>
        <Button
          onClick={() => {
            void reload();
          }}
        >
          刷新文件树
        </Button>
        <span>{directory}</span>
      </Space>
      {error && <Alert type="error" message={error} />}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '360px 1fr',
          flex: 1,
          minHeight: 0,
        }}
      >
        <div style={{ overflow: 'auto', borderRight: '1px solid #ddd' }}>
          <FileTreePanel tree={view.tree} />
        </div>
        <div style={{ overflow: 'auto', padding: 12 }}>
          <Space>
            <Button
              onClick={() =>
                view.preview.filePathHeaderProps.onViewFileTypeChange?.(
                  'preview',
                )
              }
            >
              预览
            </Button>
            <Button
              onClick={() =>
                view.preview.filePathHeaderProps.onViewFileTypeChange?.('code')
              }
            >
              编辑
            </Button>
            <Button
              onClick={() => {
                void view.preview.saveCurrentFile?.();
              }}
            >
              保存
            </Button>
          </Space>
          {view.preview.renderPreviewContent()}
        </div>
      </div>
      <ImportProjectModal
        open={importVisible}
        loading={importing}
        onCancel={() => setImportVisible(false)}
        onConfirm={async (file) => {
          setImporting(true);
          try {
            await apiImportProject({ cId, file });
            setImportVisible(false);
            await reload();
          } finally {
            setImporting(false);
          }
        }}
      />
    </div>
  );
}
