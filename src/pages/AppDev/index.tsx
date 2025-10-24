import { SvgIcon } from '@/components/base';
import Created from '@/components/Created';
import PublishComponentModal from '@/components/PublishComponentModal';
import { ERROR_MESSAGES } from '@/constants/appDevConstants';
import { SUCCESS_CODE } from '@/constants/codes.constants';
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
import { apiAgentConfigInfo } from '@/services/agentConfig';
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
import { PageDevelopPublishTypeEnum } from '@/types/enums/pageDev';
import { AgentConfigInfo } from '@/types/interfaces/agent';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { FileNode } from '@/types/interfaces/appDev';
import { DataResource } from '@/types/interfaces/dataResource';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { SyncOutlined, UploadOutlined } from '@ant-design/icons';
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
import { useModel, useParams, useRequest } from 'umi';
import { AppDevHeader, ContentViewer } from './components';
import ChatArea from './components/ChatArea';
import DevLogConsole from './components/DevLogConsole';
import EditorHeaderRight from './components/EditorHeaderRight';
import FileTreePanel from './components/FileTreePanel';
import PageEditModal from './components/PageEditModal';
import { type PreviewRef } from './components/Preview';
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
  const spaceId = Number(params.spaceId);

  // 数据源选择状态
  const [selectedDataResources, setSelectedDataResources] = useState<
    DataResource[]
  >([]);
  // 缓存 selectedDataResources 引用，避免无限循环
  const selectedDataResourcesRef = useRef<DataResource[]>([]);

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
  const [showDevLogConsole, setShowDevLogConsole] = useState(false);

  // 图片清空方法引用
  // const clearUploadedImagesRef = useRef<(() => void) | null>(null);

  // 部署相关状态
  const [isDeploying, setIsDeploying] = useState(false);

  // 导出项目状态
  // const [isExporting, setIsExporting] = useState(false); // 暂时注释掉，后续可能需要

  // 单文件上传状态
  const [isSingleFileUploadModalVisible, setIsSingleFileUploadModalVisible] =
    useState(false);
  const [singleFileUploadLoading, setSingleFileUploadLoading] = useState(false);
  const [singleFilePath, setSingleFilePath] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // 项目导入状态
  const [isProjectUploading, setIsProjectUploading] = useState(false);

  // 聊天模式状态
  // const [chatMode, setChatMode] = useState<'chat' | 'code'>('chat');

  // 数据资源相关状态
  const [isAddDataResourceModalVisible, setIsAddDataResourceModalVisible] =
    useState(false);

  // 删除确认对话框状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // 发布智能体弹窗状态
  const [openPublishComponentModal, setOpenPublishComponentModal] =
    useState(false);

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

  // Preview 状态跟踪
  const [previewIsLoading, setPreviewIsLoading] = useState(false);
  const [previewLastRefreshed, setPreviewLastRefreshed] = useState<Date | null>(
    null,
  );

  // 智能体配置信息
  const [agentConfigInfo, setAgentConfigInfo] =
    useState<AgentConfigInfo | null>(null);

  // 查询智能体配置信息
  const { run: runAgentConfigInfo } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentConfigInfo) => {
      setAgentConfigInfo(result);
    },
  });

  useEffect(() => {
    if (projectInfo.projectInfoState.projectInfo?.devAgentId) {
      const agentId = projectInfo.projectInfoState.projectInfo?.devAgentId;
      runAgentConfigInfo(agentId);
    }
  }, [projectInfo.projectInfoState.projectInfo?.devAgentId]);

  // 定期更新 Preview 状态
  useEffect(() => {
    const updatePreviewStatus = () => {
      if (previewRef.current) {
        setPreviewIsLoading(previewRef.current.getIsLoading());
        setPreviewLastRefreshed(previewRef.current.getLastRefreshed());
      }
    };

    // 立即更新一次
    updatePreviewStatus();

    // 每 500ms 更新一次状态
    const interval = setInterval(updatePreviewStatus, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // 如果上次使用的模型ID存在，则使用上次使用的模型ID
    if (projectInfo.projectInfoState.projectInfo?.lastModelId) {
      modelSelector.selectModel(
        projectInfo.projectInfoState.projectInfo?.lastModelId,
      );
      return;
    }

    const { chatModelList } = modelSelector.models || {};
    // 没有上次使用的模型时，优先使用 Anthropic 的第一个
    const anthropicModel = chatModelList?.find(
      (m) => m.apiProtocol === 'Anthropic',
    );

    if (anthropicModel) {
      modelSelector.selectModel(anthropicModel.id);
    } else if (chatModelList && chatModelList.length > 0) {
      // 如果没有 Anthropic 模型，使用列表第一个
      modelSelector.selectModel(chatModelList[0].id);
    }
  }, [modelSelector.models, projectInfo.projectInfoState.projectInfo]);

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
    multiModelId: modelSelector.selectedMultiModelId, // 新增：传递多模态模型ID（视觉模型ID）
    onRefreshFileTree: fileManagement.loadFileTree, // 新增：传递文件树刷新方法
    selectedDataResources: selectedDataResources, // 新增：传递选中的数据源
    onClearDataSourceSelections: () => setSelectedDataResources([]), // 新增：清除选择回调
    onRefreshVersionList: projectInfo.refreshProjectInfo, // 新增：传递刷新版本列表方法
    // onClearUploadedImages: () => {
    //   // 调用 ChatArea 组件传递的图片清空方法
    //   if (clearUploadedImagesRef.current) {
    //     clearUploadedImagesRef.current();
    //   }
    // }, // 新增：传递清除上传图片方法
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
    pollInterval: 5000, // 调整为5秒轮询
    maxLogLines: 1000,
  });

  // 自动异常处理（暂时禁用）
  // const autoErrorHandling = useAutoErrorHandling(projectId || '', {
  //   enabled: hasValidProjectId,
  //   errorDetectionDelay: 1000,
  //   maxSendFrequency: 30000,
  //   showNotification: true,
  // });

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
      setAddComponents(addComponents as AgentAddComponentStatusInfo[]);
    }
  }, [projectInfo.projectInfoState?.projectInfo]);

  // 数据资源管理
  const dataResourceManagement = useDataResourceManagement();

  useEffect(() => {
    if (projectInfo.projectInfoState.projectInfo) {
      dataResourceManagement.fetchResources(
        projectInfo.projectInfoState.projectInfo?.dataSources || [],
      );
    }
  }, [projectInfo.projectInfoState.projectInfo]);

  useEffect(() => {
    if (dataResourceManagement.resources?.length > 0) {
      const _selectedDataResources: DataResource[] =
        dataResourceManagement.resources.map((resource) => {
          // 判断数据源是否已选中
          const isExist = selectedDataResourcesRef.current?.find(
            (item) => item.id === resource.id,
          );
          if (isExist) {
            return isExist;
          }
          // 新增数据源
          return {
            ...resource,
            isSelected: false,
          };
        });
      setSelectedDataResources(_selectedDataResources);
      selectedDataResourcesRef.current = _selectedDataResources;
    }
  }, [dataResourceManagement.resources]);

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
   * 版本选择器标签渲染函数
   */
  // const labelRender = useCallback((props: any) => {
  //   return <span>v{props.value.replace('v', '')}</span>;
  // }, []); // 暂时注释掉，后续可能需要

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

  /**
   * 检查 projectId 状态
   */
  useEffect(() => {
    setMissingProjectId(!hasValidProjectId);
  }, [projectId, hasValidProjectId]);

  /**
   * 处理项目发布成组件
   */
  const handlePublishComponent = useCallback(async () => {
    if (!hasValidProjectId || !projectId) {
      message.error('项目ID不存在或无效，无法部署');
      return;
    }

    try {
      setIsDeploying(true);
      const result = await buildProject(
        projectId,
        PageDevelopPublishTypeEnum.PAGE,
      );

      // 检查API响应格式
      if (result?.code === SUCCESS_CODE && result?.data) {
        const { prodServerUrl } = result.data;
        // 显示部署结果
        Modal.success({
          title: '成功发布成组件',
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
   * 处理发布成应用
   */
  const handlePublishApplication = async () => {
    if (!hasValidProjectId || !projectId) {
      message.error('项目ID不存在或无效，无法部署');
      return;
    }
    // 先执行发布成组件
    const { code, message: errorMessage } = await buildProject(
      projectId,
      PageDevelopPublishTypeEnum.AGENT,
    );
    if (code === SUCCESS_CODE) {
      setOpenPublishComponentModal(true);
    } else {
      message.error(errorMessage);
    }
  };

  /**
   * 处理发布智能体
   */
  const handleConfirmPublish = () => {
    projectInfo.refreshProjectInfo();
    setOpenPublishComponentModal(false);
  };

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
      // setIsExporting(true); // 暂时注释掉，后续可能需要
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
      // setIsExporting(false); // 暂时注释掉，后续可能需要
    }
  }, [hasValidProjectId, projectId]);

  /**
   * 处理重启开发服务器按钮点击（手动触发）
   */
  const handleRestartDevServer = useCallback(async () => {
    // 重置日志起始行号
    devLogs.resetStartLine();

    // 使用重启开发服务器 Hook，手动触发时切换到预览标签页
    await restartDevServer({
      shouldSwitchTab: true,
      delayBeforeRefresh: 500,
      showMessage: false,
    });
  }, [restartDevServer, devLogs.resetStartLine]);

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
        if (result?.code === SUCCESS_CODE) {
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
    async (resourceId: number) => {
      try {
        await dataResourceManagement.deleteResource(resourceId);
        setAddComponents((list) =>
          list.filter((info) => info.targetId !== Number(resourceId)),
        );

        const _selectedDataResources =
          selectedDataResources?.filter((item) => item.id !== resourceId) || [];
        setSelectedDataResources(_selectedDataResources);
        selectedDataResourcesRef.current = _selectedDataResources;
      } catch (error) {
        // 删除数据资源失败
      }
    },
    [dataResourceManagement, selectedDataResources],
  );

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
   * 处理右键上传（直接调用上传接口，不依赖状态）
   */
  const handleRightClickUpload = useCallback(
    async (node: FileNode | null) => {
      if (!hasValidProjectId) {
        message.error(ERROR_MESSAGES.NO_PROJECT_ID);
        return;
      }
      //两种情况 第一个是文件夹，第二个是文件
      let relativePath = '';
      if (node) {
        if (node.type === 'file') {
          relativePath = node.path.replace(new RegExp(node.name + '$'), ''); //只替换以node.name结尾的部分
        } else if (node.type === 'folder') {
          relativePath = node.path + '/';
        }
      } else {
        relativePath = '';
      }
      // 创建一个隐藏的文件输入框
      const input = document.createElement('input');
      input.type = 'file';
      input.style.display = 'none';
      document.body.appendChild(input);

      // 等待用户选择文件
      input.click();

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          document.body.removeChild(input);
          return;
        }

        try {
          // 设置加载状态，与弹窗上传保持一致
          setSingleFileUploadLoading(true);

          // 直接调用上传接口，使用文件名作为路径
          const result = await fileManagement.uploadSingleFileToServer(
            file,
            relativePath + file.name,
          );

          if (result) {
            // 与弹窗上传成功后逻辑保持一致
            // 刷新项目详情(刷新版本列表)
            projectInfo.refreshProjectInfo();
          }
        } catch (error) {
          console.error('上传失败', error);
        } finally {
          // 清理加载状态和DOM
          setSingleFileUploadLoading(false);
          document.body.removeChild(input);
        }
      };

      // 如果用户取消选择，也要清理DOM
      input.oncancel = () => {
        document.body.removeChild(input);
      };
    },
    [hasValidProjectId, fileManagement, projectInfo],
  );

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
   * 处理重命名文件/文件夹
   */
  const handleRenameFile = useCallback(
    async (node: any, newName: string): Promise<boolean> => {
      if (!node || !newName.trim()) {
        return false;
      }

      try {
        const success = await fileManagement.renameFileItem(
          node.id,
          newName.trim(),
        );
        if (success) {
          handleRestartDevServer();
          // 刷新项目详情(刷新版本列表)
          projectInfo.refreshProjectInfo();
          return true;
        } else {
          return false;
        }
      } catch (error) {
        return false;
      }
    },
    [fileManagement, projectInfo, handleRestartDevServer],
  );

  /**
   * 处理将日志内容添加到聊天框
   */
  const handleAddLogToChat = useCallback(
    (logContent: string, isAuto?: boolean) => {
      if (!logContent.trim()) {
        message.warning('日志内容为空');
        return;
      }

      // 将日志内容添加到聊天输入框
      const formattedContent = `请帮我分析以下日志内容：\n\n\`\`\`\n${logContent}\n\`\`\``;
      chat.setChatInput(formattedContent);
      if (isAuto && !chat.isChatLoading) {
        setTimeout(() => {
          // 通过事件总线发布发送消息事件
          eventBus.emit(EVENT_NAMES.SEND_CHAT_MESSAGE);
        }, 300);
        return;
      }
      // 显示成功提示
      message.success('日志已添加,等待发送');
    },
    [chat.setChatInput, chat.sendMessage],
  );

  /**
   * 处理上传文件到指定路径
   */
  const handleUploadToFolder = useCallback(
    async (targetPath: string, file: File): Promise<boolean> => {
      if (!hasValidProjectId) {
        message.error(ERROR_MESSAGES.NO_PROJECT_ID);
        return false;
      }

      if (!targetPath.trim()) {
        message.error('目标路径不能为空');
        return false;
      }

      try {
        // 构建完整文件路径
        const fileName = file.name;
        const fullPath = targetPath.endsWith('/')
          ? `${targetPath}${fileName}`
          : `${targetPath}/${fileName}`;

        const success = await fileManagement.uploadSingleFileToServer(
          file,
          fullPath,
        );
        if (success) {
          message.success(`文件上传成功: ${fileName}`);
          handleRestartDevServer();
          // 刷新项目详情(刷新版本列表)
          projectInfo.refreshProjectInfo();
          return true;
        } else {
          message.error('文件上传失败');
          return false;
        }
      } catch (error) {
        message.error(
          `文件上传失败: ${
            error instanceof Error ? error.message : '未知错误'
          }`,
        );
        return false;
      }
    },
    [hasValidProjectId, fileManagement, projectInfo, handleRestartDevServer],
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
  const handleCancelEdit = useCallback(
    (silent: boolean = false) => {
      fileManagement.cancelEdit(silent);
    },
    [fileManagement],
  );

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

      // 停止日志轮询
      devLogs.stopPolling();
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

  /**
   * 更新数据源
   */
  const handleUpdateDataSources = (dataSources: DataResource[]) => {
    setSelectedDataResources(dataSources);
    selectedDataResourcesRef.current = dataSources;
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
                <div className={styles.deployTitle}>正在发布项目...</div>
                <div className={styles.deploySubtitle}>
                  请稍候，发布完成后将自动关闭
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
          onPublishComponent={handlePublishComponent}
          onPublishApplication={handlePublishApplication}
          hasUpdates={projectInfo.hasUpdates}
          isDeploying={isDeploying}
          projectInfo={projectInfo.projectInfoState?.projectInfo}
          isChatLoading={chat.isChatLoading} // 新增：传递聊天加载状态
        />

        {/* 主布局 - 左右分栏 */}
        <Row gutter={0} className={styles.mainRow}>
          {/* 左侧AI助手面板 */}
          <Col className={styles.leftPanel}>
            <ChatArea
              // chatMode={chatMode}
              // setChatMode={setChatMode}
              chat={chat}
              projectId={projectId || ''}
              selectedDataSources={selectedDataResources} // 新增：选中的数据源
              onUpdateDataSources={handleUpdateDataSources} // 新增：更新数据源回调
              fileContentState={fileManagement.fileContentState} // 新增：文件内容状态
              onSetSelectedFile={fileManagement.switchToFile} // 删除选择的文件
              modelSelector={modelSelector} // 模型选择器状态
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
                      label: (
                        <Tooltip title="预览">
                          <SvgIcon
                            name="icons-common-preview"
                            style={{ fontSize: 20 }}
                          />
                        </Tooltip>
                      ),
                      value: 'preview',
                    },
                    {
                      label: (
                        <Tooltip title="代码">
                          <SvgIcon
                            name="icons-common-code"
                            style={{ fontSize: 20 }}
                          />
                        </Tooltip>
                      ),
                      value: 'code',
                    },
                  ]}
                  className={styles.segmentedTabs}
                />
              </div>
              <EditorHeaderRight
                // 版本对比模式相关
                isComparing={versionCompare.isComparing}
                versionCompareData={{
                  isSwitching: versionCompare.isSwitching,
                  targetVersion: versionCompare.targetVersion || undefined,
                  onCancelCompare: versionCompare.cancelCompare,
                  onConfirmVersionSwitch: versionCompare.confirmVersionSwitch,
                }}
                // 预览模式相关
                activeTab={activeTab}
                previewData={{
                  devServerUrl: workspace.devServerUrl,
                  isStarting: server.isStarting,
                  isRestarting: server.isRestarting,
                  isProjectUploading: isProjectUploading,
                  isLoading: previewIsLoading,
                  lastRefreshed: previewLastRefreshed,
                }}
                // 版本选择相关
                versionData={{
                  versionList: projectInfo.versionList,
                  currentVersion:
                    projectInfo.projectInfoState.projectInfo?.codeVersion,
                  onVersionSelect: handleVersionSelect,
                  getActionColor: projectInfo.getActionColor,
                  getActionText: projectInfo.getActionText,
                }}
                // 控制台相关
                consoleData={{
                  showDevLogConsole: showDevLogConsole,
                  hasErrorInLatestBlock: devLogs.hasErrorInLatestBlock,
                  onToggleDevLogConsole: () =>
                    setShowDevLogConsole(!showDevLogConsole),
                }}
                // 更多操作相关
                actionsData={{
                  onImportProject: () => setIsUploadModalVisible(true),
                  onUploadSingleFile: () => handleRightClickUpload(null),
                  onRefreshPreview: () => previewRef.current?.refresh(),
                  onRestartServer: handleRestartDevServer,
                  onFullscreenPreview: () => {
                    if (previewRef.current && workspace.devServerUrl) {
                      window.open(
                        `${process.env.BASE_URL}${workspace.devServerUrl}`,
                        '_blank',
                      );
                    }
                  },
                  onExportProject: handleExportProject,
                }}
                // 通用状态
                isChatLoading={chat.isChatLoading}
              />
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
                  onRenameFile={handleRenameFile}
                  onUploadToFolder={handleUploadToFolder}
                  onUploadProject={() => setIsUploadModalVisible(true)}
                  onUploadSingleFile={handleRightClickUpload}
                  onAddDataResource={() =>
                    setIsAddDataResourceModalVisible(true)
                  }
                  onDeleteDataResource={handleDeleteDataResource}
                  selectedDataResources={selectedDataResources}
                  // onDataResourceSelectionChange={setSelectedDataResourceIds}
                  workspace={workspace}
                  fileManagement={fileManagement}
                  isChatLoading={chat.isChatLoading}
                  projectId={projectId ? Number(projectId) : undefined}
                  isFileTreeInitializing={fileManagement.isFileTreeInitializing}
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
                          // autoErrorHandling.handlePreviewWhiteScreen(
                          //   devLogs.logs,
                          //   chat.sendMessage,
                          // );
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
                            handleCancelEdit(true);
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
            {/* 开发日志查看器 */}
            {showDevLogConsole && (
              <DevLogConsole
                logs={devLogs.logs}
                hasErrorInLatestBlock={devLogs.hasErrorInLatestBlock}
                isLoading={devLogs.isLoading}
                lastLine={devLogs.lastLine}
                onClear={devLogs.clearLogs}
                onRefresh={devLogs.refreshLogs}
                onClose={() => setShowDevLogConsole(false)}
                isChatLoading={chat.isChatLoading}
                onAddToChat={handleAddLogToChat}
              />
            )}
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

      {/* 页面开发项目编辑模态框 */}
      <PageEditModal
        open={openPageEditVisible}
        onCancel={() => setOpenPageEditVisible(false)}
        onConfirm={handleConfirmEditProject}
        projectInfo={projectInfo.projectInfoState.projectInfo}
      />
      {/*发布智能体弹窗*/}
      <PublishComponentModal
        targetId={projectInfo.projectInfoState.projectInfo?.devAgentId || 0}
        open={openPublishComponentModal}
        spaceId={spaceId}
        category={agentConfigInfo?.category}
        // 取消发布
        onCancel={() => setOpenPublishComponentModal(false)}
        onConfirm={handleConfirmPublish}
      />
    </>
  );
};

export default AppDev;
