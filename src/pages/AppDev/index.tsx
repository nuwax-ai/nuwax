import MonacoEditor from '@/components/WebIDE/MonacoEditor';
import Preview, { PreviewRef } from '@/components/WebIDE/Preview';
import { getProjectIdFromUrl, useAppDevStore } from '@/models/appDev';
import {
  getFileContent,
  startDev,
  uploadAndStartProject,
} from '@/services/appDev';
import {
  CodeOutlined,
  DownOutlined,
  FileOutlined,
  GlobalOutlined,
  PlusOutlined,
  ReloadOutlined,
  RightOutlined,
  SendOutlined,
  UploadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
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
import styles from './index.less';

const { Title, Text } = Typography;

/**
 * AppDev页面组件
 * 提供Web集成开发环境功能，包括文件管理、代码编辑和实时预览
 */
const AppDev: React.FC = () => {
  const {
    workspace,
    isServiceRunning,
    setIsServiceRunning,
    setActiveFile,
    updateFileContent,
    updateDevServerUrl,
    updateProjectId,
  } = useAppDevStore();

  const [isStartingDev, setIsStartingDev] = useState(false);
  const [devStartError, setDevStartError] = useState<string | null>(null);
  const [missingProjectId, setMissingProjectId] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [projectName, setProjectName] = useState('');

  // 聊天消息类型定义
  interface ChatMessage {
    id: string;
    type: 'ai' | 'user' | 'button' | 'section';
    content?: string;
    timestamp?: Date;
    action?: string;
    title?: string;
    items?: string[];
    isExpanded?: boolean;
    details?: string[];
  }

  // AI助手聊天相关状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: '我已经将标题的子号调至刀更小的尺寸',
      timestamp: new Date(),
    },
    {
      id: '2',
      type: 'ai',
      content:
        '移动端:从 text-5x1 改为 text-2x1\n桌面端:从 text-7x1 改为 text-4x1\n这样标题会显得更加适中,不会过于突出。',
      timestamp: new Date(),
    },
    {
      id: '3',
      type: 'button',
      content: '背景鲜明一点',
      action: 'makeBackgroundBrighter',
    },
    {
      id: '4',
      type: 'section',
      title: '数据资源',
      items: ['每日销售数据查询', '站内消息发送'],
    },
    {
      id: '5',
      type: 'ai',
      content: '> Made some changes v4',
      isExpanded: true,
      details: [
        '我已经调整了背景使其更加鲜明:',
        '1. 将背景渐变的不透明度从 opacity-50 提升到 opacity-75,使发光效果更明显',
        '2. 将卡片背景从 bg-slate-800 改为 bg-slate-800/90,增加透明度让背景色彩更好地透过',
        '3. 为卡片添加 backdrop-blur-sm 类,创造玻璃态效果',
        '4. 将悬停时的边框透明度从 /50 提升到 /70,使边框更加明显',
        '5. 将描述文字从 text-gray-400 改为 text-gray-300,在更亮的背景下保持良好的可读性',
        '现在三个卡片的背景发光效果会更加鲜明和突出!',
      ],
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(['5']),
  );

  // 文件内容预览相关状态
  const [selectedFile, setSelectedFile] = useState<string>('page.tsx');
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);
  const [fileContentError, setFileContentError] = useState<string | null>(null);

  // 文件夹展开状态
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['app']),
  );

  // 聊天模式状态
  const [chatMode, setChatMode] = useState<'chat' | 'design'>('chat');

  // 文件树数据结构
  const fileTreeData = [
    {
      id: 'app',
      name: 'app',
      type: 'folder',
      children: [
        {
          id: 'globals.css',
          name: 'globals.css',
          type: 'file',
        },
        {
          id: 'layout.tsx',
          name: 'layout.tsx',
          type: 'file',
        },
        {
          id: 'page.tsx',
          name: 'page.tsx',
          type: 'file',
          status: '+6/-6',
        },
        {
          id: 'components',
          name: 'components',
          type: 'folder',
          children: [
            {
              id: 'Button.tsx',
              name: 'Button.tsx',
              type: 'file',
            },
            {
              id: 'Modal.tsx',
              name: 'Modal.tsx',
              type: 'file',
            },
          ],
        },
        {
          id: 'utils',
          name: 'utils',
          type: 'folder',
          children: [
            {
              id: 'helpers.ts',
              name: 'helpers.ts',
              type: 'file',
            },
          ],
        },
      ],
    },
    {
      id: 'public',
      name: 'public',
      type: 'folder',
      children: [
        {
          id: 'favicon.ico',
          name: 'favicon.ico',
          type: 'file',
        },
      ],
    },
    {
      id: 'tailwind.config.ts',
      name: 'tailwind.config.ts',
      type: 'file',
    },
  ];

  // 使用 ref 来跟踪是否已经启动过开发环境，避免重复调用
  const hasStartedDevRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);
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
   * 启动开发环境
   */
  const initializeDevEnvironment = useCallback(async () => {
    if (!workspace.projectId) {
      console.warn('⚠️ [AppDev] 没有项目ID，跳过开发环境启动');
      return;
    }

    // 检查 projectId 是否发生变化
    if (lastProjectIdRef.current !== workspace.projectId) {
      console.log('🔄 [AppDev] 项目ID发生变化，重置启动状态', {
        oldProjectId: lastProjectIdRef.current,
        newProjectId: workspace.projectId,
      });
      hasStartedDevRef.current = false;
      lastProjectIdRef.current = workspace.projectId;
    }

    // 如果已经启动过且 projectId 没有变化，跳过
    if (hasStartedDevRef.current) {
      console.log('⚠️ [AppDev] 开发环境已经启动过，跳过重复启动');
      return;
    }

    try {
      hasStartedDevRef.current = true;
      setIsStartingDev(true);
      setDevStartError(null);
      console.log('🚀 [AppDev] 正在启动开发环境...', {
        projectId: workspace.projectId,
      });

      const response = await startDev(workspace.projectId);
      console.log('✅ [AppDev] 开发环境启动成功:', response);

      if (response?.data?.devServerUrl) {
        console.log(
          '🔗 [AppDev] 存储开发服务器URL:',
          response.data.devServerUrl,
        );
        updateDevServerUrl(response.data.devServerUrl);
        setIsServiceRunning(true);
      }
    } catch (error) {
      console.error('❌ [AppDev] 开发环境启动失败:', error);
      setDevStartError(
        error instanceof Error ? error.message : '启动开发环境失败',
      );
      hasStartedDevRef.current = false;
    } finally {
      setIsStartingDev(false);
    }
  }, [workspace.projectId, updateDevServerUrl, setIsServiceRunning]);

  // 在组件挂载时启动开发环境
  useEffect(() => {
    initializeDevEnvironment();
  }, [initializeDevEnvironment]);

  /**
   * 键盘快捷键处理
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Enter 发送聊天消息
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (chatInput.trim()) {
          // 延迟调用，确保handleChatSend已定义
          setTimeout(() => {
            if (chatInput.trim()) {
              const userMessage: ChatMessage = {
                id: Date.now().toString(),
                type: 'user',
                content: chatInput,
                timestamp: new Date(),
              };
              setChatMessages((prev) => [...prev, userMessage]);
              setChatInput('');
              setIsChatLoading(true);
              // 模拟AI回复
              setTimeout(() => {
                const aiMessage: ChatMessage = {
                  id: (Date.now() + 1).toString(),
                  type: 'ai',
                  content: '我理解您的需求，正在为您优化代码...',
                  timestamp: new Date(),
                };
                setChatMessages((prev) => [...prev, aiMessage]);
                setIsChatLoading(false);
              }, 1000);
            }
          }, 0);
        }
      }

      // Ctrl/Cmd + S 保存文件
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        message.info('文件已自动保存');
      }

      // Ctrl/Cmd + R 重启开发服务器
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        if (workspace.projectId && isServiceRunning) {
          // 延迟调用，确保handleRestartDev已定义
          setTimeout(() => {
            if (workspace.projectId) {
              restartDev(workspace.projectId)
                .then((response) => {
                  console.log('✅ [AppDev] 重启开发服务器成功:', response);
                  if (response?.data?.devServerUrl) {
                    updateDevServerUrl(response.data.devServerUrl);
                  }
                  setIsServiceRunning(true);
                  message.success('开发服务器重启成功');
                })
                .catch((error) => {
                  console.error('重启开发服务器失败:', error);
                  message.error('重启开发服务器失败');
                });
            }
          }, 0);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    chatInput,
    workspace.projectId,
    isServiceRunning,
    updateDevServerUrl,
    setIsServiceRunning,
  ]);

  /**
   * 处理文件选择
   */
  const handleFileSelect = useCallback(
    async (fileId: string) => {
      setActiveFile(fileId);
      setSelectedFile(fileId);

      if (!workspace.projectId) {
        message.warning('请先创建或选择项目');
        return;
      }

      try {
        setIsLoadingFileContent(true);
        setFileContentError(null);

        const response = await getFileContent(workspace.projectId, fileId);
        if (response && typeof response === 'object' && 'data' in response) {
          setFileContent((response as any).data as string);
          message.success(`文件 ${fileId} 加载成功`);
        } else if (typeof response === 'string') {
          setFileContent(response);
          message.success(`文件 ${fileId} 加载成功`);
        } else {
          throw new Error('文件内容为空');
        }
      } catch (error) {
        console.error('❌ [AppDev] 加载文件内容失败:', error);
        setFileContentError(
          `加载文件 ${fileId} 失败: ${
            error instanceof Error ? error.message : '未知错误'
          }`,
        );
        message.error(`加载文件 ${fileId} 失败`);
      } finally {
        setIsLoadingFileContent(false);
      }
    },
    [setActiveFile, workspace.projectId],
  );

  // 在项目ID变化时加载默认文件内容
  useEffect(() => {
    if (workspace.projectId && selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [workspace.projectId, selectedFile, handleFileSelect]);

  /**
   * 处理文件内容更新
   */
  const handleFileContentChange = useCallback(
    (fileId: string, content: string) => {
      updateFileContent(fileId, content);
    },
    [updateFileContent],
  );

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
        const result = await uploadAndStartProject(file, projectName);

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
   * 处理AI助手聊天
   */
  const handleChatSend = useCallback(async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // 模拟AI回复
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: '我理解您的需求，正在为您优化代码...',
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI回复失败:', error);
      message.error('AI回复失败，请重试');
    } finally {
      setIsChatLoading(false);
    }
  }, [chatInput]);

  /**
   * 根据文件扩展名获取语言类型
   */
  const getLanguageFromFile = useCallback((fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx':
        return 'TypeScript React';
      case 'ts':
        return 'TypeScript';
      case 'js':
        return 'JavaScript';
      case 'json':
        return 'JSON';
      case 'css':
        return 'CSS';
      case 'html':
        return 'HTML';
      case 'md':
        return 'Markdown';
      default:
        return 'Text';
    }
  }, []);

  /**
   * 切换文件夹展开状态
   */
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
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
    (message: ChatMessage) => {
      switch (message.type) {
        case 'ai':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.ai}`}>
                <div className={styles.messageContent}>
                  {message.content?.split('\n').map((line, index) => (
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
                      {message.details.map((detail, index) => (
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
                  {message.items?.map((item, index) => (
                    <div key={index} className={styles.sectionItem}>
                      {item}
                    </div>
                  ))}
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
    return chatMessages.map(renderChatMessage);
  }, [chatMessages, renderChatMessage]);

  /**
   * 渲染文件树节点
   */
  const renderFileTreeNode = useCallback(
    (node: any, level: number = 0) => {
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = selectedFile === node.id;

      if (node.type === 'folder') {
        return (
          <div
            key={node.id}
            className={styles.folderItem}
            style={{ marginLeft: level * 16 }}
          >
            <div
              className={styles.folderHeader}
              onClick={() => toggleFolder(node.id)}
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
            onClick={() => handleFileSelect(node.id)}
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
    [expandedFolders, selectedFile, toggleFolder, handleFileSelect],
  );

  // 如果正在启动开发环境，显示加载状态
  if (isStartingDev) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
        <Title level={3} style={{ marginTop: 16 }}>
          正在启动开发环境...
        </Title>
        <Text type="secondary">项目ID: {workspace.projectId}</Text>
      </div>
    );
  }

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
  if (devStartError) {
    return (
      <div className={styles.errorContainer}>
        <Alert
          message="开发环境启动失败"
          description={devStartError}
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
              <Tooltip title="刷新">
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  className={styles.navButton}
                />
              </Tooltip>
              <Tooltip title="代码视图">
                <Button
                  size="small"
                  icon={<CodeOutlined />}
                  className={styles.navButton}
                />
              </Tooltip>
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
                  onChange={(value) => setChatMode(value as 'chat' | 'design')}
                  options={[
                    { label: 'Chat', value: 'chat' },
                    { label: 'Design', value: 'design' },
                  ]}
                  size="small"
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
              {isChatLoading && (
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
                placeholder="Ask a follow-up..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPressEnter={handleChatSend}
                suffix={
                  <Button
                    type="text"
                    icon={<SendOutlined />}
                    onClick={handleChatSend}
                    disabled={!chatInput.trim()}
                  />
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
          {/* 主内容区域 */}
          <div className={styles.contentArea}>
            <Row gutter={0} className={styles.contentRow}>
              {/* 文件树侧边栏 */}
              <Col span={6} className={styles.fileTreeCol}>
                <Card className={styles.fileTreeCard} bordered={false}>
                  <div className={styles.fileTreeHeader}>
                    <Title level={5} style={{ margin: 0, color: '#1e293b' }}>
                      项目文件
                    </Title>
                    <Button
                      type="text"
                      icon={<PlusOutlined />}
                      size="small"
                      className={styles.addButton}
                    />
                  </div>
                  <div className={styles.fileTreeContainer}>
                    {/* 文件树结构 */}
                    <div className={styles.fileTree}>
                      {fileTreeData.map((node) => renderFileTreeNode(node))}
                    </div>
                  </div>
                </Card>
              </Col>

              {/* 编辑器区域 */}
              <Col span={18} className={styles.editorCol}>
                <div className={styles.editorContainer}>
                  {/* 切换器 */}
                  <div className={styles.editorSwitcher}>
                    <Segmented
                      value={activeTab}
                      onChange={(value) =>
                        setActiveTab(value as 'preview' | 'code')
                      }
                      options={[
                        {
                          label: <GlobalOutlined />,
                          value: 'preview',
                        },
                        {
                          label: <CodeOutlined />,
                          value: 'code',
                        },
                      ]}
                      className={styles.segmentedTabs}
                    />
                  </div>

                  {/* 内容区域 */}
                  <div className={styles.editorContent}>
                    {activeTab === 'preview' ? (
                      <Preview
                        ref={previewRef}
                        devServerUrl={workspace.devServerUrl}
                      />
                    ) : (
                      <div className={styles.codeEditorContainer}>
                        {/* 文件路径显示 */}
                        <div className={styles.filePathHeader}>
                          <div className={styles.filePathInfo}>
                            <FileOutlined className={styles.fileIcon} />
                            <span className={styles.filePath}>
                              app/{selectedFile}
                            </span>
                            <span className={styles.fileLanguage}>
                              {getLanguageFromFile(selectedFile)}
                            </span>
                            {isLoadingFileContent && <Spin size="small" />}
                          </div>
                          <div className={styles.fileActions}>
                            <Button
                              size="small"
                              icon={<ReloadOutlined />}
                              onClick={() => handleFileSelect(selectedFile)}
                              loading={isLoadingFileContent}
                            >
                              刷新
                            </Button>
                          </div>
                        </div>

                        {/* 文件内容预览 */}
                        <div className={styles.fileContentPreview}>
                          {isLoadingFileContent ? (
                            <div className={styles.loadingContainer}>
                              <Spin size="large" />
                              <p>正在加载文件内容...</p>
                            </div>
                          ) : fileContentError ? (
                            <div className={styles.errorContainer}>
                              <p>{fileContentError}</p>
                              <Button
                                size="small"
                                onClick={() => handleFileSelect(selectedFile)}
                              >
                                重试
                              </Button>
                            </div>
                          ) : fileContent ? (
                            <div className={styles.fileContentDisplay}>
                              <MonacoEditor
                                currentFile={{
                                  id: selectedFile,
                                  name: selectedFile,
                                  type: 'file',
                                  path: `app/${selectedFile}`,
                                  content: fileContent,
                                  lastModified: Date.now(),
                                  children: [],
                                }}
                                onContentChange={(fileId, content) => {
                                  setFileContent(content);
                                  handleFileContentChange(fileId, content);
                                }}
                                className={styles.monacoEditor}
                              />
                            </div>
                          ) : (
                            <div className={styles.emptyState}>
                              <p>请从左侧文件树选择一个文件进行预览</p>
                            </div>
                          )}
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
    </div>
  );
};

export default AppDev;
