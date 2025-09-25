import CodeEditor from '@/components/WebIDE/CodeEditor';
import FileTree from '@/components/WebIDE/FileTree';
import Preview from '@/components/WebIDE/Preview';
import { getProjectIdFromUrl, useAppDevStore } from '@/models/appDev';
import {
  buildProject,
  restartDev,
  startDev,
  stopDev,
  uploadAndStartProject,
} from '@/services/appDev';
import { compilerService } from '@/services/compiler';
import {
  BuildOutlined,
  CodeOutlined,
  GlobalOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Input,
  Layout,
  message,
  Modal,
  Space,
  Spin,
  Tabs,
  Typography,
  Upload,
} from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';

const { Sider, Content } = Layout;
const { Title, Text } = Typography;

/**
 * AppDev页面组件
 * 提供Web集成开发环境功能，包括文件管理、代码编辑和实时预览
 */
const AppDev: React.FC = () => {
  const {
    workspace,
    currentFile,
    isServiceRunning,
    setIsServiceRunning,
    setActiveFile,
    updateFileContent,
    createFile,
    deleteFile,
    createFolder,
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

  // 使用 ref 来跟踪是否已经启动过开发环境，避免重复调用
  const hasStartedDevRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);

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

  // 初始化编译器
  useEffect(() => {
    const initCompiler = async () => {
      try {
        await compilerService.initialize();
        console.log('✅ [AppDev] Compiler initialized successfully');
      } catch (error) {
        console.error('❌ [AppDev] Failed to initialize compiler:', error);
      }
    };

    initCompiler();
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
   * 处理文件选择
   */
  const handleFileSelect = useCallback(
    (fileId: string) => {
      setActiveFile(fileId);
    },
    [setActiveFile],
  );

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
   * 处理文件创建
   */
  const handleFileCreate = useCallback(
    (path: string, content: string) => {
      createFile(path, content);
    },
    [createFile],
  );

  /**
   * 处理文件夹创建
   */
  const handleFolderCreate = useCallback(
    (path: string) => {
      createFolder(path);
    },
    [createFolder],
  );

  /**
   * 处理文件删除
   */
  const handleFileDelete = useCallback(
    (fileId: string) => {
      deleteFile(fileId);
    },
    [deleteFile],
  );

  /**
   * 处理重启开发服务器
   */
  const handleRestartDev = useCallback(async () => {
    if (!workspace.projectId) {
      message.warning('请先选择一个项目');
      return;
    }

    try {
      await restartDev(workspace.projectId);
      message.success('开发服务器重启成功');
    } catch (error) {
      console.error('重启开发服务器失败:', error);
      message.error(
        error instanceof Error ? error.message : '重启开发服务器失败',
      );
    }
  }, [workspace.projectId]);

  /**
   * 处理停止开发服务器
   */
  const handleStopDev = useCallback(async () => {
    if (!workspace.projectId) {
      message.warning('请先选择一个项目');
      return;
    }

    try {
      await stopDev(workspace.projectId);
      setIsServiceRunning(false);
      message.success('开发服务器已停止');
    } catch (error) {
      console.error('停止开发服务器失败:', error);
      message.error(
        error instanceof Error ? error.message : '停止开发服务器失败',
      );
    }
  }, [workspace.projectId, setIsServiceRunning]);

  /**
   * 处理构建项目
   */
  const handleBuildProject = useCallback(async () => {
    if (!workspace.projectId) {
      message.warning('请先选择一个项目');
      return;
    }

    try {
      await buildProject(workspace.projectId);
      message.success('项目构建成功');
    } catch (error) {
      console.error('构建项目失败:', error);
      message.error(error instanceof Error ? error.message : '构建项目失败');
    }
  }, [workspace.projectId]);

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
      {/* 顶部工具栏 */}
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <Title level={4} style={{ margin: 0 }}>
            AppDev - {workspace.name}
          </Title>
          {workspace.projectId && (
            <Text type="secondary" style={{ marginLeft: 8 }}>
              项目ID: {workspace.projectId}
            </Text>
          )}
        </div>

        <div className={styles.toolbarRight}>
          <Space>
            {workspace.projectId && (
              <>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRestartDev}
                  disabled={!isServiceRunning}
                >
                  重启
                </Button>
                <Button
                  icon={<StopOutlined />}
                  onClick={handleStopDev}
                  disabled={!isServiceRunning}
                >
                  停止
                </Button>
                <Button icon={<BuildOutlined />} onClick={handleBuildProject}>
                  构建
                </Button>
              </>
            )}
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setIsUploadModalVisible(true)}
            >
              导入项目
            </Button>
          </Space>
        </div>
      </div>

      {/* 主内容区域 */}
      <Layout className={styles.mainLayout}>
        {/* 侧边栏 - 文件树 */}
        <Sider width={280} className={styles.sider}>
          <div className={styles.siderHeader}>
            <Title level={5} style={{ margin: 0 }}>
              项目文件
            </Title>
            <Button type="text" icon={<PlusOutlined />} size="small" />
          </div>
          <div className={styles.fileTreeContainer}>
            <FileTree
              files={workspace.files}
              onFileSelect={handleFileSelect}
              onFileCreate={handleFileCreate}
              onFolderCreate={handleFolderCreate}
              onFileDelete={handleFileDelete}
              activeFileId={workspace.activeFile}
            />
          </div>
        </Sider>

        {/* 主内容区 */}
        <Content className={styles.content}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'preview' | 'code')}
            className={styles.tabs}
            tabPosition="top"
            size="middle"
            items={[
              {
                key: 'preview',
                label: (
                  <span>
                    <GlobalOutlined />
                    页面预览
                  </span>
                ),
                children: <Preview devServerUrl={workspace.devServerUrl} />,
              },
              {
                key: 'code',
                label: (
                  <span>
                    <CodeOutlined />
                    代码编辑
                  </span>
                ),
                children: (
                  <CodeEditor
                    currentFile={currentFile}
                    onContentChange={handleFileContentChange}
                  />
                ),
              },
            ]}
          />
        </Content>
      </Layout>

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
