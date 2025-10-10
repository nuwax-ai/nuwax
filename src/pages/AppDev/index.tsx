import MonacoEditor from '@/components/WebIDE/MonacoEditor';
import Preview, { PreviewRef } from '@/components/WebIDE/Preview';
import { ERROR_MESSAGES } from '@/constants/appDevConstants';
import { useAppDevChat } from '@/hooks/useAppDevChat';
import { useAppDevFileManagement } from '@/hooks/useAppDevFileManagement';
import { useAppDevServer } from '@/hooks/useAppDevServer';
import { getProjectIdFromUrl } from '@/models/appDev';
import { uploadAndStartProject } from '@/services/appDev';
import { getLanguageFromFile, isImageFile } from '@/utils/appDevUtils';
import {
  CheckOutlined,
  DownOutlined,
  EyeOutlined,
  FileOutlined,
  GlobalOutlined,
  LeftOutlined,
  PlusOutlined,
  ReadOutlined,
  ReloadOutlined,
  RightOutlined,
  SendOutlined,
  StopOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Image,
  Input,
  message,
  Modal,
  Row,
  Segmented,
  Select,
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
import styles from './index.less';

const { Title, Text } = Typography;

/**
 * AppDev页面组件
 * 提供Web集成开发环境功能，包括文件管理、代码编辑和实时预览
 */
const AppDev: React.FC = () => {
  // 使用 AppDev 模型来管理状态
  const appDevModel = useModel('appDevModel');

  const {
    workspace,
    isServiceRunning,
    setIsServiceRunning,
    setActiveFile,
    updateFileContent,
    updateDevServerUrl,
    updateProjectId,
  } = appDevModel;

  // 使用 Modal.confirm 来处理确认对话框
  const [, contextHolder] = Modal.useModal();

  // 组件内部状态
  const [missingProjectId, setMissingProjectId] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [projectName, setProjectName] = useState('');

  // 单文件上传状态
  const [isSingleFileUploadModalVisible, setIsSingleFileUploadModalVisible] =
    useState(false);
  const [singleFileUploadLoading, setSingleFileUploadLoading] = useState(false);
  const [singleFilePath, setSingleFilePath] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // 使用重构后的 hooks
  const fileManagement = useAppDevFileManagement({
    projectId: workspace.projectId,
    onFileSelect: setActiveFile,
    onFileContentChange: updateFileContent,
  });

  const chat = useAppDevChat({
    projectId: workspace.projectId,
  });

  const server = useAppDevServer({
    projectId: workspace.projectId,
    onServerStart: updateDevServerUrl,
    onServerStatusChange: setIsServiceRunning,
  });

  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );

  // 聊天模式状态
  const [chatMode, setChatMode] = useState<'chat' | 'design'>('chat');

  // 文件树折叠状态
  const [isFileTreeCollapsed, setIsFileTreeCollapsed] = useState(false);

  // Preview组件的ref，用于触发刷新
  const previewRef = useRef<PreviewRef>(null);

  /**
   * 从 URL 参数中获取 projectId
   */
  useEffect(() => {
    const urlProjectId = getProjectIdFromUrl();
    console.log('🔍 [AppDev] 从 URL 参数获取 projectId:', urlProjectId);

    if (urlProjectId) {
      updateProjectId(urlProjectId);
      setMissingProjectId(false);
      console.log('✅ [AppDev] 已从 URL 参数设置 projectId:', urlProjectId);
    } else {
      if (!workspace.projectId) {
        setMissingProjectId(true);
        console.warn('⚠️ [AppDev] URL 参数和工作区中都没有 projectId');
      }
    }
  }, []);

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
        if (workspace.projectId && isServiceRunning) {
          console.log('开发服务器重启功能已禁用');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    chat.chatInput,
    chat.sendChat,
    fileManagement.saveFile,
    workspace.projectId,
    isServiceRunning,
  ]);

  /**
   * 处理项目上传
   */
  const handleUploadProject = useCallback(
    async (file: File) => {
      if (!projectName.trim()) {
        message.error('请输入项目名称');
        return;
      }

      try {
        setUploadLoading(true);
        const result = await uploadAndStartProject({ file, projectName });

        if (result?.success && result?.data) {
          const { projectId: newProjectId, devServerUrl } = result.data;

          updateProjectId(newProjectId);
          if (devServerUrl) {
            updateDevServerUrl(devServerUrl);
          }

          message.success('项目上传并启动成功');
          setIsUploadModalVisible(false);
          setProjectName('');
        } else {
          message.warning('项目上传成功，但返回数据格式异常');
        }
      } catch (error) {
        console.error('上传项目失败:', error);
        message.error(error instanceof Error ? error.message : '上传项目失败');
      } finally {
        setUploadLoading(false);
      }
    },
    [projectName, updateProjectId, updateDevServerUrl],
  );

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
    if (!workspace.projectId) {
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
        workspace.projectId,
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
  }, [workspace.projectId, fileManagement, singleFilePath, uploadFile]);

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
   * 处理功能按钮点击
   */
  const handleActionButton = useCallback((action: string) => {
    console.log('执行操作:', action);
    message.info(`执行操作: ${action}`);
  }, []);

  /**
   * 切换消息展开状态
   */
  const toggleMessageExpansion = useCallback((messageId: string) => {
    setExpandedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  /**
   * 渲染聊天消息
   */
  const renderChatMessage = useCallback(
    (message: any) => {
      switch (message.type) {
        case 'ai':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.ai}`}>
                <div className={styles.messageContent}>
                  {message.content
                    ?.split('\n')
                    .map((line: string, index: number) => (
                      <div key={index}>{line}</div>
                    ))}
                </div>
              </div>
              {message.details && (
                <div className={styles.detailsMessage}>
                  <div
                    className={styles.detailsHeader}
                    onClick={() => toggleMessageExpansion(message.id)}
                  >
                    <span className={styles.detailsTitle}>
                      {message.content}
                    </span>
                    <span className={styles.expandIcon}>
                      {expandedMessages.has(message.id) ? '▼' : '▶'}
                    </span>
                  </div>
                  {expandedMessages.has(message.id) && (
                    <div className={styles.detailsContent}>
                      {message.details.map((detail: string, index: number) => (
                        <div key={index} className={styles.detailItem}>
                          {detail}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );

        case 'button':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={styles.buttonMessage}>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleActionButton(message.action || '')}
                  className={styles.actionButton}
                >
                  {message.content}
                </Button>
              </div>
            </div>
          );

        case 'section':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={styles.sectionMessage}>
                <div className={styles.sectionTitle}>{message.title}</div>
                <div className={styles.sectionItems}>
                  {message.items?.map((item: string, index: number) => (
                    <div key={index} className={styles.sectionItem}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );

        case 'thinking':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.thinking}`}>
                <div className={styles.messageContent}>
                  <div className={styles.thinkingIndicator}>💭 思考中...</div>
                  {message.content
                    ?.split('\n')
                    .map((line: string, index: number) => (
                      <div key={index} className={styles.thinkingText}>
                        {line}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          );

        case 'tool_call':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.toolCall}`}>
                <div className={styles.messageContent}>
                  <div className={styles.toolCallIndicator}>🔧</div>
                  <span>{message.content}</span>
                  {message.isStreaming && (
                    <span className={styles.streamingIndicator}>...</span>
                  )}
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    },
    [expandedMessages, toggleMessageExpansion, handleActionButton],
  );

  /**
   * 聊天消息列表（memo化）
   */
  const chatMessagesList = useMemo(() => {
    return chat.chatMessages.map(renderChatMessage);
  }, [chat.chatMessages, renderChatMessage]);

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
      const isSelected =
        fileManagement.fileContentState.selectedFile === node.id;

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
            onClick={() => fileManagement.switchToFile(node.id)}
            style={{ marginLeft: level * 16 }}
          >
            <FileOutlined className={styles.fileIcon} />
            <span className={styles.fileName}>{node.name}</span>
            {node.status && (
              <span className={styles.fileStatus}>{node.status}</span>
            )}
          </div>
        );
      }
    },
    [fileManagement],
  );

  // 清理聊天连接
  useEffect(() => {
    return () => {
      chat.cleanup();
    };
  }, [chat.cleanup]);

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

  // 如果启动失败，显示错误信息
  if (server.startError) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message="开发环境启动失败"
          description={server.startError}
          type="error"
          showIcon
          action={
            <Button onClick={() => window.location.reload()}>重试</Button>
          }
        />
      </div>
    );
  }

  return (
    <>
      {contextHolder}
      <div className={styles.appDev}>
        {/* 顶部头部区域 */}
        <div className={styles.topHeader}>
          <div className={styles.headerLeft}>
            {/* AI助手信息 */}
            <div className={styles.aiInfo}>
              <Avatar
                size={32}
                icon={<UserOutlined />}
                className={styles.aiAvatar}
              />
              <div className={styles.aiTitleText}>
                <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                  人工智能通识教育智能体
                </Title>
                <Text type="secondary" style={{ color: '#64748b' }}>
                  AI General Education Assistant
                </Text>
              </div>
            </div>

            {/* 项目信息 */}
            <div className={styles.projectInfo}>
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>
                {workspace.name || '大模型三部曲'}
              </Title>
              {workspace.projectId && (
                <Text
                  type="secondary"
                  style={{ marginLeft: 8, color: '#64748b' }}
                >
                  项目ID: {workspace.projectId}
                </Text>
              )}
            </div>
          </div>
          <div className={styles.headerRight}>
            <Space>
              {/* 刷新和代码视图 */}
              <div className={styles.navButtons}>
                <Button size="small" className={styles.navButton}>
                  重新加载项目
                </Button>
              </div>

              {/* 状态和操作按钮 */}
              <div className={styles.statusActions}>
                <Button
                  type="primary"
                  size="small"
                  className={styles.statusButton}
                  style={{ background: '#ff6b6b', borderColor: '#ff6b6b' }}
                >
                  有更新未部署
                </Button>
                <Button size="small" danger className={styles.actionButton}>
                  删除
                </Button>
                <Button
                  type="primary"
                  size="small"
                  className={styles.deployButton}
                >
                  部署
                </Button>
              </div>
            </Space>
          </div>
        </div>

        {/* 主布局 - 左右分栏 */}
        <Row gutter={0} className={styles.mainRow}>
          {/* 左侧AI助手面板 */}
          <Col span={8} className={styles.leftPanel}>
            <Card className={styles.chatCard} bordered={false}>
              {/* 聊天模式切换 */}
              <div className={styles.chatModeContainer}>
                <div className={styles.chatModeSwitcher}>
                  <Segmented
                    value={chatMode}
                    onChange={(value) =>
                      setChatMode(value as 'chat' | 'design')
                    }
                    options={[
                      { label: 'Chat', value: 'chat' },
                      { label: 'Design', value: 'design' },
                    ]}
                    className={styles.chatModeSegmented}
                  />
                  <div className={styles.versionSelectorWrapper}>
                    <Select
                      value="v4"
                      size="small"
                      className={styles.versionSelector}
                      dropdownClassName={styles.versionDropdown}
                      options={[
                        { value: 'v1', label: 'v1' },
                        { value: 'v2', label: 'v2' },
                        { value: 'v3', label: 'v3' },
                        { value: 'v4', label: 'v4' },
                        { value: 'v5', label: 'v5' },
                      ]}
                      suffixIcon={<DownOutlined />}
                    />
                  </div>
                </div>
              </div>

              {/* 聊天消息区域 */}
              <div className={styles.chatMessages}>
                {chatMessagesList}
                {chat.isChatLoading && (
                  <div className={`${styles.message} ${styles.ai}`}>
                    <div className={styles.messageContent}>
                      <Spin size="small" /> 正在思考...
                    </div>
                  </div>
                )}
              </div>

              {/* 聊天输入区域 */}
              <div className={styles.chatInput}>
                <Input
                  placeholder="向AI助手提问..."
                  value={chat.chatInput}
                  onChange={(e) => chat.setChatInput(e.target.value)}
                  onPressEnter={chat.sendChat}
                  suffix={
                    <div style={{ display: 'flex', gap: 4 }}>
                      {chat.isChatLoading && (
                        <Button
                          type="text"
                          icon={<StopOutlined />}
                          onClick={chat.cancelChat}
                          title="取消AI任务"
                          className={styles.cancelButton}
                        />
                      )}
                      <Button
                        type="text"
                        icon={<SendOutlined />}
                        onClick={chat.sendChat}
                        disabled={!chat.chatInput.trim() || chat.isChatLoading}
                      />
                    </div>
                  }
                  className={styles.inputField}
                />
                <div className={styles.modelSelector}>
                  <Text type="secondary">deepseek-v3</Text>
                </div>
              </div>
            </Card>
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
              <Row gutter={0} className={styles.contentRow}>
                {/* 文件树侧边栏 */}
                <Col
                  span={isFileTreeCollapsed ? 0 : 6}
                  className={`${styles.fileTreeCol} ${
                    isFileTreeCollapsed ? styles.collapsed : ''
                  }`}
                  style={{ transition: 'all 0.3s ease' }}
                >
                  <Card className={styles.fileTreeCard} bordered={false}>
                    {!isFileTreeCollapsed && (
                      <>
                        {/* 文件树头部按钮 */}
                        <div className={styles.fileTreeHeader}>
                          <Button
                            type="text"
                            className={styles.addButton}
                            onClick={() => setIsUploadModalVisible(true)}
                          >
                            导入项目
                          </Button>
                          <Tooltip title="上传单个文件">
                            <Button
                              type="text"
                              icon={<PlusOutlined />}
                              onClick={() =>
                                setIsSingleFileUploadModalVisible(true)
                              }
                              className={styles.addButton}
                              style={{ marginLeft: 8 }}
                            />
                          </Tooltip>
                        </div>
                        <div className={styles.fileTreeContainer}>
                          {/* 文件树结构 */}
                          <div className={styles.fileTree}>
                            {fileManagement.fileTreeState.data.map(
                              (node: any) => renderFileTreeNode(node),
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </Card>
                </Col>

                {/* 编辑器区域 */}
                <Col
                  span={isFileTreeCollapsed ? 24 : 18}
                  className={styles.editorCol}
                >
                  <div className={styles.editorContainer}>
                    {/* 内容区域 */}
                    <div className={styles.editorContent}>
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
                                {fileManagement.fileContentState.selectedFile}
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
                                  fileManagement.fileContentState.selectedFile
                                }
                                style={{ maxWidth: '100%', maxHeight: '600px' }}
                                fallback={`/api/file-preview/${fileManagement.fileContentState.selectedFile}`}
                              />
                            </div>
                          </div>
                        ) : (
                          <Preview
                            ref={previewRef}
                            devServerUrl={workspace.devServerUrl}
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
                                {fileManagement.findFileNode(
                                  fileManagement.fileContentState.selectedFile,
                                )?.path ||
                                  fileManagement.fileContentState.selectedFile}
                              </span>
                              <span className={styles.fileLanguage}>
                                {getLanguageFromFile(
                                  fileManagement.fileContentState.selectedFile,
                                )}
                              </span>
                              {fileManagement.fileContentState
                                .isLoadingFileContent && <Spin size="small" />}
                            </div>
                            <div className={styles.fileActions}>
                              <Button
                                size="small"
                                type="primary"
                                icon={<CheckOutlined />}
                                onClick={fileManagement.saveFile}
                                loading={
                                  fileManagement.fileContentState.isSavingFile
                                }
                                disabled={
                                  !fileManagement.fileContentState
                                    .isFileModified
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
                                    .isFileModified
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
                                fileManagement.fileContentState.fileContentError
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

                              if (
                                !fileManagement.fileContentState.selectedFile
                              ) {
                                return (
                                  <div className={styles.emptyState}>
                                    <p>请从左侧文件树选择一个文件进行预览</p>
                                  </div>
                                );
                              }

                              const fileNode = fileManagement.findFileNode(
                                fileManagement.fileContentState.selectedFile,
                              );
                              const hasContents =
                                fileNode &&
                                fileNode.content &&
                                fileNode.content.trim() !== '';
                              const isImage = isImageFile(
                                fileManagement.fileContentState.selectedFile,
                              );

                              // 逻辑1: 如果文件有contents，直接在编辑器中显示
                              if (hasContents) {
                                return (
                                  <div className={styles.fileContentDisplay}>
                                    <MonacoEditor
                                      key={
                                        fileManagement.fileContentState
                                          .selectedFile
                                      }
                                      currentFile={{
                                        id: fileManagement.fileContentState
                                          .selectedFile,
                                        name: fileManagement.fileContentState
                                          .selectedFile,
                                        type: 'file',
                                        path: `app/${fileManagement.fileContentState.selectedFile}`,
                                        content: fileNode.content,
                                        lastModified: Date.now(),
                                        children: [],
                                      }}
                                      onContentChange={(fileId, content) => {
                                        fileManagement.updateFileContent(
                                          fileId,
                                          content,
                                        );
                                        updateFileContent(fileId, content);
                                      }}
                                      className={styles.monacoEditor}
                                    />
                                  </div>
                                );
                              }

                              // 逻辑2: 如果是图片文件，使用Image组件渲染
                              if (isImage) {
                                const previewUrl = workspace.devServerUrl
                                  ? `${workspace.devServerUrl}/${fileManagement.fileContentState.selectedFile}`
                                  : `/${fileManagement.fileContentState.selectedFile}`;

                                return (
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
                                        src={previewUrl}
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
                                );
                              }

                              // 逻辑3: 其他情况通过API远程预览或使用现有fileContent
                              if (fileManagement.fileContentState.fileContent) {
                                return (
                                  <div className={styles.fileContentDisplay}>
                                    <MonacoEditor
                                      key={
                                        fileManagement.fileContentState
                                          .selectedFile
                                      }
                                      currentFile={{
                                        id: fileManagement.fileContentState
                                          .selectedFile,
                                        name: fileManagement.fileContentState
                                          .selectedFile,
                                        type: 'file',
                                        path: `app/${fileManagement.fileContentState.selectedFile}`,
                                        content:
                                          fileManagement.fileContentState
                                            .fileContent,
                                        lastModified: Date.now(),
                                        children: [],
                                      }}
                                      onContentChange={(fileId, content) => {
                                        fileManagement.updateFileContent(
                                          fileId,
                                          content,
                                        );
                                        updateFileContent(fileId, content);
                                      }}
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
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        {/* 上传项目模态框 */}
        <Modal
          title="导入项目"
          open={isUploadModalVisible}
          onCancel={() => {
            setIsUploadModalVisible(false);
            setProjectName('');
          }}
          footer={null}
          width={500}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text strong>项目名称：</Text>
              <Input
                placeholder="请输入项目名称"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Text strong>项目文件：</Text>
              <Upload.Dragger
                accept=".zip,.tar.gz,.rar"
                beforeUpload={(file) => {
                  handleUploadProject(file);
                  return false;
                }}
                disabled={uploadLoading}
                style={{ marginTop: 8 }}
              >
                <p className="ant-upload-drag-icon">
                  <UploadOutlined />
                </p>
                <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                <p className="ant-upload-hint">支持 .zip、.tar.gz、.rar 格式</p>
              </Upload.Dragger>
            </div>
          </Space>
        </Modal>

        {/* 单文件上传模态框 */}
        <Modal
          title="上传单个文件"
          open={isSingleFileUploadModalVisible}
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
              <Text>当前项目ID：{workspace.projectId}</Text>
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
      </div>
    </>
  );
};

export default AppDev;
