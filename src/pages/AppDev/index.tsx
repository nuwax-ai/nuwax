import Created from '@/components/Created';
import { ERROR_MESSAGES, VERSION_CONSTANTS } from '@/constants/appDevConstants';
import { CREATED_TABS } from '@/constants/common.constants';
import { useAppDevChat } from '@/hooks/useAppDevChat';
import { useAppDevFileManagement } from '@/hooks/useAppDevFileManagement';
import { useAppDevModelSelector } from '@/hooks/useAppDevModelSelector';
import { useAppDevProjectId } from '@/hooks/useAppDevProjectId';
import { useAppDevProjectInfo } from '@/hooks/useAppDevProjectInfo';
import { useAppDevServer } from '@/hooks/useAppDevServer';
import { useAppDevVersionCompare } from '@/hooks/useAppDevVersionCompare';
import { useDataResourceManagement } from '@/hooks/useDataResourceManagement';
import { useRestartDevServer } from '@/hooks/useRestartDevServer';
import {
  bindDataSource,
  buildProject,
  exportProject,
  uploadAndStartProject,
} from '@/services/appDev';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import type { DataSourceSelection } from '@/types/interfaces/appDev';
import {
  DownloadOutlined,
  EyeOutlined,
  FullscreenOutlined,
  ReadOutlined,
  SyncOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Col,
  Input,
  message,
  Modal,
  Row,
  Segmented,
  Space,
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
import { useModel, useParams } from 'umi';
import { AppDevHeader, ContentViewer } from './components';
import ChatArea from './components/ChatArea';
import DevLogViewer from './components/DevLogViewer';
import FileTreePanel from './components/FileTreePanel';
import PageEditModal from './components/PageEditModal';
import { type PreviewRef } from './components/Preview';
import { useAutoErrorHandling } from './hooks/useAutoErrorHandling';
import { useDevLogs } from './hooks/useDevLogs';
import styles from './index.less';

const { Text } = Typography;

/**
 * AppDev页面组件
 * 提供Web集成开发环境功能，包括文件管理、代码编辑和实时预览
 */
const AppDev: React.FC = () => {
  // 获取路由参数
  const params = useParams();
  const spaceId = params.spaceId;

  // 数据源选择状态
  const [selectedDataResourceIds, setSelectedDataResourceIds] = useState<
    DataSourceSelection[]
  >([]);

  // 页面编辑状态
  const [openPageEditVisible, setOpenPageEditVisible] = useState(false);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

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

  // 图片清空方法引用
  const clearUploadedImagesRef = useRef<(() => void) | null>(null);

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

  // 项目导入状态
  const [isProjectUploading, setIsProjectUploading] = useState(false);

  // 使用重构后的 hooks
  const fileManagement = useAppDevFileManagement({
    projectId: projectId || '',
    onFileSelect: setActiveFile,
    onFileContentChange: updateFileContent,
    isChatLoading: false, // 临时设为false，稍后更新
  });

  // 模型选择器
  const modelSelector = useAppDevModelSelector(projectId || '');

  // 使用项目详情 Hook
  const projectInfo = useAppDevProjectInfo(projectId);

  const server = useAppDevServer({
    projectId: projectId || '',
    onServerStart: updateDevServerUrl,
    onServerStatusChange: setIsServiceRunning,
  });

  // Preview组件的ref，用于触发刷新
  const previewRef = useRef<PreviewRef>(null);

  // 使用重启开发服务器 Hook
  const { restartDevServer } = useRestartDevServer({
    projectId: projectId || '',
    server,
    setActiveTab,
    previewRef,
  });

  const chat = useAppDevChat({
    projectId: projectId || '',
    selectedModelId: modelSelector.selectedModelId, // 新增：传递选中的模型ID
    onRefreshFileTree: fileManagement.loadFileTree, // 新增：传递文件树刷新方法
    selectedDataSources: selectedDataResourceIds, // 新增：传递选中的数据源
    onClearDataSourceSelections: () => setSelectedDataResourceIds([]), // 新增：清除选择回调
    onRefreshVersionList: projectInfo.refreshProjectInfo, // 新增：传递刷新版本列表方法
    onClearUploadedImages: () => {
      // 调用 ChatArea 组件传递的图片清空方法
      if (clearUploadedImagesRef.current) {
        clearUploadedImagesRef.current();
      }
    }, // 新增：传递清除上传图片方法
    onRestartDevServer: async () => {
      // 使用重启开发服务器 Hook，Agent 触发时不切换页面
      await restartDevServer({
        shouldSwitchTab: false, // Agent 触发时不切换页面
        delayBeforeRefresh: 500,
        showMessage: false, // Agent 触发时不显示消息
      });
    }, // 新增：Agent 触发时不切换页面
  });

  // 开发服务器日志管理
  const devLogs = useDevLogs(projectId || '', {
    enabled: hasValidProjectId && isServiceRunning,
    pollInterval: 2000,
    maxLogLines: 1000,
  });

  // 自动异常处理
  const autoErrorHandling = useAutoErrorHandling(projectId || '', {
    enabled: hasValidProjectId,
    errorDetectionDelay: 1000,
    maxSendFrequency: 30000,
    showNotification: true,
  });

  useEffect(() => {
    // 初始化处于added状态的组件列表
    if (projectInfo.projectInfoState.projectInfo) {
      const dataSources =
        projectInfo.projectInfoState.projectInfo?.dataSources || [];
      const addComponents = dataSources.map((dataSource) => {
        const type =
          dataSource.type === 'plugin'
            ? AgentComponentTypeEnum.Plugin
            : AgentComponentTypeEnum.Workflow;
        return {
          type: type,
          targetId: dataSource.id,
          status: AgentAddComponentStatusEnum.Added,
        };
      });
      setAddComponents(addComponents);
    }
  }, [projectInfo.projectInfoState?.projectInfo]);

  // 数据资源管理
  const dataResourceManagement = useDataResourceManagement(
    projectInfo.projectInfoState.projectInfo?.dataSources,
  );

  // 获取选中的数据源对象
  const selectedDataSources = useMemo(() => {
    return selectedDataResourceIds;
  }, [selectedDataResourceIds]);

  // 稳定 currentFiles 引用，避免无限循环
  const stableCurrentFiles = useMemo(() => {
    return fileManagement.fileTreeState.data;
  }, [fileManagement.fileTreeState.data]);

  // 版本对比管理
  const versionCompare = useAppDevVersionCompare({
    projectId: projectId || '',
    onVersionSwitchSuccess: () => {
      // 刷新文件树（不保持状态，因为切换版本是全新内容）
      fileManagement.loadFileTree(false);
      // 刷新项目详情
      projectInfo.refreshProjectInfo();
    },
  });

  // 自动异常处理监听
  useEffect(() => {
    // 监听Agent输出结束
    const handleAgentPromptEnd = () => {
      autoErrorHandling.handleAgentPromptEnd(devLogs.logs, chat.sendMessage);
    };

    // 监听文件操作完成
    const handleFileOperationComplete = () => {
      autoErrorHandling.handleFileOperationComplete(
        devLogs.logs,
        chat.sendMessage,
      );
    };

    // 监听预览白屏
    const handlePreviewWhiteScreen = () => {
      autoErrorHandling.handlePreviewWhiteScreen(
        devLogs.logs,
        chat.sendMessage,
      );
    };

    // 这里可以添加事件监听器
    // 例如：监听chat的prompt_end事件
    // chat.onPromptEnd?.(handleAgentPromptEnd);

    return () => {
      // 清理事件监听器
    };
  }, [autoErrorHandling, devLogs.logs, chat.sendMessage]);

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
      const findInNodes = (nodes: any[]): any => {
        for (const node of nodes) {
          if (node.id === fileId) {
            return node;
          }
          if (node.children) {
            const found = findInNodes(node.children);
            if (found) return found;
          }
        }
        return null;
      };

      return findInNodes(versionCompare.versionFiles);
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
        // 版本对比启动失败
      }
    },
    [versionCompare],
  );

  // 聊天模式状态
  const [chatMode, setChatMode] = useState<'chat' | 'code'>('chat');

  // 数据资源相关状态
  const [isAddDataResourceModalVisible, setIsAddDataResourceModalVisible] =
    useState(false);

  // 删除确认对话框状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /**
   * 检查 projectId 状态
   */
  useEffect(() => {
    if (!hasValidProjectId) {
      setMissingProjectId(true);
    } else {
      setMissingProjectId(false);
    }
  }, [projectId, hasValidProjectId]);

  /**
   * 处理项目部署
   */
  const handleDeployProject = useCallback(async () => {
    if (!hasValidProjectId || !projectId) {
      message.error('项目ID不存在或无效，无法部署');
      return;
    }

    try {
      setIsDeploying(true);
      const result = await buildProject(projectId);

      // 检查API响应格式
      if (result?.code === '0000' && result?.data) {
        const { devServerUrl, prodServerUrl } = result.data;
        // 显示部署结果
        Modal.success({
          title: '部署成功',
          content: (
            <div>
              <p>项目已成功构建并发布！</p>
              {prodServerUrl && (
                <p>
                  <a
                    href={`${process.env.BASE_URL}${prodServerUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    点击预览
                  </a>
                </p>
              )}
            </div>
          ),
          width: 500,
        });
      }
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
      return;
    }

    try {
      setIsExporting(true);
      const result = await exportProject(projectId);

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
    } catch (error) {
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
   * 处理重启开发服务器按钮点击（手动触发）
   */
  const handleRestartDevServer = useCallback(async () => {
    // 使用重启开发服务器 Hook，手动触发时切换到预览标签页
    await restartDevServer({
      shouldSwitchTab: true,
      delayBeforeRefresh: 500,
      showMessage: false,
    });
  }, [restartDevServer]);

  /**
   * 处理添加组件（Created 组件回调）
   */
  const handleAddComponent = useCallback(
    async (item: any) => {
      // 检查项目ID是否有效
      if (!hasValidProjectId || !projectId) {
        message.error('项目ID不存在或无效，无法绑定数据源');
        return;
      }

      // 只处理 Plugin 和 Workflow 类型
      if (
        item.targetType !== AgentComponentTypeEnum.Plugin &&
        item.targetType !== AgentComponentTypeEnum.Workflow
      ) {
        message.warning('仅支持绑定插件和工作流类型的数据源');
        return;
      }

      // 组件添加loading状态到列表
      setAddComponents((list) => {
        return [
          ...list,
          {
            type: item.targetType,
            targetId: item.targetId,
            status: AgentAddComponentStatusEnum.Loading,
          },
        ];
      });

      try {
        // 确定数据源类型
        const type =
          item.targetType === AgentComponentTypeEnum.Plugin
            ? 'plugin'
            : 'workflow';

        // 调用绑定数据源 API
        const result = await bindDataSource({
          projectId: Number(projectId),
          type,
          dataSourceId: item.targetId,
        });

        // 检查绑定结果
        if (result?.code === '0000') {
          message.success('数据源绑定成功');

          // 更新处于loading状态的组件列表
          setAddComponents((list) => {
            return list.map((info) => {
              if (
                info.targetId === item.targetId &&
                info.status === AgentAddComponentStatusEnum.Loading
              ) {
                return { ...info, status: AgentAddComponentStatusEnum.Added };
              }
              return info;
            });
          });

          // 刷新项目详情信息以更新数据源列表
          await projectInfo.refreshProjectInfo();

          // 关闭 Created 弹窗
          setIsAddDataResourceModalVisible(false);
        } else {
          // 更新处于loading状态的组件列表
          setAddComponents((list) =>
            list.filter((info) => info.targetId !== item.targetId),
          );
          const errorMessage = result?.message || '绑定数据源失败';
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        const errorMessage =
          error?.message || error?.toString() || '绑定数据源时发生未知错误';
        message.error(errorMessage);
      }
    },
    [hasValidProjectId, projectId, projectInfo],
  );

  /**
   * 处理删除数据资源
   */
  const handleDeleteDataResource = useCallback(
    async (resourceId: string) => {
      try {
        await dataResourceManagement.deleteResource(resourceId);
        setAddComponents((list) =>
          list.filter((info) => info.targetId !== Number(resourceId)),
        );
      } catch (error) {
        // 删除数据资源失败
      }
    },
    [dataResourceManagement],
  );

  /**
   * 键盘快捷键处理
   */
  // useEffect(() => {
  //   const handleKeyDown = (event: KeyboardEvent) => {
  //     // Ctrl/Cmd + Enter 发送聊天消息
  //     if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
  //       if (chat.chatInput.trim()) {
  //         chat.sendChat();
  //       }
  //     }

  //     // Ctrl/Cmd + S 保存文件
  //     if ((event.ctrlKey || event.metaKey) && event.key === 's') {
  //       event.preventDefault();
  //       fileManagement.saveFile();
  //     }

  //     // Ctrl/Cmd + R 重启开发服务器
  //     if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
  //       event.preventDefault();
  //       if (projectId && isServiceRunning && !chat.isChatLoading) {
  //         // 开发服务器重启功能已禁用
  //       }
  //     }

  //     // Ctrl/Cmd + D 部署项目
  //     if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
  //       event.preventDefault();
  //       if (hasValidProjectId && !isDeploying && !chat.isChatLoading) {
  //         handleDeployProject();
  //       }
  //     }
  //   };

  //   document.addEventListener('keydown', handleKeyDown);
  //   return () => document.removeEventListener('keydown', handleKeyDown);
  // }, [
  //   chat.chatInput,
  //   chat.sendChat,
  //   fileManagement.saveFile,
  //   projectId,
  //   isServiceRunning,
  //   isDeploying,
  //   handleDeployProject,
  // ]);

  /**
   * 初始化数据资源
   */
  useEffect(() => {
    if (projectId) {
      dataResourceManagement.fetchResources();
    }
  }, [projectId]); // 移除 dataResourceManagement 依赖，避免无限循环

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
      setIsProjectUploading(true);

      const result = await uploadAndStartProject({
        file: selectedFile,
        projectId: projectId || undefined,
        projectName: workspace.projectName || '未命名项目',
        spaceId: spaceId ? Number(spaceId) : undefined,
      });

      if (result?.success && result?.data) {
        message.success('项目导入成功');
        setIsUploadModalVisible(false);
        setSelectedFile(null);

        // 刷新文件树（不保持状态，因为导入项目是全新内容）
        fileManagement.loadFileTree(false, true);
        // 刷新项目详情(刷新版本列表)
        projectInfo.refreshProjectInfo();

        // 导入项目成功后，调用restart-dev逻辑，与点击重启服务按钮逻辑一致
        setTimeout(async () => {
          try {
            // 使用重启开发服务器 Hook，项目导入后切换到预览标签页
            await restartDevServer({
              shouldSwitchTab: true, // 项目导入后切换到预览标签页
              delayBeforeRefresh: 500,
              showMessage: false,
            });
          } finally {
            setIsProjectUploading(false);
          }
        }, 500);
      } else {
        // message.warning('项目上传成功，但返回数据格式异常');
        setIsProjectUploading(false);
      }
    } catch (error) {
      // message.error(error instanceof Error ? error.message : '上传项目失败');
      setIsProjectUploading(false);
    } finally {
      setUploadLoading(false);
    }
  }, [selectedFile, projectId, workspace.projectName, server, projectInfo]);

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback((file: File) => {
    // 校验文件类型，仅支持 .zip 压缩文件
    const isZip = file.name?.toLowerCase().endsWith('.zip');

    if (!isZip) {
      message.error('仅支持 .zip 压缩文件格式');
      return false;
    }

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
      // 上传单个文件

      const result = await fileManagement.uploadSingleFileToServer(
        uploadFile,
        singleFilePath.trim(),
      );

      if (result) {
        setIsSingleFileUploadModalVisible(false);
        setSingleFilePath('');
        setUploadFile(null);
        // 刷新项目详情(刷新版本列表)
        projectInfo.refreshProjectInfo();
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
    projectInfo,
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

    setDeleteLoading(true);
    try {
      // 删除文件/文件夹
      const success = await fileManagement.deleteFileItem(nodeToDelete.id);

      if (success) {
        message.success(
          `成功删除 ${nodeToDelete.type === 'folder' ? '文件夹' : '文件'}: ${
            nodeToDelete.name
          }`,
        );
        handleRestartDevServer();
        // 刷新项目详情(刷新版本列表)
        projectInfo.refreshProjectInfo();
      }
    } finally {
      setDeleteLoading(false);
      setDeleteModalVisible(false);
      setNodeToDelete(null);
    }
  }, [nodeToDelete, projectId, fileManagement, handleRestartDevServer]);

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

  // 页面退出时的资源清理
  useEffect(() => {
    return () => {
      // 清理聊天相关资源
      if (chat.cleanupAppDevSSE) {
        chat.cleanupAppDevSSE();
      }

      // 清理服务器相关资源
      if (server.stopKeepAlive) {
        server.stopKeepAlive();
      }
    };
  }, []); // 空依赖数组，只在组件卸载时执行

  // 如果缺少 projectId，显示提示信息
  if (missingProjectId) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message="缺少项目ID参数"
          description={
            <div>
              <p>请在 URL 中添加 projectId 参数，例如：</p>
              <code>/space/你的空间ID/app-dev/你的项目ID</code>
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

  /**
   * 确认编辑项目
   */
  const handleConfirmEditProject = () => {
    setOpenPageEditVisible(false);
    projectInfo.refreshProjectInfo();
  };

  return (
    <>
      {contextHolder}
      <div className={styles.appDev}>
        {/* 部署遮罩 - 在部署过程中显示透明遮罩防止用户操作 */}
        {isDeploying && (
          <div className={styles.deployOverlay}>
            <div className={styles.deployOverlayContent}>
              <div className={styles.deploySpinner}>
                <SyncOutlined spin />
              </div>
              <div className={styles.deployText}>
                <div className={styles.deployTitle}>正在部署项目...</div>
                <div className={styles.deploySubtitle}>
                  请稍候，部署完成后将自动关闭
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 顶部头部区域 */}
        <AppDevHeader
          workspace={workspace}
          spaceId={spaceId}
          onEditProject={() => setOpenPageEditVisible(true)}
          onDeployProject={handleDeployProject}
          hasUpdates={projectInfo.hasUpdates}
          lastSaveTime={new Date()}
          isDeploying={isDeploying}
          projectInfo={projectInfo.projectInfoState.projectInfo || undefined}
          getDeployStatusText={projectInfo.getDeployStatusText}
          getDeployStatusColor={projectInfo.getDeployStatusColor}
          isChatLoading={chat.isChatLoading} // 新增：传递聊天加载状态
        />

        {/* 主布局 - 左右分栏 */}
        <Row gutter={0} className={styles.mainRow}>
          {/* 左侧AI助手面板 */}
          <Col className={styles.leftPanel}>
            <ChatArea
              chatMode={chatMode}
              setChatMode={setChatMode}
              chat={chat}
              projectInfo={projectInfo}
              projectId={projectId || ''} // 新增：项目ID
              onVersionSelect={handleVersionSelect}
              selectedDataSources={selectedDataSources} // 新增：选中的数据源
              onUpdateDataSources={setSelectedDataResourceIds} // 新增：更新数据源回调
              fileContentState={fileManagement.fileContentState} // 新增：文件内容状态
              modelSelector={modelSelector} // 新增：模型选择器状态
              onRefreshVersionList={projectInfo.refreshProjectInfo} // 新增：刷新版本列表回调
              onClearUploadedImages={(clearFn) => {
                // 设置图片清空方法到 ref
                clearUploadedImagesRef.current = clearFn;
              }} // 新增：设置图片清空方法回调
              autoHandleError={autoErrorHandling.autoHandleEnabled} // 新增：自动处理异常开关状态
              onAutoHandleErrorChange={autoErrorHandling.setAutoHandleEnabled} // 新增：自动处理异常开关变化回调
            />
          </Col>

          {/* 右侧代码编辑器区域 */}
          <Col className={styles.rightPanel}>
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
                      <Button
                        onClick={versionCompare.cancelCompare}
                        disabled={
                          versionCompare.isSwitching || chat.isChatLoading
                        } // 新增：聊天加载时禁用
                      >
                        取消
                      </Button>
                      <Button
                        type="primary"
                        onClick={versionCompare.confirmVersionSwitch}
                        loading={versionCompare.isSwitching}
                        disabled={chat.isChatLoading} // 新增：聊天加载时禁用
                      >
                        切换 v{versionCompare.targetVersion} 版本
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* 原有的按钮：重启服务、全屏预览、导出项目 */}
                      <Tooltip title="重启开发服务器">
                        <Button
                          type="text"
                          icon={<SyncOutlined />}
                          onClick={handleRestartDevServer}
                          loading={server.isRestarting}
                          disabled={chat.isChatLoading} // 新增：聊天加载时禁用
                        />
                      </Tooltip>
                      <Tooltip title="全屏预览">
                        <Button
                          type="text"
                          icon={<FullscreenOutlined />}
                          onClick={() => {
                            if (previewRef.current && workspace.devServerUrl) {
                              window.open(
                                `${process.env.BASE_URL}${workspace.devServerUrl}`,
                                '_blank',
                              );
                            }
                          }}
                          disabled={chat.isChatLoading} // 新增：聊天加载时禁用
                        />
                      </Tooltip>
                      <Tooltip title="导出项目">
                        <Button
                          type="text"
                          icon={<DownloadOutlined />}
                          onClick={handleExportProject}
                          loading={isExporting}
                          disabled={chat.isChatLoading} // 新增：聊天加载时禁用
                        />
                      </Tooltip>
                    </>
                  )}
                </Space>
              </div>
            </div>
            {/* 主内容区域 */}
            <div className={styles.contentArea}>
              <div className={styles.contentRow}>
                {/* FileTreePanel 组件 */}
                <FileTreePanel
                  files={currentDisplayFiles}
                  isComparing={versionCompare.isComparing}
                  selectedFileId={
                    versionCompare.isComparing
                      ? workspace.activeFile
                      : fileManagement.fileContentState.selectedFile
                  }
                  expandedFolders={fileManagement.fileTreeState.expandedFolders}
                  dataResources={dataResourceManagement.resources}
                  dataResourcesLoading={dataResourceManagement.loading}
                  onFileSelect={(fileId) => {
                    if (versionCompare.isComparing) {
                      updateWorkspace({ activeFile: fileId });
                    } else {
                      fileManagement.switchToFile(fileId);
                      setActiveTab('code');
                    }
                  }}
                  onToggleFolder={fileManagement.toggleFolder}
                  onDeleteFile={handleDeleteClick}
                  onUploadProject={() => setIsUploadModalVisible(true)}
                  onUploadSingleFile={() =>
                    setIsSingleFileUploadModalVisible(true)
                  }
                  onAddDataResource={() =>
                    setIsAddDataResourceModalVisible(true)
                  }
                  onDeleteDataResource={handleDeleteDataResource}
                  selectedDataResourceIds={selectedDataResourceIds}
                  onDataResourceSelectionChange={setSelectedDataResourceIds}
                  workspace={workspace}
                  fileManagement={fileManagement}
                  isChatLoading={chat.isChatLoading}
                  projectId={projectId ? Number(projectId) : undefined}
                />

                {/* 编辑器区域 */}
                <div className={styles.editorCol}>
                  <div className={styles.editorContainer}>
                    {/* 内容区域 */}
                    <div className={styles.editorContent}>
                      <ContentViewer
                        mode={activeTab}
                        isComparing={versionCompare.isComparing}
                        selectedFileId={
                          versionCompare.isComparing
                            ? workspace.activeFile
                            : fileManagement.fileContentState.selectedFile
                        }
                        fileNode={
                          versionCompare.isComparing
                            ? findVersionFileNode(workspace.activeFile)
                            : fileManagement.findFileNode(
                                fileManagement.fileContentState.selectedFile,
                              )
                        }
                        fileContent={
                          fileManagement.fileContentState.fileContent
                        }
                        isLoadingFileContent={
                          fileManagement.fileContentState.isLoadingFileContent
                        }
                        fileContentError={
                          fileManagement.fileContentState.fileContentError
                        }
                        isFileModified={
                          fileManagement.fileContentState.isFileModified
                        }
                        isSavingFile={
                          fileManagement.fileContentState.isSavingFile
                        }
                        devServerUrl={workspace.devServerUrl}
                        isStarting={server.isStarting}
                        isRestarting={server.isRestarting}
                        isProjectUploading={isProjectUploading}
                        serverMessage={server.serverMessage}
                        serverErrorCode={server.serverErrorCode}
                        previewRef={previewRef}
                        onStartDev={server.startServer}
                        onRestartDev={async () => {
                          // 使用重启开发服务器 Hook，不切换标签页
                          await restartDevServer({
                            shouldSwitchTab: false, // 不切换标签页
                            delayBeforeRefresh: 500,
                            showMessage: false,
                          });
                        }}
                        onWhiteScreen={() => {
                          autoErrorHandling.handlePreviewWhiteScreen(
                            devLogs.logs,
                            chat.sendMessage,
                          );
                        }}
                        onContentChange={(fileId, content) => {
                          if (
                            !versionCompare.isComparing &&
                            !chat.isChatLoading
                          ) {
                            fileManagement.updateFileContent(fileId, content);
                            updateFileContent(fileId, content);
                          }
                        }}
                        onSaveFile={() => {
                          fileManagement.saveFile().then((success) => {
                            if (success) {
                              // 刷新项目详情(刷新版本列表)
                              projectInfo.refreshProjectInfo();
                              return true;
                            }
                            return false;
                          });
                        }}
                        onCancelEdit={handleCancelEdit}
                        onRefreshFile={() => {
                          // 刷新整个文件树（保持状态，强制刷新）
                          fileManagement.loadFileTree(true, true);
                          // 重新加载当前文件内容
                          if (fileManagement.fileContentState.selectedFile) {
                            fileManagement.switchToFile(
                              fileManagement.fileContentState.selectedFile,
                            );
                            // 取消编辑
                            handleCancelEdit();
                          }
                        }}
                        findFileNode={fileManagement.findFileNode}
                        isChatLoading={chat.isChatLoading}
                      />
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
              accept=".zip"
              beforeUpload={(file) => handleFileSelect(file)}
              disabled={uploadLoading}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域选择</p>
              <p className="ant-upload-hint">
                仅支持 .zip 压缩文件格式（将更新当前项目）
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
          okButtonProps={{
            danger: true,
            loading: deleteLoading,
            disabled: deleteLoading,
          }}
          cancelButtonProps={{
            disabled: deleteLoading,
          }}
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
          addComponents={addComponents}
          onAdded={handleAddComponent}
          tabs={CREATED_TABS.filter(
            (item) =>
              item.key === AgentComponentTypeEnum.Plugin ||
              item.key === AgentComponentTypeEnum.Workflow,
          )}
        />
      </div>

      {/* 开发服务器日志查看器 */}
      <DevLogViewer
        logs={devLogs.logs}
        errorCount={devLogs.errorCount}
        isLoading={devLogs.isLoading}
        autoScroll={true}
        onClear={devLogs.clearLogs}
        onRefresh={devLogs.refreshLogs}
        visible={hasValidProjectId && isServiceRunning}
      />

      {/* 页面开发项目编辑模态框 */}
      <PageEditModal
        open={openPageEditVisible}
        onCancel={() => setOpenPageEditVisible(false)}
        onConfirm={handleConfirmEditProject}
        projectInfo={projectInfo.projectInfoState.projectInfo}
      />
    </>
  );
};

export default AppDev;
