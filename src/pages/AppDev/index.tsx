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
import {
  bindDataSource,
  buildProject,
  exportProject,
  restartDev,
  uploadAndStartProject,
} from '@/services/appDev';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
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
import { useModel } from 'umi';
import { AppDevHeader, ContentViewer } from './components';
import ChatArea from './components/ChatArea';
import FileTreePanel from './components/FileTreePanel';
import { type PreviewRef } from './components/Preview';
import styles from './index.less';

const { Text } = Typography;

/**
 * AppDev页面组件
 * 提供Web集成开发环境功能，包括文件管理、代码编辑和实时预览
 */
const AppDev: React.FC = () => {
  // 数据源选择状态
  const [selectedDataResourceIds, setSelectedDataResourceIds] = useState<
    DataSourceSelection[]
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

  // 重启服务状态
  const [isRestarting, setIsRestarting] = useState(false);

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
    isChatLoading: false, // 临时设为false，稍后更新
  });

  // 模型选择器
  const modelSelector = useAppDevModelSelector(projectId || '');

  // 使用项目详情 Hook
  const projectInfo = useAppDevProjectInfo(projectId);

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
  });

  const server = useAppDevServer({
    projectId: projectId || '',
    onServerStart: updateDevServerUrl,
    onServerStatusChange: setIsServiceRunning,
  });

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

  // 删除确认对话框状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<any>(null);

  // Preview组件的ref，用于触发刷新
  const previewRef = useRef<PreviewRef>(null);

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
   * 处理重启开发服务器
   */
  const handleRestartDevServer = useCallback(async () => {
    // 检查项目ID是否有效
    if (!hasValidProjectId || !projectId) {
      message.error('项目ID不存在或无效，无法重启服务');
      return;
    }

    try {
      setIsRestarting(true);
      message.loading('正在重启开发服务器...', 0);

      const result = await restartDev(projectId);

      // 关闭加载提示
      message.destroy();

      if (result.success && result.data) {
        // 更新开发服务器URL
        if (result.data.devServerUrl) {
          updateDevServerUrl(result.data.devServerUrl);
          message.success('开发服务器重启成功');
        } else {
          message.warning('重启成功，但未获取到新的服务器地址');
        }
      } else {
        message.error(result.message || '重启开发服务器失败');
      }
    } catch (error: any) {
      message.destroy();
      const errorMessage =
        error?.response?.data?.message || error?.message || '重启失败';
      message.error(`重启失败: ${errorMessage}`);
    } finally {
      setIsRestarting(false);
    }
  }, [hasValidProjectId, projectId, updateDevServerUrl]);

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

          // 刷新项目详情信息以更新数据源列表
          await projectInfo.refreshProjectInfo();

          // 关闭 Created 弹窗
          setIsAddDataResourceModalVisible(false);
        } else {
          const errorMessage = result?.message || '绑定数据源失败';
          throw new Error(errorMessage);
        }
      } catch (error: any) {
        console.error('❌ [AppDev] 绑定数据源失败:', error);
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
          // 开发服务器重启功能已禁用
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

      const result = await uploadAndStartProject({
        file: selectedFile,
        projectId: projectId || undefined,
        projectName: workspace.projectName || '未命名项目',
        // spaceId: 32, //TODO 后续 删除 这个参数
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

  // 页面退出时的资源清理
  useEffect(() => {
    return () => {
      // 清理聊天相关资源
      chat.cleanupAppDevSSE();

      // 清理服务器相关资源
      if (server.stopKeepAlive) {
        server.stopKeepAlive();
      }
    };
  }, [chat.cleanupAppDevSSE, server.stopKeepAlive]);

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
                      {/* 原有的按钮：重启服务、全屏预览、导出项目 */}
                      <Tooltip title="重启开发服务器">
                        <Button
                          size="small"
                          icon={<SyncOutlined />}
                          onClick={handleRestartDevServer}
                          loading={isRestarting}
                          className={styles.headerButton}
                        />
                      </Tooltip>
                      <Tooltip title="全屏预览">
                        <Button
                          size="small"
                          icon={<FullscreenOutlined />}
                          onClick={() => {
                            if (previewRef.current && workspace.devServerUrl) {
                              window.open(
                                `${process.env.BASE_URL}${workspace.devServerUrl}`,
                                '_blank',
                              );
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
                        startError={server.startError}
                        previewRef={previewRef}
                        onContentChange={(fileId, content) => {
                          if (
                            !versionCompare.isComparing &&
                            !chat.isChatLoading
                          ) {
                            fileManagement.updateFileContent(fileId, content);
                            updateFileContent(fileId, content);
                          }
                        }}
                        onSaveFile={fileManagement.saveFile}
                        onCancelEdit={handleCancelEdit}
                        onRefreshFile={() => {
                          // 刷新整个文件树（保持状态，强制刷新）
                          fileManagement.loadFileTree(true, true);

                          // 重新加载当前文件内容
                          if (fileManagement.fileContentState.selectedFile) {
                            fileManagement.switchToFile(
                              fileManagement.fileContentState.selectedFile,
                            );
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
