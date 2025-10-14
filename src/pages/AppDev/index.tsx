import Created from '@/components/Created';
import { ERROR_MESSAGES, VERSION_CONSTANTS } from '@/constants/appDevConstants';
import { CREATED_TABS } from '@/constants/common.constants';
import { useAppDevChat } from '@/hooks/useAppDevChat';
import { useAppDevFileManagement } from '@/hooks/useAppDevFileManagement';
import { useAppDevProjectId } from '@/hooks/useAppDevProjectId';
import { useAppDevProjectInfo } from '@/hooks/useAppDevProjectInfo';
import { useAppDevServer } from '@/hooks/useAppDevServer';
import { useAppDevVersionCompare } from '@/hooks/useAppDevVersionCompare';
import { useDataResourceManagement } from '@/hooks/useDataResourceManagement';
import {
  buildProject,
  exportProject,
  uploadAndStartProject,
} from '@/services/appDev';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { getLanguageFromFile, isImageFile } from '@/utils/appDevUtils';
import {
  CheckOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileOutlined,
  GlobalOutlined,
  LeftOutlined,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  RightOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Image,
  Input,
  message,
  Modal,
  Row,
  Segmented,
  Space,
  Spin,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import { AppDevHeader } from './components';
import ChatArea from './components/ChatArea';
import DataResourceList from './components/DataResourceList';
import MonacoEditor from './components/MonacoEditor';
import Preview, { type PreviewRef } from './components/Preview';
import styles from './index.less';

const { Text } = Typography;

/**
 * AppDev页面组件
 * 提供Web集成开发环境功能，包括文件管理、代码编辑和实时预览
 */
const AppDev: React.FC = () => {
  // 使用 AppDev 模型来管理状态
  const appDevModel = useModel('appDev');

  const {
    workspace,
    isServiceRunning,
    setIsServiceRunning,
    setActiveFile,
    updateFileContent,
    updateDevServerUrl,
    // updateProjectId, // 暂时未使用，保留以备将来使用
    updateWorkspace,
  } = appDevModel;

  // 使用简化的 AppDev projectId hook
  const { projectId, hasValidProjectId } = useAppDevProjectId();

  // 使用 Modal.confirm 来处理确认对话框
  const [, contextHolder] = Modal.useModal();

  // 组件内部状态
  const [missingProjectId, setMissingProjectId] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // 部署相关状态
  const [isDeploying, setIsDeploying] = useState(false);

  // 导出项目状态
  const [isExporting, setIsExporting] = useState(false);

  // 单文件上传状态
  const [isSingleFileUploadModalVisible, setIsSingleFileUploadModalVisible] =
    useState(false);
  const [singleFileUploadLoading, setSingleFileUploadLoading] = useState(false);
  const [singleFilePath, setSingleFilePath] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // 使用重构后的 hooks
  const fileManagement = useAppDevFileManagement({
    projectId: projectId || '',
    onFileSelect: setActiveFile,
    onFileContentChange: updateFileContent,
  });

  const chat = useAppDevChat({
    projectId: projectId || '',
    onRefreshFileTree: fileManagement.loadFileTree, // 新增：传递文件树刷新方法
  });

  const server = useAppDevServer({
    projectId: projectId || '',
    onServerStart: updateDevServerUrl,
    onServerStatusChange: setIsServiceRunning,
  });

  // 数据资源管理
  const dataResourceManagement = useDataResourceManagement();

  // 使用项目详情 Hook
  const projectInfo = useAppDevProjectInfo(projectId);

  // 稳定 currentFiles 引用，避免无限循环
  const stableCurrentFiles = useMemo(() => {
    console.log('📁 [AppDev] 当前文件树数据:', {
      fileCount: fileManagement.fileTreeState.data.length,
      files: fileManagement.fileTreeState.data.map((node) => ({
        id: node.id,
        name: node.name,
        type: node.type,
        path: node.path,
        hasContent: !!node.content,
        contentLength: node.content?.length || 0,
      })),
    });

    return fileManagement.fileTreeState.data;
  }, [fileManagement.fileTreeState.data]);

  // 版本对比管理
  const versionCompare = useAppDevVersionCompare({
    projectId: projectId || '',
    onVersionSwitchSuccess: () => {
      // 刷新文件树
      fileManagement.loadFileTree();
      // 刷新项目详情
      projectInfo.refreshProjectInfo();
      message.success('版本切换成功');
    },
  });

  // 获取当前显示的文件树（版本模式或正常模式）
  const currentDisplayFiles = useMemo(() => {
    return versionCompare.isComparing
      ? versionCompare.versionFiles
      : stableCurrentFiles;
  }, [
    versionCompare.isComparing,
    versionCompare.versionFiles,
    stableCurrentFiles,
  ]);

  /**
   * 在版本模式下查找文件节点
   */
  const findVersionFileNode = useCallback(
    (fileId: string): any => {
      console.log('🔍 [AppDev] 查找版本文件节点:', {
        fileId,
        versionFilesCount: versionCompare.versionFiles.length,
        versionFiles: versionCompare.versionFiles.map((node) => ({
          id: node.id,
          name: node.name,
          type: node.type,
          hasContent: !!node.content,
          childrenCount: node.children?.length || 0,
        })),
      });

      const findInNodes = (nodes: any[]): any => {
        for (const node of nodes) {
          console.log('🔍 [AppDev] 检查节点:', {
            nodeId: node.id,
            targetId: fileId,
            match: node.id === fileId,
            hasChildren: !!node.children,
            childrenCount: node.children?.length || 0,
          });

          if (node.id === fileId) {
            console.log('✅ [AppDev] 找到匹配的文件节点:', {
              id: node.id,
              name: node.name,
              hasContent: !!node.content,
              contentLength: node.content?.length || 0,
            });
            return node;
          }
          if (node.children) {
            const found = findInNodes(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      const result = findInNodes(versionCompare.versionFiles);
      console.log(
        '📄 [AppDev] 查找结果:',
        result
          ? {
              id: result.id,
              name: result.name,
              hasContent: !!result.content,
              contentLength: result.content?.length || 0,
            }
          : null,
      );

      return result;
    },
    [versionCompare.versionFiles],
  );

  /**
   * 处理版本选择，直接在页面中显示版本对比
   */
  const handleVersionSelect = useCallback(
    async (version: number) => {
      try {
        // 先切换到代码查看模式
        setActiveTab('code');
        // 然后启动版本对比
        await versionCompare.startVersionCompare(version);
      } catch (error) {
        console.error('版本对比启动失败:', error);
      }
    },
    [versionCompare],
  );

  // 聊天模式状态
  const [chatMode, setChatMode] = useState<'chat' | 'design'>('chat');

  // 错误提示状态
  const [showErrorAlert, setShowErrorAlert] = useState(false);

  // 数据资源相关状态
  const [isAddDataResourceModalVisible, setIsAddDataResourceModalVisible] =
    useState(false);

  // 文件树折叠状态
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);

  // 删除确认对话框状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<any>(null);

  // Preview组件的ref，用于触发刷新
  const previewRef = useRef<PreviewRef>(null);

  /**
   * 检查 projectId 状态
   */
  useEffect(() => {
    console.log('🔍 [AppDev] ProjectId 状态检查:', {
      projectId,
      hasValidProjectId,
    });

    if (!hasValidProjectId) {
      setMissingProjectId(true);
      console.warn('⚠️ [AppDev] 没有有效的 projectId');
    } else {
      setMissingProjectId(false);
      console.log('✅ [AppDev] 已获取有效的 projectId:', projectId);
    }
  }, [projectId, hasValidProjectId]);

  /**
   * 处理项目部署
   */
  const handleDeployProject = useCallback(async () => {
    // 使用简化的 projectId hook
    if (!hasValidProjectId || !projectId) {
      message.error('项目ID不存在或无效，无法部署');
      console.error('❌ [AppDev] 部署失败 - 无效的projectId:', { projectId });
      return;
    }

    try {
      setIsDeploying(true);
      console.log('🚀 [AppDev] 开始部署项目:', projectId);

      const result = await buildProject(projectId);

      console.log('🔍 [AppDev] 部署API响应:', result);

      // 检查API响应格式
      if (result?.code === '0000' && result?.data) {
        const { devServerUrl, prodServerUrl } = result.data;
        // 显示部署结果
        Modal.success({
          title: '部署成功',
          content: (
            <div>
              <p>项目已成功构建并发布！</p>
              {devServerUrl && (
                <p>
                  <strong>开发环境：</strong>
                  <a
                    href={devServerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {devServerUrl}
                  </a>
                </p>
              )}
              {prodServerUrl && (
                <p>
                  <strong>生产环境：</strong>
                  <a
                    href={prodServerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {prodServerUrl}
                  </a>
                </p>
              )}
            </div>
          ),
          width: 500,
        });
      } else {
        // 兼容不同的错误响应格式
        const errorMessage = result?.message || '部署失败';
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ [AppDev] 部署失败:', error);

      // 改进错误处理，兼容不同的错误格式
      const errorMessage =
        error?.message || error?.toString() || '部署过程中发生未知错误';

      // 只使用一个错误提示，避免重复
      Modal.error({
        title: '部署失败',
        content: errorMessage,
      });
    } finally {
      setIsDeploying(false);
    }
  }, [hasValidProjectId, projectId]);

  /**
   * 处理项目导出
   */
  const handleExportProject = useCallback(async () => {
    // 检查项目ID是否有效
    if (!hasValidProjectId || !projectId) {
      message.error('项目ID不存在或无效，无法导出');
      console.error('❌ [AppDev] 导出失败 - 无效的projectId:', { projectId });
      return;
    }

    try {
      setIsExporting(true);
      console.log('📦 [AppDev] 开始导出项目:', projectId);

      const result = await exportProject(projectId);

      console.log('🔍 [AppDev] 导出API响应:', result);

      // 从响应头中获取文件名
      const contentDisposition = result.headers?.['content-disposition'];
      let filename = `project-${projectId}.zip`;

      if (contentDisposition) {
        // 解析 Content-Disposition 头中的文件名
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      // 创建下载链接
      const blob = new Blob([result.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;

      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // 清理URL对象
      window.URL.revokeObjectURL(url);

      message.success('项目导出成功！');
      console.log('✅ [AppDev] 项目导出成功:', filename);
    } catch (error) {
      console.error('❌ [AppDev] 导出项目失败:', error);

      // 改进错误处理，兼容不同的错误格式
      const errorMessage =
        (error as any)?.message ||
        (error as any)?.toString() ||
        '导出过程中发生未知错误';

      message.error(`导出失败: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  }, [hasValidProjectId, projectId]);

  /**
   * 处理添加数据资源
   */
  const handleAddDataResource = useCallback(
    async (data: any) => {
      try {
        await dataResourceManagement.createResource(data);
        setIsAddDataResourceModalVisible(false);
      } catch (error) {
        console.error('添加数据资源失败:', error);
      }
    },
    [dataResourceManagement],
  );

  /**
   * 处理添加组件（Created 组件回调）
   */
  const handleAddComponent = useCallback(
    (item: any) => {
      // 将 Created 组件的选择转换为数据资源格式
      const dataResourceData = {
        name: item.name || '未命名资源',
        description: item.description || '',
        type:
          item.targetType === AgentComponentTypeEnum.Workflow
            ? 'workflow'
            : item.targetType === AgentComponentTypeEnum.Plugin
            ? 'plugin'
            : 'reverse-proxy',
        config: {
          targetId: item.targetId,
          targetType: item.targetType,
          // 根据类型添加特定配置
          ...(item.targetType === AgentComponentTypeEnum.Workflow && {
            filePath: item.config?.filePath || '',
            triggerType: 'manual',
          }),
          ...(item.targetType === AgentComponentTypeEnum.Plugin && {
            packagePath: item.config?.packagePath || '',
            version: item.config?.version || '1.0.0',
            entry: item.config?.entry || 'index.js',
          }),
          ...(item.targetType === AgentComponentTypeEnum.MCP && {
            targetUrl: item.config?.targetUrl || '',
            proxyPath: item.config?.proxyPath || '/',
            timeout: 30,
          }),
        },
        tags: [],
      };

      handleAddDataResource(dataResourceData);
    },
    [dataResourceManagement],
  );

  /**
   * 处理删除数据资源
   */
  const handleDeleteDataResource = useCallback(
    async (resourceId: string) => {
      try {
        await dataResourceManagement.deleteResource(resourceId);
      } catch (error) {
        console.error('删除数据资源失败:', error);
      }
    },
    [dataResourceManagement],
  );

  /**
   * 键盘快捷键处理
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 发送聊天消息
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (chat.chatInput.trim()) {
          chat.sendChat();
        }
      }

      // Ctrl/Cmd + S 保存文件
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        fileManagement.saveFile();
      }

      // Ctrl/Cmd + R 重启开发服务器
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (projectId && isServiceRunning) {
          console.log('开发服务器重启功能已禁用');
        }
      }

      // Ctrl/Cmd + D 部署项目
      if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
        event.preventDefault();
        if (hasValidProjectId && !isDeploying) {
          handleDeployProject();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    chat.chatInput,
    chat.sendChat,
    fileManagement.saveFile,
    projectId,
    isServiceRunning,
    isDeploying,
    handleDeployProject,
  ]);

  /**
   * 初始化数据资源
   */
  useEffect(() => {
    if (projectId) {
      dataResourceManagement.fetchResources();
    }
  }, [projectId, dataResourceManagement]);

  /**
   * 处理项目上传
   */
  const handleUploadProject = useCallback(async () => {
    if (!selectedFile) {
      message.error('请先选择文件');
      return;
    }

    try {
      setUploadLoading(true);

      const result = await uploadAndStartProject({
        file: selectedFile,
        projectId: projectId || undefined,
        projectName: workspace.projectName || '未命名项目',
        spaceId: 32, //TODO 后续 删除 这个参数
      });

      if (result?.success && result?.data) {
        message.success('项目导入成功，正在重新加载页面...');
        setIsUploadModalVisible(false);
        setSelectedFile(null);

        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        message.warning('项目上传成功，但返回数据格式异常');
      }
    } catch (error) {
      console.error('上传项目失败:', error);
      message.error(error instanceof Error ? error.message : '上传项目失败');
    } finally {
      setUploadLoading(false);
    }
  }, [selectedFile, projectId, workspace.projectName]);

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    return false; // 阻止自动上传
  }, []);

  /**
   * 处理单个文件选择
   */
  const handleSelectSingleFile = useCallback(
    (file: File) => {
      setUploadFile(file);
      // 如果用户没有输入路径，使用文件名作为默认路径
      if (!singleFilePath.trim()) {
        setSingleFilePath(file.name);
      }
    },
    [singleFilePath],
  );

  /**
   * 处理单个文件上传
   */
  const handleUploadSingleFile = useCallback(async () => {
    if (!hasValidProjectId) {
      message.error(ERROR_MESSAGES.NO_PROJECT_ID);
      return;
    }

    if (!singleFilePath.trim()) {
      message.error(ERROR_MESSAGES.EMPTY_FILE_PATH);
      return;
    }

    if (!uploadFile) {
      message.error(ERROR_MESSAGES.NO_FILE_SELECTED);
      return;
    }

    try {
      setSingleFileUploadLoading(true);
      console.log(
        '📤 [AppDev] 正在上传单个文件:',
        uploadFile.name,
        '项目ID:',
        projectId,
        '路径:',
        singleFilePath,
      );

      const result = await fileManagement.uploadSingleFileToServer(
        uploadFile,
        singleFilePath.trim(),
      );

      if (result) {
        setIsSingleFileUploadModalVisible(false);
        setSingleFilePath('');
        setUploadFile(null);
      }
    } finally {
      setSingleFileUploadLoading(false);
    }
  }, [
    hasValidProjectId,
    projectId,
    fileManagement,
    singleFilePath,
    uploadFile,
  ]);

  /**
   * 处理单个文件上传取消
   */
  const handleCancelSingleFileUpload = useCallback(() => {
    setIsSingleFileUploadModalVisible(false);
    setSingleFilePath('');
    setUploadFile(null);
  }, []);

  /**
   * 切换文件树折叠状态
   */
  const toggleFileTreeCollapse = useCallback(() => {
    setIsFileTreeCollapsed((prev) => {
      console.log('🔄 [AppDev] 切换文件树状态:', !prev ? '折叠' : '展开');
      return !prev;
    });
  }, []);

  /**
   * 处理删除文件/文件夹
   */
  const handleDeleteClick = useCallback(
    (node: any, event: React.MouseEvent) => {
      event.stopPropagation(); // 阻止事件冒泡
      setNodeToDelete(node);
      setDeleteModalVisible(true);
    },
    [],
  );

  /**
   * 确认删除
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!nodeToDelete || !projectId) return;

    try {
      console.log(
        '🗑️ [AppDev] 删除文件/文件夹:',
        nodeToDelete.name,
        nodeToDelete.path,
      );
      const success = await fileManagement.deleteFileItem(nodeToDelete.id);

      if (success) {
        message.success(
          `成功删除 ${nodeToDelete.type === 'folder' ? '文件夹' : '文件'}: ${
            nodeToDelete.name
          }`,
        );
      } else {
        message.error(`删除失败: ${nodeToDelete.name}`);
      }
    } catch (error) {
      console.error('删除失败:', error);
      message.error(`删除失败: ${nodeToDelete?.name}`);
    } finally {
      setDeleteModalVisible(false);
      setNodeToDelete(null);
    }
  }, [nodeToDelete, projectId, fileManagement]);

  /**
   * 取消删除
   */
  const handleDeleteCancel = useCallback(() => {
    setDeleteModalVisible(false);
    setNodeToDelete(null);
  }, []);

  /**
   * 处理取消编辑
   */
  const handleCancelEdit = useCallback(() => {
    fileManagement.cancelEdit();
  }, [fileManagement]);

  /**
   * 渲染文件树节点
   */
  const renderFileTreeNode = useCallback(
    (node: any, level: number = 0) => {
      const isExpanded = fileManagement.fileTreeState.expandedFolders.has(
        node.id,
      );
      const isSelected = versionCompare.isComparing
        ? workspace.activeFile === node.id
        : fileManagement.fileContentState.selectedFile === node.id;

      if (node.type === 'folder') {
        return (
          <div
            key={node.id}
            className={styles.folderItem}
            style={{ marginLeft: level * 16 }}
          >
            <div
              className={styles.folderHeader}
              onClick={() => fileManagement.toggleFolder(node.id)}
            >
              <RightOutlined
                className={`${styles.folderIcon} ${
                  isExpanded ? styles.expanded : ''
                }`}
              />
              <span className={styles.folderName}>{node.name}</span>
            </div>
            {isExpanded && node.children && (
              <div className={styles.fileList}>
                {node.children.map((child: any) =>
                  renderFileTreeNode(child, level + 1),
                )}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <div
            key={node.id}
            className={`${styles.fileItem} ${
              isSelected ? styles.activeFile : ''
            }`}
            onClick={() => {
              if (versionCompare.isComparing) {
                // 版本模式下，直接设置选中的文件到 workspace.activeFile
                console.log(
                  '🔄 [AppDev] 版本模式下选择文件:',
                  node.id,
                  node.name,
                );
                updateWorkspace({ activeFile: node.id });
              } else {
                // 正常模式下，使用文件管理逻辑并自动切换到代码查看模式
                console.log(
                  '🔄 [AppDev] 正常模式下选择文件:',
                  node.id,
                  node.name,
                );
                fileManagement.switchToFile(node.id);
                // 自动切换到代码查看模式
                setActiveTab('code');
              }
            }}
            style={{ marginLeft: level * 16 }}
          >
            <FileOutlined className={styles.fileIcon} />
            <span className={styles.fileName}>{node.name}</span>

            {/* 正常模式：显示文件状态和删除按钮 */}
            {!versionCompare.isComparing && (
              <>
                {node.status && (
                  <span className={styles.fileStatus}>{node.status}</span>
                )}
                <Button
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  className={styles.deleteButton}
                  onClick={(e) => handleDeleteClick(node, e)}
                  title="删除文件"
                />
              </>
            )}
          </div>
        );
      }
    },
    [fileManagement, handleDeleteClick, versionCompare],
  );

  // 页面退出时的资源清理
  useEffect(() => {
    return () => {
      console.log('🧹 [AppDev] 页面退出，开始清理所有资源...');

      // 清理聊天相关资源
      chat.cleanupAppDevSSE();
      if (chat.stopKeepAliveTimer) {
        chat.stopKeepAliveTimer();
      }

      // 清理服务器相关资源
      if (server.stopKeepAlive) {
        server.stopKeepAlive();
      }

      console.log('✅ [AppDev] 所有资源清理完成');
    };
  }, [chat.cleanupAppDevSSE, chat.stopKeepAliveTimer, server.stopKeepAlive]);

  // 监听服务器启动错误，显示错误提示并自动消失
  // useEffect(() => {
  //   if (server.startError) {
  //     setShowErrorAlert(true);

  //     // 10秒后自动隐藏错误提示
  //     const timer = setTimeout(() => {
  //       setShowErrorAlert(false);
  //     }, 10000);

  //     return () => {
  //       clearTimeout(timer);
  //     };
  //   } else {
  //     setShowErrorAlert(false);
  //   }
  // }, [server.startError]);

  // 如果缺少 projectId，显示提示信息
  if (missingProjectId) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message="缺少项目ID参数"
          description={
            <div>
              <p>请在 URL 中添加 projectId 参数，例如：</p>
              <code>/app-dev?projectId=你的项目ID</code>
            </div>
          }
          type="warning"
          showIcon
          action={
            <Space>
              <Button
                type="primary"
                onClick={() => setIsUploadModalVisible(true)}
                disabled={chat.isChatLoading} // 新增：聊天加载时禁用
              >
                上传项目
              </Button>
              <Button onClick={() => window.history.back()}>返回</Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className={styles.appDev}>
        {/* 错误提示条 */}
        {showErrorAlert && server.startError && (
          <Alert
            message="开发环境启动失败"
            type="error"
            banner={true}
            closable
            afterClose={() => setShowErrorAlert(false)}
          />
        )}

        {/* 顶部头部区域 */}
        <AppDevHeader
          workspace={workspace}
          onReloadProject={() => window.location.reload()}
          onDeleteProject={() => {
            // TODO: 实现删除项目功能
            console.log('删除项目');
          }}
          onDeployProject={handleDeployProject}
          hasUpdates={projectInfo.hasUpdates}
          lastSaveTime={new Date()}
          isDeploying={isDeploying}
          projectInfo={projectInfo.projectInfoState.projectInfo || undefined}
          getDeployStatusText={projectInfo.getDeployStatusText}
          getDeployStatusColor={projectInfo.getDeployStatusColor}
        />

        {/* 主布局 - 左右分栏 */}
        <Row gutter={0} className={styles.mainRow}>
          {/* 左侧AI助手面板 */}
          <Col span={8} className={styles.leftPanel}>
            <ChatArea
              chatMode={chatMode}
              setChatMode={setChatMode}
              chat={chat}
              projectInfo={projectInfo}
              projectId={projectId || ''} // 新增：项目ID
              loadHistorySession={chat.loadHistorySession} // 新增：加载历史会话方法
              onVersionSelect={handleVersionSelect}
            />
          </Col>

          {/* 右侧代码编辑器区域 */}
          <Col span={16} className={styles.rightPanel}>
            {/* 编辑器头部bar */}
            <div className={styles.editorHeader}>
              <div className={styles.editorHeaderLeft}>
                <Segmented
                  value={activeTab}
                  onChange={(value) =>
                    setActiveTab(value as 'preview' | 'code')
                  }
                  disabled={versionCompare.isComparing}
                  options={[
                    {
                      label: <EyeOutlined />,
                      value: 'preview',
                    },
                    {
                      label: <ReadOutlined />,
                      // label: <CodeOutlined />,
                      value: 'code',
                    },
                  ]}
                  className={styles.segmentedTabs}
                />
              </div>
              <div className={styles.editorHeaderRight}>
                <Space size="small">
                  {/* 版本对比模式下显示的按钮 */}
                  {versionCompare.isComparing ? (
                    <>
                      <Alert
                        message={VERSION_CONSTANTS.READ_ONLY_MESSAGE}
                        type="info"
                        showIcon
                        style={{ marginRight: 16 }}
                      />
                      <Text type="secondary" style={{ marginRight: 8 }}>
                        版本 v{versionCompare.targetVersion}
                      </Text>
                      <Button
                        size="small"
                        onClick={versionCompare.cancelCompare}
                        disabled={versionCompare.isSwitching}
                      >
                        取消
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        onClick={versionCompare.confirmVersionSwitch}
                        loading={versionCompare.isSwitching}
                      >
                        确认切换版本
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* 原有的按钮：刷新预览、全屏预览、导出项目 */}
                      <Tooltip title="刷新预览">
                        <Button
                          size="small"
                          icon={<ReloadOutlined />}
                          onClick={() => {
                            if (previewRef.current) {
                              previewRef.current.refresh();
                            }
                          }}
                          className={styles.headerButton}
                        />
                      </Tooltip>
                      <Tooltip title="全屏预览">
                        <Button
                          size="small"
                          icon={<GlobalOutlined />}
                          onClick={() => {
                            if (previewRef.current && workspace.devServerUrl) {
                              window.open(workspace.devServerUrl, '_blank');
                            }
                          }}
                          className={styles.headerButton}
                        />
                      </Tooltip>
                      <Tooltip title="导出项目">
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={handleExportProject}
                          className={styles.headerButton}
                          loading={isExporting}
                        />
                      </Tooltip>
                    </>
                  )}
                </Space>
              </div>
            </div>
            {/* 主内容区域 */}
            <div className={styles.contentArea}>
              {/* 悬浮折叠/展开按钮 - 放在预览区域左下角 */}
              <Tooltip
                title={isFileTreeCollapsed ? '展开文件树' : '收起文件树'}
              >
                <Button
                  type="text"
                  icon={
                    isFileTreeCollapsed ? <RightOutlined /> : <LeftOutlined />
                  }
                  onClick={toggleFileTreeCollapse}
                  className={`${styles.collapseButton} ${
                    isFileTreeCollapsed ? styles.collapsed : styles.expanded
                  }`}
                />
              </Tooltip>
              <div className={styles.contentRow}>
                {/* 文件树侧边栏 / 版本对比文件列表 */}
                <div
                  className={`${styles.fileTreeCol} ${
                    isFileTreeCollapsed ? styles.collapsed : ''
                  }`}
                  style={{ transition: 'all 0.3s ease' }}
                >
                  <Card className={styles.fileTreeCard} bordered={false}>
                    {!isFileTreeCollapsed && (
                      <>
                        {/* 文件树头部按钮 - 仅在非版本对比模式显示 */}
                        {!versionCompare.isComparing && (
                          <div className={styles.fileTreeHeader}>
                            <Button
                              type="text"
                              className={styles.addButton}
                              onClick={() => setIsUploadModalVisible(true)}
                            >
                              导入项目
                            </Button>
                            {/* <Tooltip title="上传单个文件">
                              <Button
                                type="text"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                  setIsSingleFileUploadModalVisible(true)
                                }
                                className={styles.addButton}
                                style={{ marginLeft: 8 }}
                              />
                            </Tooltip> */}
                          </div>
                        )}

                        {/* 文件树容器 */}
                        <div className={styles.fileTreeContainer}>
                          {/* 文件树结构 */}
                          <div className={styles.fileTree}>
                            {currentDisplayFiles.map((node: any) =>
                              renderFileTreeNode(node),
                            )}
                          </div>
                        </div>

                        {/* 数据资源管理 - 固定在底部，仅在非版本对比模式显示 */}
                        {!versionCompare.isComparing && (
                          <div className={styles.dataSourceContainer}>
                            <div className={styles.dataSourceHeader}>
                              <h3>数据资源</h3>
                              <Button
                                type="primary"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={() =>
                                  setIsAddDataResourceModalVisible(true)
                                }
                              >
                                添加
                              </Button>
                            </div>
                            <div className={styles.dataSourceContent}>
                              <DataResourceList
                                resources={dataResourceManagement.resources}
                                loading={dataResourceManagement.loading}
                                onDelete={handleDeleteDataResource}
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                </div>

                {/* 编辑器区域 */}
                <div className={styles.editorCol}>
                  <div className={styles.editorContainer}>
                    {/* 内容区域 */}
                    <div className={styles.editorContent}>
                      {versionCompare.isComparing ? (
                        // 版本对比模式：根据当前标签页显示内容
                        activeTab === 'preview' ? (
                          // 预览标签页：显示禁用提示
                          <div className={styles.emptyState}>
                            <p>{VERSION_CONSTANTS.PREVIEW_DISABLED_MESSAGE}</p>
                            <p>请恢复或切换到最新版本以查看预览</p>
                          </div>
                        ) : (
                          // 代码标签页：显示版本文件内容
                          <>
                            {/* 文件路径显示 */}
                            <div className={styles.filePathHeader}>
                              <div className={styles.filePathInfo}>
                                <FileOutlined className={styles.fileIcon} />
                                <span className={styles.filePath}>
                                  {(() => {
                                    const currentSelectedFileId =
                                      workspace.activeFile;
                                    return (
                                      findVersionFileNode(currentSelectedFileId)
                                        ?.path || currentSelectedFileId
                                    );
                                  })()}
                                </span>
                                <span className={styles.fileLanguage}>
                                  {getLanguageFromFile(
                                    workspace.activeFile || '',
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* 文件内容显示区域 */}
                            <div className={styles.fileContentPreview}>
                              {(() => {
                                const selectedFileId = workspace.activeFile;

                                console.log(
                                  '🔍 [AppDev] 版本模式文件内容显示:',
                                  {
                                    selectedFileId,
                                    workspaceActiveFile: workspace.activeFile,
                                  },
                                );

                                if (!selectedFileId) {
                                  return (
                                    <div className={styles.emptyState}>
                                      <p>请从左侧文件树选择一个文件进行预览</p>
                                    </div>
                                  );
                                }

                                const fileNode =
                                  findVersionFileNode(selectedFileId);
                                const hasContents =
                                  fileNode &&
                                  fileNode.content &&
                                  fileNode.content.trim() !== '';
                                const isImage = isImageFile(selectedFileId);

                                console.log('📄 [AppDev] 版本模式文件节点:', {
                                  selectedFileId,
                                  fileNode: fileNode
                                    ? {
                                        id: fileNode.id,
                                        name: fileNode.name,
                                        hasContent: !!fileNode.content,
                                        contentLength:
                                          fileNode.content?.length || 0,
                                      }
                                    : null,
                                  hasContents,
                                  isImage,
                                });

                                // 逻辑1: 如果文件有contents，直接在编辑器中显示
                                if (hasContents) {
                                  return (
                                    <div className={styles.fileContentDisplay}>
                                      <MonacoEditor
                                        key={selectedFileId}
                                        currentFile={{
                                          id: selectedFileId,
                                          name:
                                            selectedFileId.split('/').pop() ||
                                            selectedFileId,
                                          type: 'file',
                                          path: `app/${selectedFileId}`,
                                          content: fileNode.content,
                                          lastModified: Date.now(),
                                          children: [],
                                        }}
                                        onContentChange={() => {
                                          // 版本模式下不允许编辑
                                        }}
                                        readOnly={true}
                                        className={styles.monacoEditor}
                                      />
                                    </div>
                                  );
                                }

                                // 逻辑2: 如果是图片文件，使用Image组件渲染
                                if (isImage) {
                                  const previewUrl = workspace.devServerUrl
                                    ? `${workspace.devServerUrl}/${selectedFileId}`
                                    : `/${selectedFileId}`;

                                  return (
                                    <div
                                      className={styles.imagePreviewContainer}
                                    >
                                      <div
                                        className={styles.imagePreviewHeader}
                                      >
                                        <span>图片预览: {selectedFileId}</span>
                                      </div>
                                      <div
                                        className={styles.imagePreviewContent}
                                      >
                                        <Image
                                          src={previewUrl}
                                          alt={selectedFileId}
                                          style={{
                                            maxWidth: '100%',
                                            maxHeight: '600px',
                                          }}
                                          fallback={`/api/file-preview/${selectedFileId}`}
                                        />
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div className={styles.emptyState}>
                                    <p>无法预览此文件类型: {selectedFileId}</p>
                                  </div>
                                );
                              })()}
                            </div>
                          </>
                        )
                      ) : (
                        // 正常模式：原有的预览和代码编辑器
                        <>
                          {activeTab === 'preview' ? (
                            // 预览标签页：如果是图片文件，显示图片组件；否则显示Preview组件
                            fileManagement.fileContentState.selectedFile &&
                            isImageFile(
                              fileManagement.fileContentState.selectedFile,
                            ) ? (
                              <div className={styles.imagePreviewContainer}>
                                <div className={styles.imagePreviewHeader}>
                                  <span>
                                    图片预览:{' '}
                                    {
                                      fileManagement.fileContentState
                                        .selectedFile
                                    }
                                  </span>
                                  <Button
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={() => {
                                      if (previewRef.current) {
                                        previewRef.current.refresh();
                                      }
                                    }}
                                  >
                                    刷新
                                  </Button>
                                </div>
                                <div
                                  className={styles.imagePreviewContent}
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minHeight: '400px',
                                  }}
                                >
                                  <Image
                                    src={
                                      workspace.devServerUrl
                                        ? `${workspace.devServerUrl}/${fileManagement.fileContentState.selectedFile}`
                                        : `/${fileManagement.fileContentState.selectedFile}`
                                    }
                                    alt={
                                      fileManagement.fileContentState
                                        .selectedFile
                                    }
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: '600px',
                                    }}
                                    fallback={`/api/file-preview/${fileManagement.fileContentState.selectedFile}`}
                                  />
                                </div>
                              </div>
                            ) : (
                              <Preview
                                ref={previewRef}
                                devServerUrl={`${process.env.BASE_URL}${workspace.devServerUrl}`}
                                isStarting={server.isStarting}
                                startError={server.startError}
                              />
                            )
                          ) : (
                            <div className={styles.codeEditorContainer}>
                              {/* 文件路径显示 */}
                              <div className={styles.filePathHeader}>
                                <div className={styles.filePathInfo}>
                                  <FileOutlined className={styles.fileIcon} />
                                  <span className={styles.filePath}>
                                    {(() => {
                                      const currentSelectedFileId =
                                        versionCompare.isComparing
                                          ? workspace.activeFile
                                          : fileManagement.fileContentState
                                              .selectedFile;
                                      return versionCompare.isComparing
                                        ? findVersionFileNode(
                                            currentSelectedFileId,
                                          )?.path || currentSelectedFileId
                                        : fileManagement.findFileNode(
                                            currentSelectedFileId,
                                          )?.path || currentSelectedFileId;
                                    })()}
                                  </span>
                                  <span className={styles.fileLanguage}>
                                    {getLanguageFromFile(
                                      versionCompare.isComparing
                                        ? workspace.activeFile
                                        : fileManagement.fileContentState
                                            .selectedFile,
                                    )}
                                  </span>
                                  {fileManagement.fileContentState
                                    .isLoadingFileContent && (
                                    <Spin size="small" />
                                  )}
                                </div>
                                <div className={styles.fileActions}>
                                  <Button
                                    size="small"
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={fileManagement.saveFile}
                                    loading={
                                      fileManagement.fileContentState
                                        .isSavingFile
                                    }
                                    disabled={
                                      !fileManagement.fileContentState
                                        .isFileModified ||
                                      versionCompare.isComparing
                                    }
                                    style={{ marginRight: 8 }}
                                  >
                                    保存
                                  </Button>
                                  <Button
                                    size="small"
                                    onClick={handleCancelEdit}
                                    disabled={
                                      !fileManagement.fileContentState
                                        .isFileModified ||
                                      versionCompare.isComparing
                                    }
                                    style={{ marginRight: 8 }}
                                  >
                                    取消
                                  </Button>
                                  <Button
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={() =>
                                      fileManagement.switchToFile(
                                        fileManagement.fileContentState
                                          .selectedFile,
                                      )
                                    }
                                    loading={
                                      fileManagement.fileContentState
                                        .isLoadingFileContent
                                    }
                                  >
                                    刷新
                                  </Button>
                                </div>
                              </div>

                              {/* 文件内容预览 */}
                              <div className={styles.fileContentPreview}>
                                {(() => {
                                  if (
                                    fileManagement.fileContentState
                                      .isLoadingFileContent
                                  ) {
                                    return (
                                      <div className={styles.loadingContainer}>
                                        <Spin size="large" />
                                        <p>正在加载文件内容...</p>
                                      </div>
                                    );
                                  }

                                  if (
                                    fileManagement.fileContentState
                                      .fileContentError
                                  ) {
                                    return (
                                      <div className={styles.errorContainer}>
                                        <p>
                                          {
                                            fileManagement.fileContentState
                                              .fileContentError
                                          }
                                        </p>
                                        <Button
                                          size="small"
                                          onClick={() =>
                                            fileManagement.switchToFile(
                                              fileManagement.fileContentState
                                                .selectedFile,
                                            )
                                          }
                                        >
                                          重试
                                        </Button>
                                      </div>
                                    );
                                  }

                                  const selectedFileId =
                                    versionCompare.isComparing
                                      ? workspace.activeFile
                                      : fileManagement.fileContentState
                                          .selectedFile;

                                  console.log('🔍 [AppDev] 文件内容显示调试:', {
                                    selectedFileId,
                                    isComparing: versionCompare.isComparing,
                                    workspaceActiveFile: workspace.activeFile,
                                    fileManagementSelectedFile:
                                      fileManagement.fileContentState
                                        .selectedFile,
                                    versionFilesCount:
                                      versionCompare.versionFiles.length,
                                  });

                                  if (!selectedFileId) {
                                    console.log('❌ [AppDev] 没有选中文件');
                                    return (
                                      <div className={styles.emptyState}>
                                        <p>
                                          请从左侧文件树选择一个文件进行预览
                                        </p>
                                      </div>
                                    );
                                  }

                                  const fileNode = versionCompare.isComparing
                                    ? findVersionFileNode(selectedFileId)
                                    : fileManagement.findFileNode(
                                        selectedFileId,
                                      );

                                  console.log('📄 [AppDev] 文件节点查找结果:', {
                                    selectedFileId,
                                    fileNode: fileNode
                                      ? {
                                          id: fileNode.id,
                                          name: fileNode.name,
                                          hasContent: !!fileNode.content,
                                          contentLength:
                                            fileNode.content?.length || 0,
                                          contentPreview:
                                            fileNode.content?.substring(
                                              0,
                                              100,
                                            ) + '...',
                                        }
                                      : null,
                                    isComparing: versionCompare.isComparing,
                                  });

                                  const hasContents =
                                    fileNode &&
                                    fileNode.content &&
                                    fileNode.content.trim() !== '';
                                  const isImage = isImageFile(selectedFileId);

                                  console.log('📊 [AppDev] 文件内容判断:', {
                                    hasContents,
                                    isImage,
                                    contentLength:
                                      fileNode?.content?.length || 0,
                                  });

                                  // 逻辑1: 如果文件有contents，直接在编辑器中显示
                                  if (hasContents) {
                                    return (
                                      <div
                                        className={styles.fileContentDisplay}
                                      >
                                        <MonacoEditor
                                          key={selectedFileId}
                                          currentFile={{
                                            id: selectedFileId,
                                            name:
                                              selectedFileId.split('/').pop() ||
                                              selectedFileId,
                                            type: 'file',
                                            path: `app/${selectedFileId}`,
                                            content: fileNode.content,
                                            lastModified: Date.now(),
                                            children: [],
                                          }}
                                          onContentChange={(
                                            fileId,
                                            content,
                                          ) => {
                                            if (!versionCompare.isComparing) {
                                              fileManagement.updateFileContent(
                                                fileId,
                                                content,
                                              );
                                              updateFileContent(
                                                fileId,
                                                content,
                                              );
                                            }
                                          }}
                                          readOnly={versionCompare.isComparing}
                                          className={styles.monacoEditor}
                                        />
                                      </div>
                                    );
                                  }

                                  // 逻辑2: 如果是图片文件，使用Image组件渲染
                                  if (isImage) {
                                    const previewUrl = workspace.devServerUrl
                                      ? `${workspace.devServerUrl}/${selectedFileId}`
                                      : `/${selectedFileId}`;

                                    return (
                                      <div
                                        className={styles.imagePreviewContainer}
                                      >
                                        <div
                                          className={styles.imagePreviewHeader}
                                        >
                                          <span>
                                            图片预览: {selectedFileId}
                                          </span>
                                          <Button
                                            size="small"
                                            icon={<ReloadOutlined />}
                                            onClick={() => {
                                              if (previewRef.current) {
                                                previewRef.current.refresh();
                                              }
                                            }}
                                          >
                                            刷新
                                          </Button>
                                        </div>
                                        <div
                                          className={styles.imagePreviewContent}
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            minHeight: '400px',
                                          }}
                                        >
                                          <Image
                                            src={previewUrl}
                                            alt={selectedFileId}
                                            style={{
                                              maxWidth: '100%',
                                              maxHeight: '600px',
                                            }}
                                            fallback={`/api/file-preview/${selectedFileId}`}
                                          />
                                        </div>
                                      </div>
                                    );
                                  }

                                  // 逻辑3: 其他情况通过API远程预览或使用现有fileContent
                                  if (
                                    fileManagement.fileContentState
                                      .fileContent ||
                                    (versionCompare.isComparing &&
                                      fileNode &&
                                      fileNode.content)
                                  ) {
                                    return (
                                      <div
                                        className={styles.fileContentDisplay}
                                      >
                                        <MonacoEditor
                                          key={selectedFileId}
                                          currentFile={{
                                            id: selectedFileId,
                                            name:
                                              selectedFileId.split('/').pop() ||
                                              selectedFileId,
                                            type: 'file',
                                            path: `app/${selectedFileId}`,
                                            content:
                                              versionCompare.isComparing &&
                                              fileNode
                                                ? fileNode.content
                                                : fileManagement
                                                    .fileContentState
                                                    .fileContent,
                                            lastModified: Date.now(),
                                            children: [],
                                          }}
                                          onContentChange={(
                                            fileId,
                                            content,
                                          ) => {
                                            if (!versionCompare.isComparing) {
                                              fileManagement.updateFileContent(
                                                fileId,
                                                content,
                                              );
                                              updateFileContent(
                                                fileId,
                                                content,
                                              );
                                            }
                                          }}
                                          readOnly={versionCompare.isComparing}
                                          className={styles.monacoEditor}
                                        />
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className={styles.emptyState}>
                                      <p>
                                        无法预览此文件类型:{' '}
                                        {
                                          fileManagement.fileContentState
                                            .selectedFile
                                        }
                                      </p>
                                      <Button
                                        size="small"
                                        onClick={() =>
                                          fileManagement.switchToFile(
                                            fileManagement.fileContentState
                                              .selectedFile,
                                          )
                                        }
                                      >
                                        重新加载
                                      </Button>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>

        {/* 上传项目模态框 */}
        <Modal
          title="导入项目"
          open={isUploadModalVisible && !chat.isChatLoading} // 新增：聊天加载时禁用
          onCancel={() => {
            setIsUploadModalVisible(false);
            setSelectedFile(null);
          }}
          footer={[
            <Button
              key="cancel"
              onClick={() => {
                setIsUploadModalVisible(false);
                setSelectedFile(null);
              }}
            >
              取消
            </Button>,
            <Button
              key="confirm"
              type="primary"
              loading={uploadLoading}
              onClick={handleUploadProject}
              disabled={!selectedFile || uploadLoading}
            >
              确认导入
            </Button>,
          ]}
          width={500}
        >
          <div>
            <Upload.Dragger
              accept=".zip,.tar.gz,.rar"
              beforeUpload={(file) => handleFileSelect(file)}
              disabled={uploadLoading}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域选择</p>
              <p className="ant-upload-hint">
                支持 .zip、.tar.gz、.rar 格式（将更新当前项目）
              </p>
            </Upload.Dragger>
            {selectedFile && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 6,
                }}
              >
                <Text strong>已选择文件：</Text>
                <br />
                <Text>{selectedFile.name}</Text>
                <br />
                <Text type="secondary">
                  文件大小：{(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Text>
              </div>
            )}
          </div>
        </Modal>

        {/* 单文件上传模态框 */}
        <Modal
          title="上传单个文件"
          open={isSingleFileUploadModalVisible && !chat.isChatLoading} // 新增：聊天加载时禁用
          onCancel={handleCancelSingleFileUpload}
          footer={[
            <Button key="cancel" onClick={handleCancelSingleFileUpload}>
              取消
            </Button>,
            <Button
              key="submit"
              type="primary"
              loading={singleFileUploadLoading}
              onClick={handleUploadSingleFile}
              disabled={!uploadFile || !singleFilePath.trim()}
            >
              上传
            </Button>,
          ]}
          width={500}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text>当前项目ID：{projectId || '未设置'}</Text>
            </div>
            <div>
              <Text strong>文件路径：</Text>
              <div style={{ marginTop: 4, fontSize: '12px', color: '#666' }}>
                请输入文件路径（带文件名和后缀），例如：src/components/NewComponent.tsx
              </div>
              <Input
                placeholder="如：src/components/NewComponent.tsx"
                value={singleFilePath}
                onChange={(e) => setSingleFilePath(e.target.value)}
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>选择文件：</Text>
              <Upload.Dragger
                beforeUpload={(file) => {
                  handleSelectSingleFile(file);
                  return false;
                }}
                disabled={singleFileUploadLoading}
                style={{ marginTop: 8 }}
                showUploadList={false}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域选择</p>
                <p className="ant-upload-hint">
                  支持任意文件格式，文件将被添加到指定路径
                </p>
              </Upload.Dragger>
              {uploadFile && (
                <div style={{ marginTop: 8 }}>
                  <Alert
                    message={`已选择文件: ${uploadFile.name}`}
                    type="success"
                    showIcon
                    action={
                      <Button
                        type="text"
                        size="small"
                        onClick={() => setUploadFile(null)}
                      >
                        清除
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </Space>
        </Modal>

        {/* 删除确认对话框 */}
        <Modal
          title="确认删除"
          open={deleteModalVisible}
          onOk={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          okText="删除"
          cancelText="取消"
          okButtonProps={{ danger: true }}
        >
          <p>
            确定要删除 {nodeToDelete?.type === 'folder' ? '文件夹' : '文件'}{' '}
            &quot;
            {nodeToDelete?.name}&quot; 吗？
          </p>
          {nodeToDelete?.type === 'folder' && (
            <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
              注意：删除文件夹将同时删除其内部的所有文件和子文件夹，此操作不可恢复！
            </p>
          )}
        </Modal>

        {/* 数据资源添加弹窗 - 使用 Created 组件 */}
        <Created
          open={isAddDataResourceModalVisible}
          onCancel={() => setIsAddDataResourceModalVisible(false)}
          checkTag={AgentComponentTypeEnum.Plugin}
          onAdded={handleAddComponent}
          tabs={CREATED_TABS.filter(
            (item) =>
              item.key === AgentComponentTypeEnum.Plugin ||
              item.key === AgentComponentTypeEnum.Workflow,
          )}
        />
      </div>
    </>
  );
};

export default AppDev;
