import MonacoEditor from '@/components/WebIDE/MonacoEditor';
import Preview, { PreviewRef } from '@/components/WebIDE/Preview';
import { getProjectIdFromUrl, useAppDevStore } from '@/models/appDev';
import {
  cancelAgentTask,
  getFileContent,
  getProjectContent,
  keepAlive,
  sendChatMessage,
  startDev,
  submitFiles,
  uploadAndStartProject,
} from '@/services/appDev';
import type {
  AgentMessageData,
  AgentThoughtData,
  UnifiedSessionMessage,
} from '@/types/interfaces/appDev';
import { createSSEManager, type SSEManager } from '@/utils/sseManager';
import {
  DownOutlined,
  EyeOutlined,
  FileOutlined,
  GlobalOutlined,
  LeftOutlined,
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
    type: 'ai' | 'user' | 'button' | 'section' | 'thinking' | 'tool_call';
    content?: string;
    timestamp?: Date;
    action?: string;
    title?: string;
    items?: string[];
    isExpanded?: boolean;
    details?: string[];
    sessionId?: string;
    isStreaming?: boolean;
  }

  // AI助手聊天相关状态
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content:
        '你好！我是AI助手，可以帮你进行代码开发、问题解答等。有什么可以帮助你的吗？',
      timestamp: new Date(),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sseManager, setSseManager] = useState<SSEManager | null>(null);

  /**
   * 处理SSE消息
   */
  const handleSSEMessage = useCallback((message: UnifiedSessionMessage) => {
    switch (message.subType) {
      case 'agent_thought_chunk': {
        // 处理AI思考过程
        const thoughtData = message.data as AgentThoughtData;
        const thinkingMessage: ChatMessage = {
          id: `thinking_${Date.now()}`,
          type: 'thinking',
          content: `思考中: ${thoughtData.thinking}`,
          timestamp: new Date(),
          sessionId: message.sessionId,
        };
        setChatMessages((prev) => [...prev, thinkingMessage]);
        break;
      }

      case 'agent_message_chunk': {
        // 处理AI回复
        const messageData = message.data as AgentMessageData;
        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: messageData.content.text,
          timestamp: new Date(),
          sessionId: message.sessionId,
          isStreaming: !messageData.is_final,
        };

        if (messageData.is_final) {
          setIsChatLoading(false);
        }

        setChatMessages((prev) => {
          // 查找是否已有正在流式传输的消息
          const existingStreamingIndex = prev.findIndex(
            (msg) => msg.sessionId === message.sessionId && msg.isStreaming,
          );

          if (existingStreamingIndex >= 0) {
            // 更新现有消息
            const updated = [...prev];
            updated[existingStreamingIndex] = aiMessage;
            return updated;
          } else {
            // 添加新消息
            return [...prev, aiMessage];
          }
        });
        break;
      }

      case 'tool_call': {
        // 处理工具调用
        const toolCallData = message.data;
        const toolMessage: ChatMessage = {
          id: `tool_${Date.now()}`,
          type: 'tool_call',
          content: `🔧 正在执行: ${toolCallData.tool_call.name}`,
          timestamp: new Date(),
          sessionId: message.sessionId,
        };
        setChatMessages((prev) => [...prev, toolMessage]);
        break;
      }

      case 'prompt_end':
        // 处理会话结束
        setIsChatLoading(false);
        break;
    }
  }, []);

  /**
   * 初始化SSE连接管理器
   */
  const initializeSSEManager = useCallback(
    (sessionId: string) => {
      // 清理之前的连接
      if (sseManager) {
        sseManager.destroy();
      }

      const newSseManager = createSSEManager({
        baseUrl: 'http://localhost:8000', // 根据实际情况调整
        sessionId,
        onMessage: (message: UnifiedSessionMessage) => {
          console.log('📨 [SSE] 收到消息:', message);
          handleSSEMessage(message);
        },
        onError: (error) => {
          console.error('❌ [SSE] 连接错误:', error);
          message.error('AI助手连接失败');
        },
        onOpen: () => {
          console.log('🔌 [SSE] 连接已建立');
        },
        onClose: () => {
          console.log('🔌 [SSE] 连接已关闭');
        },
      });

      setSseManager(newSseManager);
      newSseManager.connect();

      return newSseManager;
    },
    [sseManager, handleSSEMessage],
  );

  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(
    new Set(),
  );

  // 文件内容预览相关状态
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);
  const [fileContentError, setFileContentError] = useState<string | null>(null);

  // 文件夹展开状态
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  // 聊天模式状态
  const [chatMode, setChatMode] = useState<'chat' | 'design'>('chat');

  // 文件树数据结构
  const [fileTreeData, setFileTreeData] = useState<any[]>([]);

  // 文件树折叠状态
  const [, setIsFileTreeCollapsed] = useState(false);

  // 使用 ref 来跟踪是否已经启动过开发环境，避免重复调用
  const hasStartedDevRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);
  // Preview组件的ref，用于触发刷新
  const previewRef = useRef<PreviewRef>(null);
  // 保活轮询定时器
  const keepAliveTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 跟踪文件树是否已经加载过，避免重复加载
  const lastLoadedProjectIdRef = useRef<string | null>(null);

  /**
   * 将扁平的文件列表转换为树形结构
   * 支持新的API数据格式
   */
  const transformFlatListToTree = useCallback((files: any[]) => {
    const root: any[] = [];
    const map = new Map<string, any>();
    const filteredFiles = files.filter((file) => {
      const fileName = file.name.split('/').pop();
      // 只过滤掉系统文件，不过滤包含系统文件的路径
      return !(
        fileName?.startsWith('.') ||
        fileName === '.DS_Store' ||
        fileName === 'Thumbs.db' ||
        fileName?.endsWith('.tmp') ||
        fileName?.endsWith('.bak')
      );
    });

    // 创建所有文件节点和必要的文件夹节点
    filteredFiles.forEach((file) => {
      const pathParts = file.name.split('/').filter(Boolean);
      const fileName = pathParts[pathParts.length - 1];
      const isFile = fileName.includes('.');

      const node = {
        id: file.name,
        name: fileName,
        type: isFile ? 'file' : 'folder',
        path: file.name,
        children: [],
        binary: file.binary || false,
        size: file.size || file.sizeExceeded ? 0 : file.contents?.length || 0,
        status: file.status || null,
        fullPath: file.name,
        parentPath: pathParts.slice(0, -1).join('/') || null,
        contents: file.contents || '',
      };

      map.set(file.name, node);

      // 如果文件在子目录中，确保创建所有必要的父文件夹节点
      if (pathParts.length > 1) {
        for (let i = pathParts.length - 2; i >= 0; i--) {
          const parentPath = pathParts.slice(0, i + 1).join('/');
          const parentName = pathParts[i];

          if (!map.has(parentPath)) {
            const parentNode = {
              id: parentPath,
              name: parentName,
              type: 'folder',
              path: parentPath,
              children: [],
              parentPath: i > 0 ? pathParts.slice(0, i).join('/') : null,
            };
            map.set(parentPath, parentNode);
          }
        }
      }
    });

    // 构建层次结构
    map.forEach((node) => {
      if (node.parentPath && map.has(node.parentPath)) {
        const parentNode = map.get(node.parentPath);
        if (!parentNode.children.find((child: any) => child.id === node.id)) {
          parentNode.children.push(node);
        }
      } else if (!node.parentPath) {
        if (!root.find((item: any) => item.id === node.id)) {
          root.push(node);
        }
      }
    });

    // 排序：文件夹在前，文件在后，同类型按名称排序
    const sortNodes = (nodes: any[]) => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    sortNodes(root);
    map.forEach((node) => {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    });

    return root;
  }, []);

  /**
   * 查找第一个可用的文件
   */
  const findFirstFile = useCallback((treeData: any[]): string | null => {
    for (const node of treeData) {
      if (node.type === 'file') {
        // 跳过系统文件和隐藏文件
        const fileName = node.name || node.id || '';
        if (
          fileName.startsWith('.') ||
          fileName === '.DS_Store' ||
          fileName === 'Thumbs.db' ||
          fileName.endsWith('.tmp') ||
          fileName.endsWith('.bak')
        ) {
          continue;
        }
        return node.id;
      }
      if (node.children && node.children.length > 0) {
        const fileInChildren = findFirstFile(node.children);
        if (fileInChildren) {
          return fileInChildren;
        }
      }
    }
    return null;
  }, []);

  /**
   * 加载文件树数据
   * 支持新的API格式和原有格式
   */
  const loadFileTree = useCallback(async () => {
    if (!workspace.projectId) {
      console.log('⚠️ [AppDev] 没有项目ID，跳过文件树加载');
      return;
    }

    // 检查是否已经加载过相同项目的文件树，避免重复调用
    if (
      lastLoadedProjectIdRef.current === workspace.projectId &&
      fileTreeData.length > 0
    ) {
      console.log(
        '🔄 [AppDev] 项目ID未变化且文件树已存在，跳过重复加载:',
        workspace.projectId,
      );
      return;
    }

    try {
      console.log('🌲 [AppDev] 正在加载文件树数据...', {
        projectId: workspace.projectId,
      });

      // 使用新的API获取项目内容
      const response = await getProjectContent(workspace.projectId);

      if (response && response.code === '0000' && response.data) {
        const files = response.data.files || response.data;
        console.log('✅ [AppDev] 项目内容加载成功:', files);

        // 检查是否是新的扁平格式
        if (Array.isArray(files) && files.length > 0 && files[0].name) {
          console.log('🔄 [AppDev] 检测到新的扁平格式，正在转换...');
          const treeData = transformFlatListToTree(files);
          setFileTreeData(treeData);
          console.log(
            '✅ [AppDev] 文件树转换完成，共',
            treeData.length,
            '个根节点',
          );

          // 更新最后加载的项目ID
          lastLoadedProjectIdRef.current = workspace.projectId;

          // 自动展开第一层文件夹
          const rootFolders = treeData
            .filter((node) => node.type === 'folder')
            .map((node) => node.id);
          if (rootFolders.length > 0) {
            setExpandedFolders(new Set(rootFolders));
          }

          // 自动选择第一个文件
          if (!selectedFile) {
            const firstFile = findFirstFile(treeData);
            if (firstFile) {
              setSelectedFile(firstFile);
              console.log('📁 [AppDev] 自动选择第一个文件:', firstFile);
            }
          }
          return;
        }

        // 如果是原有的树形格式，直接使用
        if (Array.isArray(files)) {
          setFileTreeData(files);

          // 更新最后加载的项目ID
          lastLoadedProjectIdRef.current = workspace.projectId;

          // 自动选择第一个文件
          if (!selectedFile) {
            const firstFile = findFirstFile(files);
            if (firstFile) {
              setSelectedFile(firstFile);
              console.log('📁 [AppDev] 自动选择第一个文件:', firstFile);
            }
          }
          return;
        }
      }

      console.log('⚠️ [AppDev] API返回数据格式异常，使用空项目结构');
      throw new Error('API返回数据格式异常');
    } catch (error) {
      console.error('❌ [AppDev] 加载文件树失败:', error);
      console.log('🔄 [AppDev] 使用空项目结构作为fallback');

      // fallback到空项目结构
      const emptyProjectData: any[] = [];

      const treeData = transformFlatListToTree(emptyProjectData);
      setFileTreeData(treeData);
      console.log('✅ [AppDev] 空项目结构加载完成');

      // 更新最后加载的项目ID
      lastLoadedProjectIdRef.current = workspace.projectId;

      // 不自动展开任何文件夹，因为项目为空
      setExpandedFolders(new Set());

      // 不自动选择任何文件，因为项目为空
      setSelectedFile('');
    }
  }, [workspace.projectId, transformFlatListToTree, findFirstFile]);

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
   * 启动保活轮询
   */
  const startKeepAlive = useCallback(() => {
    if (!workspace.projectId) {
      console.log('⚠️ [AppDev] 没有项目ID，跳过保活轮询');
      return;
    }

    // 清除之前的定时器
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
    }

    // 立即执行一次保活
    keepAlive(workspace.projectId).catch((error) => {
      console.error('❌ [AppDev] 初始保活失败:', error);
    });

    // 启动30秒间隔的轮询
    keepAliveTimerRef.current = setInterval(() => {
      keepAlive(workspace.projectId).catch((error) => {
        console.error('❌ [AppDev] 保活轮询失败:', error);
      });
    }, 30000);

    console.log('💗 [AppDev] 已启动30秒保活轮询，项目ID:', workspace.projectId);
  }, [workspace.projectId]);

  /**
   * 停止保活轮询
   */
  const stopKeepAlive = useCallback(() => {
    if (keepAliveTimerRef.current) {
      clearInterval(keepAliveTimerRef.current);
      keepAliveTimerRef.current = null;
      console.log('🛑 [AppDev] 已停止保活轮询');
    }
  }, []);

  // 在页面进入时启动保活轮询
  useEffect(() => {
    if (workspace.projectId) {
      startKeepAlive();
    }

    // 页面卸载时停止轮询
    return () => {
      stopKeepAlive();
    };
  }, [workspace.projectId, startKeepAlive, stopKeepAlive]);

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
              // 重启开发服务器逻辑已移除
              console.log('开发服务器重启功能已禁用');
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
   * 根据文件ID构建完整的文件路径
   */
  const getFilePath = useCallback(
    (fileId: string, treeData: any[] = fileTreeData): string | null => {
      for (const node of treeData) {
        if (node.id === fileId) {
          return node.name;
        }
        if (node.children) {
          const childPath = getFilePath(fileId, node.children);
          if (childPath) {
            return `${node.name}/${childPath}`;
          }
        }
      }
      return null;
    },
    [fileTreeData],
  );

  /**
   * 判断文件是否为图片类型
   */
  const isImageFile = useCallback((fileName: string): boolean => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const imageExts = [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'bmp',
      'webp',
      'svg',
      'ico',
      'tiff',
    ];
    return imageExts.includes(ext || '');
  }, []);

  /**
   * 在文件树中查找文件节点
   */
  const findFileNode = useCallback(
    (fileId: string, treeData: any[] = fileTreeData): any => {
      for (const node of treeData) {
        if (node.id === fileId) {
          return node;
        }
        if (node.children) {
          const found = findFileNode(fileId, node.children);
          if (found) {
            return found;
          }
        }
      }
      return null;
    },
    [fileTreeData],
  );

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

      // 检查文件是否已经有contents数据，如果有则不需要调用API
      const fileNode = findFileNode(fileId);
      if (fileNode && fileNode.contents && fileNode.contents.trim() !== '') {
        console.log('📄 [AppDev] 文件已有contents数据，跳过API调用:', fileId);
        setFileContent(fileNode.contents);
        setFileContentError(null);
        return;
      }

      try {
        setIsLoadingFileContent(true);
        setFileContentError(null);

        console.log('📄 [AppDev] 调用API获取文件内容:', fileId);
        const response = await getFileContent(workspace.projectId, fileId);
        if (response && typeof response === 'object' && 'data' in response) {
          setFileContent((response as any).data as string);
          // 移除成功提示，避免重复toast
        } else if (typeof response === 'string') {
          setFileContent(response);
          // 移除成功提示，避免重复toast
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
    [setActiveFile, workspace.projectId, findFileNode],
  );

  // 在项目ID变化时加载默认文件内容
  useEffect(() => {
    if (workspace.projectId && selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [workspace.projectId, selectedFile, handleFileSelect]);

  // 在项目ID变化时加载文件树
  useEffect(() => {
    if (workspace.projectId) {
      loadFileTree();
    }
  }, [workspace.projectId, loadFileTree]);

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
   * 测试API接口
   */
  const testGetProjectContent = useCallback(async () => {
    try {
      console.log('🧪 [AppDev] 测试获取项目内容API...');
      const testProjectId = workspace.projectId || '1'; // 使用当前项目ID或默认值

      const response = await getProjectContent(testProjectId);
      console.log('✅ [AppDev] API测试成功:', response);

      if (response.code === '0000' && response.data) {
        const files = response.data.files;
        const fileCount = Array.isArray(files)
          ? files.length
          : Object.keys(files).length;
        message.success(`API测试成功！获取到 ${fileCount} 个文件`);
      } else {
        message.warning(`API响应异常: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ [AppDev] API测试失败:', error);
      message.error(
        `API测试失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }, [workspace.projectId]);

  /**
   * 测试提交文件修改API
   */
  const testSubmitFiles = useCallback(async () => {
    try {
      console.log('🧪 [AppDev] 测试提交文件修改API...');
      const testProjectId = Number(workspace.projectId) || 1;

      // 创建测试文件数据
      const testFiles = [
        {
          name: 'test.txt',
          contents: '这是一个测试文件内容\nHello World!',
          binary: false,
          sizeExceeded: false,
        },
        {
          name: 'README.md',
          contents: '# 测试项目\n\n这是一个用于测试API的项目。',
          binary: false,
          sizeExceeded: false,
        },
      ];

      const response = await submitFiles(testProjectId, testFiles);
      console.log('✅ [AppDev] 提交文件API测试成功:', response);

      if (response.code === '0000' && response.data) {
        message.success(`提交测试成功！提交了 ${testFiles.length} 个文件`);
      } else {
        message.warning(`提交API响应异常: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ [AppDev] 提交文件API测试失败:', error);
      message.error(
        `提交API测试失败: ${
          error instanceof Error ? error.message : '未知错误'
        }`,
      );
    }
  }, [workspace.projectId]);

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
    const inputText = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    try {
      // 生成会话ID（如果还没有）
      let sessionId = currentSessionId;
      if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        setCurrentSessionId(sessionId);
      }

      // 发送聊天消息到AI服务
      const response = await sendChatMessage({
        user_id: 'app-dev-user', // 根据实际情况获取用户ID
        prompt: inputText,
        project_id: workspace.projectId || undefined,
        session_id: sessionId,
        request_id: `req_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
      });

      if (response.success && response.data) {
        // 建立SSE连接监听回复
        initializeSSEManager(response.data.session_id);
      } else {
        throw new Error(response.message || '发送消息失败');
      }
    } catch (error) {
      console.error('AI聊天失败:', error);
      message.error(
        `AI聊天失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
      setIsChatLoading(false);
    }
  }, [chatInput, currentSessionId, workspace.projectId, initializeSSEManager]);

  /**
   * 取消AI聊天任务
   */
  const handleCancelChat = useCallback(async () => {
    if (!currentSessionId || !workspace.projectId) {
      return;
    }

    try {
      console.log('🛑 [AppDev] 取消AI聊天任务');
      await cancelAgentTask(workspace.projectId, currentSessionId);

      // 关闭SSE连接
      if (sseManager) {
        sseManager.destroy();
        setSseManager(null);
      }

      setIsChatLoading(false);
      message.success('已取消AI任务');
    } catch (error) {
      console.error('取消AI任务失败:', error);
      message.error('取消AI任务失败');
    }
  }, [currentSessionId, workspace.projectId, sseManager]);

  /**
   * 清理SSE连接
   */
  useEffect(() => {
    return () => {
      if (sseManager) {
        sseManager.destroy();
      }
    };
  }, [sseManager]);

  /**
   * 根据文件扩展名获取语言类型（用于显示）
   * 与Monaco Editor内部语言标识保持一致
   */
  const getLanguageFromFile = useCallback((fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      // TypeScript/JavaScript
      case 'tsx':
      case 'jsx':
        return 'TypeScript React';
      case 'ts':
        return 'TypeScript';
      case 'js':
      case 'mjs':
      case 'cjs':
        return 'JavaScript';

      // Stylesheets
      case 'css':
        return 'CSS';
      case 'less':
        return 'Less';
      case 'scss':
        return 'SCSS';
      case 'sass':
        return 'Sass';

      // Markup & Templates
      case 'html':
      case 'htm':
        return 'HTML';
      case 'vue':
        return 'Vue (HTML)'; // Vue文件，基于HTML语法高亮
      case 'xml':
        return 'XML'; // XML文件

      // Data & Configuration
      case 'json':
        return 'JSON';
      case 'jsonc':
        return 'JSON'; // JSON with comments
      case 'yaml':
      case 'yml':
        return 'YAML';
      case 'toml':
        return 'TOML';
      case 'ini':
        return 'INI';

      // Documentation
      case 'md':
      case 'markdown':
        return 'Markdown';
      case 'txt':
        return 'Plain Text';

      // Server & Config
      case 'php':
        return 'PHP';
      case 'py':
        return 'Python';
      case 'java':
        return 'Java';
      case 'go':
        return 'Go';
      case 'rs':
        return 'Rust';
      case 'cpp':
      case 'cc':
      case 'cxx':
        return 'C++';
      case 'c':
        return 'C';
      case 'cs':
        return 'C#';
      case 'vb':
        return 'VB';
      case 'swift':
        return 'Swift';
      case 'kt':
        return 'Kotlin';
      case 'scala':
        return 'Scala';
      case 'rb':
        return 'Ruby';
      case 'dart':
        return 'Dart';
      case 'lua':
        return 'Lua';
      case 'r':
        return 'R';

      // Web & Scripts
      case 'sh':
      case 'bash':
      case 'zsh':
        return 'Shell';
      case 'ps1':
        return 'PowerShell';
      case 'bat':
      case 'cmd':
        return 'Batch';
      case 'sql':
        return 'SQL';

      // Build & Config
      case 'dockerfile':
        return 'Dockerfile';
      case 'makefile':
        return 'Makefile';
      case 'gitignore':
      case 'dockerignore':
        return 'Plain Text';

      // Other common files
      case 'log':
        return 'Log';
      case 'csv':
        return 'CSV';

      default:
        return 'Plain Text';
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
   * 切换文件树折叠状态
   */
  const toggleFileTreeCollapse = useCallback(() => {
    setIsFileTreeCollapsed((prev) => !prev);
  }, [setIsFileTreeCollapsed]);

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

        case 'thinking':
          return (
            <div key={message.id} className={styles.messageWrapper}>
              <div className={`${styles.message} ${styles.thinking}`}>
                <div className={styles.messageContent}>
                  <div className={styles.thinkingIndicator}>💭 思考中...</div>
                  {message.content?.split('\n').map((line, index) => (
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
                  onChange={(value) => setChatMode(value as 'chat' | 'design')}
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
                placeholder="向AI助手提问..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onPressEnter={handleChatSend}
                suffix={
                  <div style={{ display: 'flex', gap: 4 }}>
                    {isChatLoading && (
                      <Button
                        type="text"
                        icon={<StopOutlined />}
                        onClick={handleCancelChat}
                        title="取消AI任务"
                        className={styles.cancelButton}
                      />
                    )}
                    <Button
                      type="text"
                      icon={<SendOutlined />}
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || isChatLoading}
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
                onChange={(value) => setActiveTab(value as 'preview' | 'code')}
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
                  {/* 悬浮折叠/展开按钮 */}
                  <Tooltip
                    title={isFileTreeCollapsed ? '展开文件树' : '收起文件树'}
                  >
                    <Button
                      type="text"
                      icon={
                        isFileTreeCollapsed ? (
                          <RightOutlined />
                        ) : (
                          <LeftOutlined />
                        )
                      }
                      onClick={toggleFileTreeCollapse}
                      className={`${styles.collapseButton} ${
                        isFileTreeCollapsed ? styles.collapsed : styles.expanded
                      }`}
                    />
                  </Tooltip>
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
                        <Button
                          type="text"
                          className={styles.addButton}
                          onClick={testGetProjectContent}
                          style={{ marginLeft: 8 }}
                        >
                          测试API
                        </Button>
                        <Button
                          type="text"
                          className={styles.addButton}
                          onClick={testSubmitFiles}
                          style={{ marginLeft: 8 }}
                        >
                          测试提交
                        </Button>
                      </div>
                      <div className={styles.fileTreeContainer}>
                        {/* 文件树结构 */}
                        <div className={styles.fileTree}>
                          {fileTreeData.map((node) => renderFileTreeNode(node))}
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
                              {getFilePath(selectedFile) || selectedFile}
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
                          {(() => {
                            if (isLoadingFileContent) {
                              return (
                                <div className={styles.loadingContainer}>
                                  <Spin size="large" />
                                  <p>正在加载文件内容...</p>
                                </div>
                              );
                            }

                            if (fileContentError) {
                              return (
                                <div className={styles.errorContainer}>
                                  <p>{fileContentError}</p>
                                  <Button
                                    size="small"
                                    onClick={() =>
                                      handleFileSelect(selectedFile)
                                    }
                                  >
                                    重试
                                  </Button>
                                </div>
                              );
                            }

                            if (!selectedFile) {
                              return (
                                <div className={styles.emptyState}>
                                  <p>请从左侧文件树选择一个文件进行预览</p>
                                </div>
                              );
                            }

                            const fileNode = findFileNode(selectedFile);
                            const hasContents =
                              fileNode &&
                              fileNode.contents &&
                              fileNode.contents.trim() !== '';
                            const isImage = isImageFile(selectedFile);

                            // 逻辑1: 如果文件有contents，直接在编辑器中显示
                            if (hasContents) {
                              return (
                                <div className={styles.fileContentDisplay}>
                                  <MonacoEditor
                                    currentFile={{
                                      id: selectedFile,
                                      name: selectedFile,
                                      type: 'file',
                                      path: `app/${selectedFile}`,
                                      content: fileNode.contents,
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
                              );
                            }

                            // 逻辑2: 如果是图片文件，使用img元素渲染
                            if (isImage) {
                              const previewUrl = workspace.devServerUrl
                                ? `${workspace.devServerUrl}/${selectedFile}`
                                : `/${selectedFile}`;

                              return (
                                <div className={styles.imagePreviewContainer}>
                                  <div className={styles.imagePreviewHeader}>
                                    <span>图片预览: {selectedFile}</span>
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
                                  <div className={styles.imagePreviewContent}>
                                    <img
                                      src={previewUrl}
                                      alt={selectedFile}
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '600px',
                                        objectFit: 'contain',
                                        border: '1px solid #d9d9d9',
                                        borderRadius: '6px',
                                      }}
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          '/api/file-preview/' + selectedFile;
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            }

                            // 逻辑3: 其他情况通过API远程预览或使用现有fileContent
                            if (fileContent) {
                              return (
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
                              );
                            }

                            return (
                              <div className={styles.emptyState}>
                                <p>无法预览此文件类型: {selectedFile}</p>
                                <Button
                                  size="small"
                                  onClick={() => handleFileSelect(selectedFile)}
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
    </div>
  );
};

export default AppDev;
