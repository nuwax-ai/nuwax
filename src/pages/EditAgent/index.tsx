import CreateAgent from '@/components/CreateAgent';
import FileTreeView from '@/components/FileTreeView';
import PublishComponentModal from '@/components/PublishComponentModal';
import ResizableSplit from '@/components/ResizableSplit';
import ShowStand from '@/components/ShowStand';
import type { PromptVariable } from '@/components/TiptapVariableInput/types';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import VersionHistory from '@/components/VersionHistory';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import useUnifiedTheme from '@/hooks/useUnifiedTheme';
import AnalyzeStatistics from '@/pages/SpaceDevelop/AnalyzeStatistics';
import CreateTempChatModal from '@/pages/SpaceDevelop/CreateTempChatModal';
import {
  apiAgentConfigInfo,
  apiAgentConfigUpdate,
} from '@/services/agentConfig';
import { apiModelList } from '@/services/modelConfig';
import {
  apiDownloadAllFiles,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import { ModelTypeEnum } from '@/types/enums/modelConfig';
import {
  AgentTypeEnum,
  ApplicationMoreActionEnum,
  EditAgentShowType,
  OpenCloseEnum,
} from '@/types/enums/space';
import {
  AgentBaseInfo,
  AgentComponentInfo,
  AgentConfigInfo,
  AgentConfigUpdateParams,
  ComponentModelBindConfig,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import { FileNode } from '@/types/interfaces/appDev';
import type {
  AnalyzeStatisticsItem,
  BindConfigWithSub,
} from '@/types/interfaces/common';
import type {
  ModelConfigInfo,
  ModelListParams,
} from '@/types/interfaces/model';
import { RequestResponse } from '@/types/interfaces/request';
import {
  IUpdateStaticFileParams,
  StaticFileInfo,
  VncDesktopUpdateFileInfo,
} from '@/types/interfaces/vncDesktop';
import { modalConfirm } from '@/utils/ant-custom';
import { addBaseTarget } from '@/utils/common';
import eventBus from '@/utils/eventBus';
import {
  exportConfigFile,
  exportWholeProjectZip,
} from '@/utils/exportImportFile';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import { useRequest } from 'ahooks';
import { message as messageAntd } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import cloneDeep from 'lodash/cloneDeep';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { history, useModel, useParams } from 'umi';
import PagePreviewIframe from '../../components/business-component/PagePreviewIframe';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import AgentModelSetting from './AgentModelSetting';
import ArrangeTitle from './ArrangeTitle';
import DebugDetails from './DebugDetails';
import styles from './index.less';
import PreviewAndDebug from './PreviewAndDebug';
import SystemUserTipsWord, { SystemUserTipsWordRef } from './SystemTipsWord';

const cx = classNames.bind(styles);

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const params = useParams();
  // 系统/用户提示词组件引用
  const systemUserTipsWordRef = useRef<SystemUserTipsWordRef>(null);
  const spaceId = Number(params.spaceId);
  const agentId = Number(params.agentId);
  const [open, setOpen] = useState<boolean>(false);
  const [openEditAgent, setOpenEditAgent] = useState<boolean>(false);
  const [openAgentModel, setOpenAgentModel] = useState<boolean>(false);
  const { navigationStyle } = useUnifiedTheme();
  // 智能体配置信息
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>();
  const [promptVariables, setPromptVariables] = useState<PromptVariable[]>([]);
  const [promptTools, setPromptTools] = useState<AgentComponentInfo[]>([]);
  const {
    cardList,
    showType,
    setShowType,
    setIsSuggest,
    messageList,
    setChatSuggestList,
    setIsLoadingConversation,
    runQueryConversation,
    // 文件树显隐状态
    isFileTreeVisible,
    // 文件树是否固定（用户点击后固定）
    isFileTreePinned,
    setIsFileTreePinned,
    closePreviewView,
    // 文件树数据
    fileTreeData,
    fileTreeDataLoading,
    // 文件树视图模式
    viewMode,
    // 处理文件列表刷新事件
    handleRefreshFileList,
    openPreviewView,
    openDesktopView,
    restartVncPod,
    restartAgent,
    taskAgentSelectedFileId,
    taskAgentSelectTrigger,
    setIsLoadingOtherInterface,
  } = useModel('conversationInfo');
  const { setTitle } = useModel('tenantConfigInfo');
  const { agentComponentList } = useModel('spaceAgent');

  const [agentStatistics, setAgentStatistics] = useState<
    AnalyzeStatisticsItem[]
  >([]);
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 打开创建临时会话弹窗
  const [openTempChat, setOpenTempChat] = useState<boolean>(false);

  // 获取 chat model 中的页面预览状态
  const { pagePreviewData, hidePagePreview, showPagePreview } =
    useModel('chat');

  // 原始模型列表
  const [originalModelConfigList, setOriginalModelConfigList] = useState<
    ModelConfigInfo[]
  >([]);

  // 查询可使用模型列表接口
  const runMode = async (params: ModelListParams) => {
    const result = await apiModelList(params);
    setOriginalModelConfigList(result?.data || []);
  };

  useEffect(() => {
    // 查询可使用模型列表接口
    runMode({
      spaceId: spaceId,
      modelType: ModelTypeEnum.Chat,
    });
  }, [spaceId]);

  // 查询智能体配置信息
  const { run, loading: loadingAgentConfigInfo } = useRequest(
    apiAgentConfigInfo,
    {
      manual: true,
      debounceWait: 300,
      onSuccess: (result: RequestResponse<AgentConfigInfo>) => {
        setAgentConfigInfo(result?.data);
      },
    },
  );

  useEffect(() => {
    if (loadingAgentConfigInfo) {
      setIsLoadingOtherInterface(true);
    } else {
      setIsLoadingOtherInterface(false);
    }
  }, [loadingAgentConfigInfo]);

  // 查询智能体配置信息
  const { run: runUpdateAgent } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: RequestResponse<AgentConfigInfo>) => {
      const { data } = result;
      const _agentConfigInfo = {
        ...agentConfigInfo,
        pageHomeIndex: data?.pageHomeIndex,
      } as AgentConfigInfo;

      setAgentConfigInfo(_agentConfigInfo);
    },
  });

  useEffect(() => {
    const _variablesInfo = agentComponentList?.find(
      (item: AgentComponentInfo) =>
        item.type === AgentComponentTypeEnum.Variable,
    );
    setPromptVariables(
      transformToPromptVariables(_variablesInfo?.bindConfig?.variables || []),
    );
    setPromptTools(
      agentComponentList
        ?.filter(
          (item: AgentComponentInfo) =>
            item.type === AgentComponentTypeEnum.Plugin ||
            item.type === AgentComponentTypeEnum.Workflow ||
            item.type === AgentComponentTypeEnum.MCP,
        )
        ?.map((item: AgentComponentInfo) => ({
          ...item,
          id: item.targetId || 0,
        })) || [],
    );
  }, [agentComponentList]);

  // 处理变量列表变化，同步到 promptVariables
  const handleVariablesChange = useCallback(
    (variables: BindConfigWithSub[]) => {
      setPromptVariables((prev) => {
        const systemVariables = prev.filter((item) => item.systemVariable);
        return [
          ...systemVariables,
          ...transformToPromptVariables(variables || []),
        ];
      });
    },
    [],
  );

  // 处理工具列表变化，同步到 promptTools
  const handleToolsChange = useCallback(
    (_agentComponentList: AgentComponentInfo[]) => {
      setPromptTools(
        _agentComponentList
          ?.filter(
            (item: AgentComponentInfo) =>
              item.type === AgentComponentTypeEnum.Plugin ||
              item.type === AgentComponentTypeEnum.Workflow ||
              item.type === AgentComponentTypeEnum.MCP,
          )
          ?.map((item: AgentComponentInfo) => ({
            ...item,
            id: item.targetId || 0,
          })) || [],
      );
    },
    [],
  );

  // 更新智能体基础配置信息
  const { runAsync: runUpdate } = useRequest(apiAgentConfigUpdate, {
    manual: true,
    debounceWait: 600,
  });

  useEffect(() => {
    run(agentId);
    // runComponentList(agentId);
    // 设置页面title
    setTitle();
  }, [agentId]);

  useEffect(() => {
    addBaseTarget();
  }, []);

  // 确认编辑智能体
  const handlerConfirmEditAgent = (info: AgentBaseInfo) => {
    const _agentConfigInfo = {
      ...agentConfigInfo,
      ...info,
    } as AgentConfigInfo;
    setAgentConfigInfo(_agentConfigInfo);
    setOpenEditAgent(false);
  };

  /**
   * 更新智能体绑定模型
   * @param targetId: 会话模型ID
   * @param name: 会话模型名称
   * @param config: 模型配置信息
   */
  const handleSetModel = (
    targetId: number | null,
    name: string,
    config: ComponentModelBindConfig,
  ) => {
    // 关闭弹窗
    setOpenAgentModel(false);
    // 更新智能体配置信息
    const _agentConfigInfo = cloneDeep(agentConfigInfo) as AgentConfigInfo;
    _agentConfigInfo.modelComponentConfig.bindConfig = config;
    _agentConfigInfo.modelComponentConfig.targetId = targetId;
    _agentConfigInfo.modelComponentConfig.name = name;
    setAgentConfigInfo(_agentConfigInfo);
  };

  // 更新智能体配置信息
  const handleUpdateEventQuestions = (
    value: string | string[] | number | GuidQuestionDto[],
    attr: string,
  ) => {
    // 更新智能体配置信息
    const _agentConfigInfo = {
      ...agentConfigInfo,
      [attr]: value,
    } as AgentConfigInfo;

    // 已发布的智能体，修改时需要更新修改时间
    if (_agentConfigInfo.publishStatus === PublishStatusEnum.Published) {
      _agentConfigInfo.modified = dayjs().toString();
    }

    setAgentConfigInfo(_agentConfigInfo);

    // 预置问题, 并且没有消息时，更新建议预置问题列表
    if (attr === 'guidQuestionDtos' && !messageList?.length) {
      const _suggestList = value as GuidQuestionDto[];
      // 过滤掉空值
      const list =
        _suggestList?.filter((item) => !!item.info)?.map((item) => item.info) ||
        [];
      setChatSuggestList(list);
    }

    // 返回更新后的智能体配置信息
    return _agentConfigInfo;
  };

  // 更新智能体信息
  const handleChangeAgent = useCallback(
    async (
      value: string | string[] | number | GuidQuestionDto[],
      attr: string,
    ) => {
      // 获取当前配置信息
      const currentConfig = agentConfigInfo;

      // 如果配置信息还未加载，跳过处理
      if (!currentConfig) {
        console.log('[EditAgent] 配置信息尚未加载，跳过更新:', attr);
        return;
      }

      // 检查值是否有实际变化，避免不必要的API调用
      const currentValue = currentConfig[attr as keyof AgentConfigInfo];

      // 对于字符串类型，进行深度比较
      if (typeof value === 'string' && typeof currentValue === 'string') {
        // 如果值相同（都为空字符串或值相等），不触发更新
        if (value === currentValue) {
          return;
        }
      }

      // 对于数组类型（如guidQuestionDtos），进行深度比较
      if (Array.isArray(value) && Array.isArray(currentValue)) {
        if (JSON.stringify(value) === JSON.stringify(currentValue)) {
          console.log('[EditAgent] 数组值无变化，跳过API调用:', attr);
          return;
        }
      }

      // 对于布尔值，直接比较
      if (typeof value === 'boolean' && typeof currentValue === 'boolean') {
        if (value === currentValue) {
          console.log('[EditAgent] 布尔值无变化，跳过API调用:', attr);
          return;
        }
      }

      // 对于数字类型，直接比较
      if (typeof value === 'number' && typeof currentValue === 'number') {
        if (value === currentValue) {
          console.log('[EditAgent] 数字值无变化，跳过API调用:', attr);
          return;
        }
      }

      // 更新智能体配置信息
      const _agentConfigInfo = handleUpdateEventQuestions(value, attr);
      // 用户问题建议
      if (attr === 'openSuggest') {
        setIsSuggest(value === OpenCloseEnum.Open);
      }
      // 打开扩展页面时，检查页面是否存在
      // 展开页面区在删除页面后重新添加没有后端接口没有返回添加的页面地址，需要前端手动刷新
      if (attr === 'expandPageArea') {
        runUpdateAgent(agentId);
      }

      const {
        id,
        name,
        description,
        icon,
        userPrompt,
        openSuggest,
        systemPrompt,
        suggestPrompt,
        openingChatMsg,
        openScheduledTask,
        openLongMemory,
        expandPageArea,
        guidQuestionDtos,
      } = _agentConfigInfo;

      const params = {
        id,
        name,
        description,
        icon,
        systemPrompt,
        userPrompt,
        openSuggest,
        suggestPrompt,
        openingChatMsg,
        openScheduledTask,
        openLongMemory,
        expandPageArea,
        guidQuestionDtos,
      } as AgentConfigUpdateParams;

      // 更新智能体信息
      await runUpdate(params);

      // 获取消息列表长度
      const messageListLength = messageList?.length || 0;

      /**
       * 更新开场白预置问题列表, 当消息列表长度小于等于1时，更新开场白预置问题列表，
       * 如果消息长度等于1，此消息是由开场白内容由后端填充的，所以需要同步更新
       */
      if (
        (attr === 'openingChatMsg' && messageListLength <= 1) ||
        (attr === 'guidQuestionDtos' && messageListLength === 1)
      ) {
        if (agentConfigInfo) {
          const { devConversationId } = agentConfigInfo;
          setIsLoadingConversation(false);
          // 查询会话
          runQueryConversation(devConversationId);
        }
      }
    },
    [agentConfigInfo], // 添加依赖
  );

  /**
   * 处理插入系统提示词
   * @param text 要插入的文本内容
   */
  const handleInsertSystemPrompt = (text: string) => {
    systemUserTipsWordRef.current?.insertText(text);
  };

  useEffect(() => {
    if (pagePreviewData) {
      setShowType(EditAgentShowType.Hide);
    }
  }, [pagePreviewData]);

  useEffect(() => {
    // 如果文件树可见，则关闭展示台
    if (isFileTreeVisible) {
      setShowType(EditAgentShowType.Hide);
    }
  }, [isFileTreeVisible]);

  // 发布智能体
  const handleConfirmPublish = () => {
    setOpen(false);
    // 同步发布时间和修改时间
    const time = dayjs().toString();
    // 更新智能体配置信息
    const _agentConfigInfo = {
      ...agentConfigInfo,
      publishDate: time,
      modified: time,
      publishStatus: PublishStatusEnum.Published,
    } as AgentConfigInfo;
    setAgentConfigInfo(_agentConfigInfo);
  };

  // 获取开发会话ID
  const devConversationId = agentConfigInfo?.devConversationId;

  useEffect(() => {
    if (!devConversationId) {
      return;
    }
    // 订阅文件列表刷新事件
    eventBus.on(EVENT_TYPE.RefreshFileList, () =>
      handleRefreshFileList(devConversationId),
    );

    return () => {
      // 组件卸载时取消订阅
      eventBus.off(EVENT_TYPE.RefreshFileList, () =>
        handleRefreshFileList(devConversationId),
      );
    };
  }, [devConversationId]);

  // 显示文件树
  const handleFileTreeVisible = () => {
    if (!devConversationId) {
      messageAntd.warning('会话ID不存在，无法打开文件树');
      return;
    }

    // 触发文件列表刷新事件
    openPreviewView(devConversationId);
  };

  // 切换视图模式
  const onViewModeChange = useCallback(
    (mode: 'preview' | 'desktop') => {
      if (!devConversationId) {
        messageAntd.warning('会话ID不存在，无法切换视图模式');
        return;
      }

      if (mode === 'desktop') {
        openDesktopView(devConversationId);
      } else {
        openPreviewView(devConversationId);
      }
    },
    [devConversationId, openPreviewView, openDesktopView],
  );

  // 新建文件（空内容）、文件夹
  const handleCreateFileNode = async (
    fileNode: FileNode,
    newName: string,
  ): Promise<boolean> => {
    if (!devConversationId) {
      messageAntd.error('会话ID不存在，无法新建文件');
      return false;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
      return false;
    }

    // 计算新文件的完整路径：父路径 + 新文件名
    const parentPath = fileNode.parentPath || '';
    const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;

    const newFile: VncDesktopUpdateFileInfo = {
      name: newPath,
      binary: false,
      sizeExceeded: false,
      contents: '',
      renameFrom: '',
      operation: 'create',
      isDir: fileNode.type === 'folder',
    };

    const updatedFilesList: VncDesktopUpdateFileInfo[] = [newFile];

    const newSkillInfo: IUpdateStaticFileParams = {
      cId: devConversationId,
      files: updatedFilesList,
    };

    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE && devConversationId) {
      handleRefreshFileList(devConversationId);
    }

    return code === SUCCESS_CODE;
  };

  // 删除文件
  const handleDeleteFile = async (fileNode: FileNode): Promise<boolean> => {
    return new Promise((resolve) => {
      modalConfirm(
        '您确定要删除此文件吗?',
        fileNode.name,
        async () => {
          try {
            if (!devConversationId) {
              messageAntd.error('会话ID不存在，无法删除文件');
              resolve(false);
              return;
            }

            // 找到要删除的文件
            const currentFile = fileTreeData?.find(
              (item: StaticFileInfo) => item.fileId === fileNode.id,
            );
            if (!currentFile) {
              messageAntd.error('文件不存在，无法删除');
              resolve(false);
              return;
            }

            // 更新文件操作
            currentFile.operation = 'delete';
            // 更新文件列表
            const updatedFilesList = [
              currentFile,
            ] as VncDesktopUpdateFileInfo[];

            // 更新技能信息
            const newSkillInfo: IUpdateStaticFileParams = {
              cId: devConversationId,
              files: updatedFilesList,
            };
            const { code } = await apiUpdateStaticFile(newSkillInfo);
            if (code === SUCCESS_CODE) {
              handleRefreshFileList(devConversationId);
              messageAntd.success('删除成功');
              resolve(true);
            } else {
              resolve(false);
            }
          } catch (error) {
            console.error('删除文件失败:', error);
            messageAntd.error('删除文件时发生错误');
            resolve(false);
          }
        },
        () => {
          // 用户取消删除
          resolve(false);
        },
      );
    });
  };

  // 确认重命名文件
  const handleConfirmRenameFile = async (
    fileNode: FileNode,
    newName: string,
  ) => {
    if (!devConversationId) {
      messageAntd.error('会话ID不存在，无法重命名文件');
      return false;
    }

    // 更新原始文件列表中的文件名（用于提交更新）
    const updatedFilesList = updateFilesListName(
      fileTreeData || [],
      fileNode,
      newName,
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: IUpdateStaticFileParams = {
      cId: devConversationId,
      files: updatedFilesList as VncDesktopUpdateFileInfo[],
    };

    // 使用文件全量更新逻辑
    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE) {
      handleRefreshFileList(devConversationId);
    }
    return code === SUCCESS_CODE;
  };

  // 保存文件
  const handleSaveFiles = async (
    data: {
      fileId: string;
      fileContent: string;
      originalFileContent: string;
    }[],
  ) => {
    if (!devConversationId) {
      messageAntd.error('会话ID不存在，无法保存文件');
      return false;
    }

    // 更新文件列表(只更新修改过的文件)
    const updatedFilesList = updateFilesListContent(
      fileTreeData || [],
      data,
      'modify',
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: IUpdateStaticFileParams = {
      cId: devConversationId,
      files: updatedFilesList as VncDesktopUpdateFileInfo[],
    };

    // 使用文件全量更新逻辑
    const { code } = await apiUpdateStaticFile(newSkillInfo);
    return code === SUCCESS_CODE;
  };

  /**
   * 处理上传多个文件回调
   */
  const handleUploadMultipleFiles = async (node: FileNode | null) => {
    if (!devConversationId) {
      messageAntd.error('会话ID不存在，无法上传文件');
      return;
    }
    // 两种情况 第一个是文件夹，第二个是文件
    let relativePath = '';

    if (node) {
      if (node.type === 'file') {
        relativePath = node.path.replace(new RegExp(node.name + '$'), ''); //只替换以node.name结尾的部分
      } else {
        relativePath = node.path + '/';
      }
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        document.body.removeChild(input);
        return;
      }

      try {
        // 获取上传的文件列表
        const files = Array.from((e.target as HTMLInputElement).files || []);
        // 获取上传的文件路径列表
        const filePaths = files.map((file) => relativePath + file.name);
        // 直接调用上传接口，使用文件名作为路径
        const { code } = await apiUploadFiles({
          files,
          cId: devConversationId,
          filePaths,
        });
        if (code === SUCCESS_CODE && devConversationId) {
          // 上传成功后，重新查询文件树列表
          handleRefreshFileList(devConversationId);
        }
      } catch (error) {
        console.error('上传失败', error);
      } finally {
        document.body.removeChild(input);
      }
    };

    input.oncancel = () => {
      document.body.removeChild(input);
    };

    input.click();
  };

  // 导出项目
  const handleExportProject = async () => {
    // 检查项目ID是否有效
    if (!devConversationId) {
      messageAntd.error('开发会话ID不存在或无效，无法导出');
      return;
    }

    try {
      const result = await apiDownloadAllFiles(devConversationId);
      const filename = `agent-${agentId}-${devConversationId}.zip`;
      // 导出整个项目压缩包
      exportWholeProjectZip(result, filename);
    } catch (error) {
      console.error('导出项目失败:', error);
      messageAntd.error('导出项目失败，请重试');
    }
  };

  // 设置统计信息
  const handleSetStatistics = (agentInfo: AgentConfigInfo) => {
    const {
      userCount = 0,
      convCount = 0,
      collectCount = 0,
      likeCount = 0,
    } = agentInfo?.agentStatistics || {};
    const analyzeList = [
      {
        label: '对话人数',
        value: userCount,
      },
      {
        label: '对话次数',
        value: convCount,
      },
      {
        label: '收藏用户数',
        value: collectCount,
      },
      {
        label: '点赞次数',
        value: likeCount,
      },
    ];
    setAgentStatistics(analyzeList);
  };

  const handlerClickMore = (type: ApplicationMoreActionEnum) => {
    switch (type) {
      // 分析
      case ApplicationMoreActionEnum.Analyze:
        handleSetStatistics(agentConfigInfo as AgentConfigInfo);
        setOpenAnalyze(true);
        break;
      // 临时会话
      case ApplicationMoreActionEnum.Temporary_Session:
        setOpenTempChat(true);
        break;
      // 导出配置
      case ApplicationMoreActionEnum.Export_Config:
        modalConfirm(
          `导出配置 - ${agentConfigInfo?.name}`,
          '如果内部包含数据表或知识库，数据本身不会导出',
          () => {
            exportConfigFile(
              agentConfigInfo?.id as number,
              AgentComponentTypeEnum.Agent,
            );
            return new Promise((resolve) => {
              setTimeout(resolve, 1000);
            });
          },
        );
        break;
      // 日志
      case ApplicationMoreActionEnum.Log:
        history.push(
          `/space/${spaceId}/library-log?targetType=${
            AgentComponentTypeEnum.Agent
          }&targetId=${agentConfigInfo?.id ?? ''}`,
        );
        break;
    }
  };

  const handleOpenPreview = () => {
    // 判断是否默认展示页面首页
    if (
      agentConfigInfo &&
      agentConfigInfo?.expandPageArea &&
      agentConfigInfo?.pageHomeIndex
    ) {
      // 自动触发预览
      showPagePreview({
        uri: agentConfigInfo?.pageHomeIndex,
        params: {},
      });
    } else {
      showPagePreview(null);
    }
  };

  useEffect(() => {
    handleOpenPreview();
  }, [agentConfigInfo?.expandPageArea, agentConfigInfo?.pageHomeIndex]);

  /**
   * 关闭预览
   */
  const handleClosePreview = (type: EditAgentShowType) => {
    hidePagePreview();
    setShowType(type);
    // 关闭文件树
    closePreviewView();
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <AgentHeader
        agentConfigInfo={agentConfigInfo}
        onToggleShowStand={() =>
          handleClosePreview(EditAgentShowType.Show_Stand)
        }
        onToggleVersionHistory={() =>
          handleClosePreview(EditAgentShowType.Version_History)
        }
        // 点击编辑智能体按钮，打开弹窗
        onEditAgent={() => setOpenEditAgent(true)}
        // 点击发布按钮，打开发布智能体弹窗
        onPublish={() => setOpen(true)}
        onOtherAction={handlerClickMore}
      />
      <section
        className={cx(
          'flex',
          'flex-1',
          styles.section,
          `xagi-nav-${navigationStyle}`,
        )}
      >
        {/*编排*/}
        <div
          className={cx('radius-6', 'flex', 'flex-col', styles['edit-info'])}
        >
          {/*编排title*/}
          <ArrangeTitle
            originalModelConfigList={originalModelConfigList}
            agentConfigInfo={agentConfigInfo}
            icon={agentConfigInfo?.modelComponentConfig?.icon}
            modelName={agentConfigInfo?.modelComponentConfig?.name}
            onClick={() => setOpenAgentModel(true)}
          />
          <div
            className={cx(
              'flex-1',
              'flex',
              'overflow-y',
              styles['edit-content'],
            )}
          >
            {/*系统提示词/用户提示词*/}
            <SystemUserTipsWord
              ref={systemUserTipsWordRef}
              agentConfigInfo={agentConfigInfo}
              valueUser={agentConfigInfo?.userPrompt}
              valueSystem={agentConfigInfo?.systemPrompt}
              onChangeUser={(value) => handleChangeAgent(value, 'userPrompt')}
              onChangeSystem={(value) =>
                handleChangeAgent(value, 'systemPrompt')
              }
              onReplace={(value) => handleChangeAgent(value!, 'systemPrompt')}
              variables={promptVariables}
              skills={promptTools}
            />
            {/*配置区域*/}
            <AgentArrangeConfig
              agentId={agentId}
              agentConfigInfo={agentConfigInfo}
              onChangeAgent={handleChangeAgent}
              onInsertSystemPrompt={handleInsertSystemPrompt}
              onVariablesChange={handleVariablesChange}
              onToolsChange={handleToolsChange}
            />
          </div>
        </div>

        {(!agentConfigInfo?.hideChatArea ||
          pagePreviewData ||
          isFileTreeVisible) && (
          <div
            // className={cx(isFileTreeVisible && 'flex-1')}
            style={{
              flex: pagePreviewData || isFileTreeVisible ? '9 1' : '4 1',
              minWidth:
                pagePreviewData || isFileTreeVisible ? '1050px' : '350px',
            }}
          >
            {/*预览与调试和预览页面*/}
            <ResizableSplit
              minRightWidth={700}
              left={
                agentConfigInfo?.hideChatArea ? null : (
                  <PreviewAndDebug
                    agentConfigInfo={agentConfigInfo}
                    agentId={agentId}
                    onPressDebug={() =>
                      handleClosePreview(EditAgentShowType.Debug_Details)
                    }
                    onAgentConfigInfo={setAgentConfigInfo}
                    onOpenPreview={handleOpenPreview}
                    // 打开文件面板
                    onOpenFilePanel={handleFileTreeVisible}
                  />
                )
              }
              right={
                agentConfigInfo?.type !== AgentTypeEnum.TaskAgent
                  ? pagePreviewData && ( // 问答型
                      <PagePreviewIframe
                        pagePreviewData={pagePreviewData}
                        showHeader={true}
                        onClose={hidePagePreview}
                        showCloseButton={!agentConfigInfo?.hideChatArea}
                        titleClassName={cx(styles['title-style'])}
                      />
                    )
                  : isFileTreeVisible && // 文件树侧边栏 - 只在文件树可见时显示
                    devConversationId && (
                      <div
                        className={cx(
                          styles['file-tree-sidebar'],
                          styles['flex-2'],
                          'flex',
                        )}
                      >
                        {/*文件树侧边栏 - 只在文件树可见时显示 */}
                        <FileTreeView
                          headerClassName={styles['file-tree-header']}
                          taskAgentSelectedFileId={taskAgentSelectedFileId}
                          taskAgentSelectTrigger={taskAgentSelectTrigger}
                          originalFiles={fileTreeData}
                          fileTreeDataLoading={fileTreeDataLoading}
                          targetId={devConversationId.toString()}
                          viewMode={viewMode}
                          readOnly={false}
                          // 切换视图、远程桌面模式
                          onViewModeChange={onViewModeChange}
                          // 导出项目
                          onExportProject={handleExportProject}
                          // 上传文件
                          onUploadFiles={handleUploadMultipleFiles}
                          // 重命名文件
                          onRenameFile={handleConfirmRenameFile}
                          // 新建文件、文件夹
                          onCreateFileNode={handleCreateFileNode}
                          // 删除文件
                          onDeleteFile={handleDeleteFile}
                          // 保存文件
                          onSaveFiles={handleSaveFiles}
                          // 重启容器
                          onRestartServer={() =>
                            restartVncPod(devConversationId)
                          }
                          // 重启智能体
                          onRestartAgent={() => restartAgent(devConversationId)}
                          // 关闭整个面板
                          onClose={closePreviewView}
                          // 文件树是否固定（用户点击后固定）
                          isFileTreePinned={isFileTreePinned}
                          // 文件树固定状态变化回调
                          onFileTreePinnedChange={setIsFileTreePinned}
                        />
                      </div>
                    )
              }
            />
          </div>
        )}

        {/*调试详情*/}
        <DebugDetails
          visible={showType === EditAgentShowType.Debug_Details}
          onClose={() => setShowType(EditAgentShowType.Hide)}
        />
        {/*展示台*/}
        <ShowStand
          cardList={cardList}
          visible={showType === EditAgentShowType.Show_Stand}
          onClose={() => setShowType(EditAgentShowType.Hide)}
        />
        {/*版本历史*/}
        <VersionHistory
          targetId={agentId}
          targetName={agentConfigInfo?.name}
          targetType={AgentComponentTypeEnum.Agent}
          permissions={agentConfigInfo?.permissions || []}
          visible={showType === EditAgentShowType.Version_History}
          onClose={() => setShowType(EditAgentShowType.Hide)}
        />
      </section>
      {/*发布智能体弹窗*/}
      <PublishComponentModal
        targetId={agentId}
        open={open}
        spaceId={spaceId}
        category={agentConfigInfo?.category}
        // 取消发布
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirmPublish}
      />
      {/*编辑智能体弹窗*/}
      <CreateAgent
        type={agentConfigInfo?.type as AgentTypeEnum}
        spaceId={spaceId}
        mode={CreateUpdateModeEnum.Update}
        agentConfigInfo={agentConfigInfo}
        open={openEditAgent}
        onCancel={() => setOpenEditAgent(false)}
        onConfirmUpdate={handlerConfirmEditAgent}
      />
      {/*智能体模型设置*/}
      <AgentModelSetting
        originalModelConfigList={originalModelConfigList}
        spaceId={spaceId}
        agentConfigInfo={agentConfigInfo}
        modelComponentConfig={
          agentConfigInfo?.modelComponentConfig as AgentComponentInfo
        }
        open={openAgentModel}
        devConversationId={agentConfigInfo?.devConversationId}
        onCancel={handleSetModel}
      />
      {/*分析统计弹窗*/}
      <AnalyzeStatistics
        open={openAnalyze}
        onCancel={() => setOpenAnalyze(false)}
        title="智能体概览"
        list={agentStatistics}
      />
      {/* 临时会话弹窗 */}
      <CreateTempChatModal
        agentId={agentConfigInfo?.id}
        open={openTempChat}
        name={agentConfigInfo?.name}
        onCancel={() => setOpenTempChat(false)}
      />
    </div>
  );
};

export default EditAgent;
