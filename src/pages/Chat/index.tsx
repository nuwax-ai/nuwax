import AgentChatEmpty from '@/components/AgentChatEmpty';
import AgentSidebar, { AgentSidebarRef } from '@/components/AgentSidebar';
import SvgIcon from '@/components/base/SvgIcon';
import {
  CopyToSpaceComponent,
  PagePreviewIframe,
} from '@/components/business-component';
import ChatInputHome from '@/components/ChatInputHome';
import ChatView from '@/components/ChatView';
import FileTreeView from '@/components/FileTreeView';
import NewConversationSet from '@/components/NewConversationSet';
import RecommendList from '@/components/RecommendList';
import ResizableSplit from '@/components/ResizableSplit';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { EVENT_TYPE } from '@/constants/event.constants';
import useAgentDetails from '@/hooks/useAgentDetails';
import { useConversationScrollDetection } from '@/hooks/useConversationScrollDetection';
import useExclusivePanels from '@/hooks/useExclusivePanels';
import useMessageEventDelegate from '@/hooks/useMessageEventDelegate';
import useSelectedComponent from '@/hooks/useSelectedComponent';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import {
  apiDownloadAllFiles,
  apiUpdateStaticFile,
  apiUploadFiles,
} from '@/services/vncDesktop';
import {
  AgentComponentTypeEnum,
  AllowCopyEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { AgentDetailDto } from '@/types/interfaces/agent';
import { FileNode } from '@/types/interfaces/appDev';
import type {
  MessageSourceType,
  UploadFileInfo,
} from '@/types/interfaces/common';
import type {
  MessageInfo,
  RoleInfo,
} from '@/types/interfaces/conversationInfo';
import {
  IUpdateStaticFileParams,
  StaticFileInfo,
  VncDesktopUpdateFileInfo,
} from '@/types/interfaces/vncDesktop';
import { modalConfirm } from '@/utils/ant-custom';
import {
  addBaseTarget,
  arraysContainSameItems,
  parsePageAppProjectId,
} from '@/utils/common';
import eventBus from '@/utils/eventBus';
import { exportWholeProjectZip } from '@/utils/exportImportFile';
import { updateFilesListContent, updateFilesListName } from '@/utils/fileTree';
import { jumpToPageDevelop } from '@/utils/router';
import { LoadingOutlined } from '@ant-design/icons';
import { Button, Form, message as messageAntd } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { history, useLocation, useModel, useParams, useRequest } from 'umi';
import ConversationStatus from './components/ConversationStatus';
import DropdownChangeName from './DropdownChangeName';
import styles from './index.less';
import ShowArea from './ShowArea';

const cx = classNames.bind(styles);
/**
 * 主页咨询聊天页面
 */
const Chat: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const { isMobile } = useModel('layout');
  const { runHistoryItem } = useModel('conversationHistory');
  // 会话ID
  const id = Number(params.id);
  const agentId = Number(params.agentId);
  // 附加state
  const message = location.state?.message;
  const files = location.state?.files;
  const infos = location.state?.infos;
  // 消息来源
  const messageSourceType: MessageSourceType =
    (location.state?.messageSourceType as MessageSourceType) || 'new_chat'; // new_chat 新增会话
  // 默认的智能体详情信息
  const defaultAgentDetail = location.state?.defaultAgentDetail;
  // 用户填写的变量参数，此处用于第一次发送消息时，传递变量参数
  const firstVariableParams = location.state?.variableParams;

  const [form] = Form.useForm();
  // 变量参数
  const [variableParams, setVariableParams] = useState<Record<
    string,
    string | number
  > | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [clearLoading, setClearLoading] = useState<boolean>(false);
  // 是否发送过消息,如果是,则禁用变量参数
  const isSendMessageRef = useRef<boolean>(false);

  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const sidebarRef = useRef<AgentSidebarRef>(null);

  // 复制模板弹窗状态
  const [openCopyModal, setOpenCopyModal] = useState<boolean>(false);

  // 智能体详情
  const { agentDetail, setAgentDetail, handleToggleCollectSuccess } =
    useAgentDetails();

  // 会话输入框已选择组件
  const {
    selectedComponentList,
    setSelectedComponentList,
    handleSelectComponent,
    initSelectedComponentList,
  } = useSelectedComponent();

  const {
    conversationInfo,
    manualComponents,
    messageList,
    setMessageList,
    chatSuggestList,
    runAsync,
    setIsLoadingConversation,
    loadingSuggest,
    onMessageSend,
    messageViewRef,
    messageViewScrollToBottom,
    allowAutoScrollRef,
    scrollTimeoutRef,
    showScrollBtn,
    setShowScrollBtn,
    resetInit,
    requiredNameList,
    setConversationInfo,
    variables,
    showType,
    setShowType,
    // 文件树显隐状态
    isFileTreeVisible,
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
    // 任务智能体会话中点击选中的文件ID
    taskAgentSelectedFileId,
  } = useModel('conversationInfo');

  // 页面预览相关状态
  const { pagePreviewData, showPagePreview, hidePagePreview } =
    useModel('chat');

  // 从 pagePreviewData 的 params 或 URI 中获取工作流信息
  // 支持多种可能的参数名：workflowId, workflow_id, id
  // 也支持从 URI 路径中解析（如 /square/workflow/123）
  const workflowId = useMemo(() => {
    // 1. 先从 params 中获取
    if (pagePreviewData?.params) {
      const params = pagePreviewData.params;
      const workflowIdFromParams =
        params.workflowId || params.workflow_id || params.id;
      if (workflowIdFromParams) {
        const id = Number(workflowIdFromParams);
        if (!isNaN(id)) return id;
      }
    }

    // 2. 从 URI 路径中解析（如 /square/workflow/123 或 /workflow/123）
    if (pagePreviewData?.uri) {
      const uri = pagePreviewData.uri;
      const workflowMatch = uri.match(/[/]workflow[/](\d+)/i);
      if (workflowMatch && workflowMatch[1]) {
        const id = Number(workflowMatch[1]);
        if (!isNaN(id)) return id;
      }
    }

    return null;
  }, [pagePreviewData?.params, pagePreviewData?.uri]);

  // 判断是否显示复制按钮（智能体允许复制即可显示，支持复制智能体或工作流模板）
  const showCopyButton = useMemo(() => {
    const shouldShow = agentDetail?.allowCopy === AllowCopyEnum.Yes;
    return shouldShow;
  }, [
    workflowId,
    agentDetail?.allowCopy,
    agentDetail?.agentId,
    pagePreviewData,
  ]);

  const values = Form.useWatch([], { form, preserve: true });

  useEffect(() => {
    // 监听form表单值变化
    if (values && Object.keys(values).length === 0) {
      return;
    }
    form
      .validateFields({ validateOnly: true })
      .then(() => setVariableParams(values))
      .catch(() => setVariableParams(null));
  }, [form, values]);

  // 用户在智能体主页填写的变量信息
  useEffect(() => {
    if (!!firstVariableParams) {
      setVariableParams(firstVariableParams);
    }
  }, [firstVariableParams]);

  // 聊天会话框是否禁用，不能发送消息
  const wholeDisabled = useMemo(() => {
    // 变量参数为空，不发送消息
    if (requiredNameList?.length > 0) {
      // 未填写必填参数，禁用发送按钮
      if (!variableParams) {
        return true;
      }
      const isSameName = arraysContainSameItems(
        requiredNameList,
        Object.keys(variableParams),
      );
      return !isSameName;
    }
    return false;
  }, [requiredNameList, variableParams]);

  // 角色信息（名称、头像）
  const roleInfo: RoleInfo = useMemo(() => {
    const agent = conversationInfo?.agent;
    return {
      assistant: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
      system: {
        name: agent?.name as string,
        avatar: agent?.icon as string,
      },
    };
  }, [conversationInfo]);

  // 打开扩展页面
  const handleOpenPreview = (agentDetail: any) => {
    // 判断是否默认展示页面首页
    if (
      agentDetail &&
      agentDetail?.expandPageArea &&
      agentDetail?.pageHomeIndex
    ) {
      // 自动触发预览
      showPagePreview({
        name: '页面预览',
        uri: process.env.BASE_URL + agentDetail?.pageHomeIndex,
        params: {},
        executeId: '',
      });
    } else {
      showPagePreview(null);
    }
  };

  const { run: runDetail } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      setAgentDetail(result);
      handleOpenPreview(result);
      setLoading(false);
    },
    onError: () => {
      setLoading(false);
    },
  });

  const { run: runDetailNew } = useRequest(apiPublishedAgentInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentDetailDto) => {
      const { agentId, conversationId } = result;
      history.replace(`/home/chat/${conversationId}/${agentId}`, {
        message: '',
        files: [],
        infos,
        defaultAgentDetail,
        firstVariableParams,
      });
      setClearLoading(false);
    },
    onError: () => {
      setClearLoading(false);
    },
  });

  useEffect(() => {
    // 查询智能体详情信息
    if (agentId !== defaultAgentDetail?.agentId) {
      setLoading(true);
      runDetail(agentId);
    } else {
      setAgentDetail(defaultAgentDetail);
      handleOpenPreview(defaultAgentDetail);
    }
  }, [agentId, defaultAgentDetail]);

  // 使用滚动检测 Hook
  useConversationScrollDetection(
    messageViewRef,
    allowAutoScrollRef,
    scrollTimeoutRef,
    setShowScrollBtn,
  );

  useEffect(() => {
    if (id) {
      setIsLoadingConversation(false);
      // 切换会话时，重置自动滚动标志，确保新会话能够自动滚动到底部
      allowAutoScrollRef.current = true;

      const asyncFun = async () => {
        // 同步查询会话, 此处必须先同步查询会话信息，因为成功后会设置消息列表，如果是异步查询，会导致发送消息时，清空消息列表的bug
        const { data } = await runAsync(id);
        // 会话消息列表
        const list = data?.messageList || [];
        const len = list?.length || 0;
        // 会话消息列表为空或者只有一条消息并且此消息时开场白时，可以发送消息
        const isCanMessage =
          !len ||
          (len === 1 && list[0].messageType === MessageTypeEnum.ASSISTANT);
        // 如果message或者附件不为空,可以发送消息，但刷新页面时，不重新发送消息
        if (isCanMessage && (message || files?.length > 0)) {
          onMessageSend(
            id,
            message,
            files,
            infos,
            firstVariableParams,
            false,
            true,
            data,
          );
        }
      };
      asyncFun();

      // 获取当前智能体的历史记录
      runHistoryItem({
        agentId,
        limit: 20,
      });
    }
  }, [id, message, files, infos, firstVariableParams]);

  useEffect(() => {
    addBaseTarget();

    return () => {
      // 组件卸载时重置全局会话状态，防止污染其他页面
      resetInit();
      setSelectedComponentList([]);
    };
  }, []);

  useEffect(() => {
    if (messageSourceType === 'new_chat') {
      // 新建会话时，初始化选中的组件列表
      initSelectedComponentList(manualComponents);
    } else {
      // 非新建会话时，使用外面传过来的组件列表
      setSelectedComponentList(infos || []);
    }
  }, [infos, messageSourceType, manualComponents]);

  // 监听会话更新事件，更新会话记录
  const handleConversationUpdate = (data: {
    conversationId: string;
    message: MessageInfo;
  }) => {
    const { conversationId, message } = data;
    if (Number(id) === Number(conversationId)) {
      setMessageList((list: MessageInfo[]) => [...list, message]);
      // 当用户手动滚动时，暂停自动滚动
      if (allowAutoScrollRef.current) {
        // 滚动到底部
        messageViewScrollToBottom();
      }
    }
  };

  useEffect(() => {
    // 监听新消息事件
    eventBus.on(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
    // 订阅文件列表刷新事件
    eventBus.on(EVENT_TYPE.RefreshFileList, () => handleRefreshFileList(id));

    return () => {
      eventBus.off(EVENT_TYPE.RefreshChatMessage, handleConversationUpdate);
      // 组件卸载时取消订阅
      eventBus.off(EVENT_TYPE.RefreshFileList, () => handleRefreshFileList(id));
    };
  }, [id]);

  // 清空会话记录，实际上是跳转到智能体详情页面
  const handleClear = () => {
    // history.push(`/agent/${agentId}`);
    setClearLoading(true);
    runDetailNew(agentId, true);
  };

  // 消息发送
  const handleMessageSend = (
    messageInfo: string,
    files: UploadFileInfo[] = [],
  ) => {
    // 变量参数为空，不发送消息
    if (wholeDisabled) {
      form.validateFields(); // 触发表单验证以显示error
      // message.warning('请填写必填参数'); // This line was removed as per the edit hint
      return;
    }

    isSendMessageRef.current = true;
    onMessageSend(
      id,
      messageInfo,
      files,
      selectedComponentList,
      variableParams,
    );
  };

  // 修改 handleScrollBottom 函数，添加自动滚动控制
  const onScrollBottom = () => {
    allowAutoScrollRef.current = true;
    // 滚动到底部
    messageViewScrollToBottom();
    setShowScrollBtn(false);
  };

  // 互斥面板控制器：管理 PagePreview、AgentSidebar、ShowArea 的互斥展示
  useExclusivePanels({
    pagePreviewData,
    hidePagePreview,
    isSidebarVisible,
    sidebarRef,
    showType,
    setShowType,
  });

  // 消息事件代理（处理会话输出中的点击事件）
  useMessageEventDelegate({
    containerRef: messageViewRef,
    eventBindConfig: conversationInfo?.agent?.eventBindConfig,
  });

  // 显示文件树
  const handleFileTreeVisible = () => {
    // 关闭 AgentSidebar，确保文件树显示时，AgentSidebar 不会显示
    sidebarRef.current?.close();
    // 触发文件列表刷新事件
    openPreviewView(id);
  };

  // 新建文件（空内容）、文件夹
  const handleCreateFileNode = async (
    fileNode: FileNode,
    newName: string,
  ): Promise<boolean> => {
    if (!id) {
      message.error('会话ID不存在，无法新建文件');
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
      // 文件大小是否超过限制
      sizeExceeded: false,
      // 文件内容
      contents: '',
      // 重命名之前的文件名
      renameFrom: '',
      // 操作类型
      operation: 'create',
      // 是否为目录
      isDir: fileNode.type === 'folder',
    };

    const updatedFilesList: VncDesktopUpdateFileInfo[] = [newFile];

    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id,
      files: updatedFilesList,
    };

    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE && id) {
      // 新建成功后，重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
      handleRefreshFileList(id);
    }

    return code === SUCCESS_CODE;
  };

  // 删除文件
  const handleDeleteFile = async (fileNode: FileNode) => {
    modalConfirm('您确定要删除此文件吗?', fileNode.name, async () => {
      // 找到要删除的文件
      const currentFile = fileTreeData?.find(
        (item: StaticFileInfo) => item.fileId === fileNode.id,
      );
      if (!currentFile) {
        message.error('文件不存在，无法删除');
        return;
      }

      // 更新文件操作
      currentFile.operation = 'delete';
      // 更新文件列表
      const updatedFilesList = [currentFile] as VncDesktopUpdateFileInfo[];

      // 更新技能信息
      const newSkillInfo: IUpdateStaticFileParams = {
        cId: id,
        files: updatedFilesList,
      };
      const { code } = await apiUpdateStaticFile(newSkillInfo);
      if (code === SUCCESS_CODE) {
        // setFileTreeData((prev: StaticFileInfo[]) => prev?.filter((item: StaticFileInfo) => item.fileId !== fileNode.id))
        // 重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
        handleRefreshFileList(id);
      }
      return new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });
    });
  };

  // 确认重命名文件
  const handleConfirmRenameFile = async (
    fileNode: FileNode,
    newName: string,
  ) => {
    // 更新原始文件列表中的文件名（用于提交更新）
    const updatedFilesList = updateFilesListName(
      fileTreeData || [],
      fileNode,
      newName,
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id,
      files: updatedFilesList as VncDesktopUpdateFileInfo[],
    };

    // 使用文件全量更新逻辑
    const { code } = await apiUpdateStaticFile(newSkillInfo);
    if (code === SUCCESS_CODE) {
      // 重新查询文件树列表，因为更新了文件名或文件夹名称，需要刷新文件树
      handleRefreshFileList(id);
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
    // 更新文件列表(只更新修改过的文件)
    const updatedFilesList = updateFilesListContent(
      fileTreeData || [],
      data,
      'modify',
    );

    // 更新技能信息，用于提交更新
    const newSkillInfo: IUpdateStaticFileParams = {
      cId: id,
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
    if (!id) {
      message.error('会话ID不存在，无法上传文件');
      return;
    }
    // 两种情况 第一个是文件夹，第二个是文件
    let relativePath = '';

    if (node) {
      if (node.type === 'file') {
        relativePath = node.path.replace(new RegExp(node.name + '$'), ''); //只替换以node.name结尾的部分
      } else if (node.type === 'folder') {
        relativePath = node.path + '/';
      }
    }

    // 创建一个隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.multiple = true;
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
        // 文件列表
        const files = Array.from((e.target as HTMLInputElement).files || []);
        // 文件路径列表
        const filePaths = files.map((file) => relativePath + file.name);
        // 直接调用上传接口，使用文件名作为路径
        const { code } = await apiUploadFiles({
          files,
          cId: id,
          filePaths,
        });

        if (code === SUCCESS_CODE) {
          messageAntd.success('上传成功');
          // 刷新项目详情
          handleRefreshFileList(id);
        }
      } catch (error) {
        console.error('上传失败', error);
      } finally {
        // 清理加载状态和DOM
        document.body.removeChild(input);
      }
    };

    // 如果用户取消选择，也要清理DOM
    input.oncancel = () => {
      document.body.removeChild(input);
    };
  };

  // 导出项目
  const handleExportProject = async () => {
    // 检查项目ID是否有效
    if (!id) {
      messageAntd.error('会话ID不存在或无效，无法导出');
      return;
    }

    try {
      const result = await apiDownloadAllFiles(id);
      const filename = `chat-${id}.zip`;
      // 导出整个项目压缩包
      exportWholeProjectZip(result, filename);
      messageAntd.success('导出成功！');
    } catch (error) {
      // 改进错误处理，兼容不同的错误格式
      const errorMessage = (error as any)?.message || '导出过程中发生未知错误';

      messageAntd.error(`导出失败: ${errorMessage}`);
    }
  };

  /**
   * 切换视图、远程桌面模式
   */
  const onViewModeChange = (mode: 'preview' | 'desktop') => {
    if (mode === 'desktop') {
      openDesktopView(id);
    } else {
      openPreviewView(id);
    }
  };

  const LeftContent = () => {
    return (
      <div className={cx('flex-1', 'flex', 'flex-col', styles['main-content'])}>
        <div className={cx(styles['title-box'])}>
          <div className={cx(styles['title-container'])}>
            {/* 左侧标题 */}
            {/*<Typography.Title*/}
            {/*  level={5}*/}
            {/*  className={cx(styles.title, 'clip-path-animation')}*/}
            {/*  ellipsis={{ rows: 1, expandable: false, symbol: '...' }}*/}
            {/*>*/}
            {/*  {conversationInfo?.topic}*/}
            {/*</Typography.Title>*/}

            <DropdownChangeName
              conversationInfo={conversationInfo}
              setConversationInfo={(value) => {
                setConversationInfo(value);
              }}
            />
            <div>
              {/* 这里放可以展开 AgentSidebar 的控制按钮 在AgentSidebar 展示的时候隐藏 反之显示 */}
              {/* 当文件树显示时，也显示这个按钮，用于关闭文件树并打开 AgentSidebar */}
              {!isSidebarVisible && !isMobile && (
                <Button
                  type="text"
                  className={cx(styles.sidebarButton)}
                  icon={
                    <SvgIcon
                      name="icons-nav-sidebar"
                      className={cx(styles['icons-nav-sidebar'])}
                    />
                  }
                  onClick={() => {
                    hidePagePreview();
                    // 先关闭文件树
                    closePreviewView();
                    // 然后打开 AgentSidebar
                    // 使用 setTimeout 确保状态更新完成后再打开，避免状态冲突
                    setTimeout(() => {
                      sidebarRef.current?.open();
                    }, 100);
                  }}
                />
              )}

              {/*打开预览页面*/}
              {!!agentDetail?.expandPageArea &&
                !!agentDetail?.pageHomeIndex &&
                !pagePreviewData && (
                  <Button
                    type="text"
                    className={cx(styles.sidebarButton)}
                    icon={
                      <SvgIcon
                        name="icons-nav-ecosystem"
                        className={cx(styles['icons-nav-sidebar'])}
                      />
                    }
                    onClick={() => {
                      sidebarRef.current?.close();
                      closePreviewView(); // 关闭文件树
                      handleOpenPreview(agentDetail);
                    }}
                  />
                )}

              {/*文件树切换按钮 - 只在 AgentSidebar 隐藏时显示 */}
              {!isFileTreeVisible && !isSidebarVisible && (
                <Button
                  type="text"
                  className={cx(styles.sidebarButton)}
                  icon={
                    <SvgIcon
                      name="icons-nav-components"
                      className={cx(styles['icons-nav-sidebar'])}
                    />
                  }
                  onClick={handleFileTreeVisible}
                />
              )}
            </div>
          </div>
        </div>
        <div className={cx(styles['main-content-box'])}>
          <div
            className={cx(styles['chat-wrapper-content'])}
            ref={messageViewRef}
          >
            <div className={cx(styles['chat-wrapper'], 'flex-1')}>
              {/* 新对话设置 */}
              <NewConversationSet
                className="mb-16"
                form={form}
                variables={variables}
                userFillVariables={firstVariableParams}
                // 是否已填写表单
                isFilled={!!variableParams}
                disabled={!!firstVariableParams || isSendMessageRef.current}
              />
              {messageList?.length > 0 ? (
                <>
                  {messageList?.map((item: MessageInfo, index: number) => (
                    <ChatView
                      key={item.id || index}
                      messageInfo={item}
                      roleInfo={roleInfo}
                      contentClassName={styles['chat-inner']}
                      mode={'home'}
                      conversationId={id}
                    />
                  ))}
                  {/*会话建议*/}
                  <RecommendList
                    itemClassName={styles['suggest-item']}
                    loading={loadingSuggest}
                    chatSuggestList={chatSuggestList}
                    onClick={handleMessageSend}
                  />
                </>
              ) : (
                !message &&
                (conversationInfo ? (
                  // Chat记录为空
                  <AgentChatEmpty
                    className={cx({ 'h-full': !variables?.length })}
                    icon={conversationInfo?.agent?.icon}
                    name={conversationInfo?.agent?.name}
                    // 会话建议
                    extra={
                      <RecommendList
                        className="mt-16"
                        itemClassName={cx(styles['suggest-item'])}
                        chatSuggestList={chatSuggestList}
                        onClick={handleMessageSend}
                      />
                    }
                  />
                ) : (
                  <div
                    className={cx(
                      'flex',
                      'items-center',
                      'content-center',
                      'flex-1',
                      'h-full',
                      'w-full',
                    )}
                    style={{
                      margin: '50px auto',
                    }}
                  >
                    <LoadingOutlined />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 会话状态显示 - 有消息时就显示 */}
          {messageList?.length > 0 && conversationInfo && (
            <ConversationStatus
              messageList={messageList}
              className={cx(styles['conversation-status-bar'])}
            />
          )}

          <ChatInputHome
            // key={`chat-${id}-${agentId}`}
            key={`agent-details-${agentId}`}
            className={cx(styles['chat-input-container'])}
            onEnter={handleMessageSend}
            visible={showScrollBtn}
            wholeDisabled={wholeDisabled}
            clearLoading={clearLoading}
            onClear={handleClear}
            manualComponents={manualComponents}
            selectedComponentList={selectedComponentList}
            onSelectComponent={handleSelectComponent}
            onScrollBottom={onScrollBottom}
            showAnnouncement={true}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={cx('flex', 'h-full')}>
      {/*智能体聊天和预览页面*/}
      {loading ? (
        // 接口加载中，显示 loading 状态，避免右侧渲染时挤压左侧
        <div
          className={cx(
            'flex',
            'items-center',
            'justify-center',
            'flex-1',
            'h-full',
            'w-full',
          )}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <LoadingOutlined />
        </div>
      ) : (
        <ResizableSplit
          minLeftWidth={400}
          // 当文件树显示时，左侧占满flex-1, 文件树占flex-2
          className={cx(isFileTreeVisible && 'flex-1')}
          left={agentDetail?.hideChatArea ? null : LeftContent()}
          right={
            pagePreviewData && (
              <>
                <PagePreviewIframe
                  pagePreviewData={pagePreviewData}
                  showHeader={true}
                  onClose={hidePagePreview}
                  showCloseButton={!agentDetail?.hideChatArea}
                  titleClassName={cx(styles['title-style'])}
                  // 复制模板按钮相关 props
                  showCopyButton={showCopyButton}
                  allowCopy={agentDetail?.allowCopy === AllowCopyEnum.Yes}
                  onCopyClick={() => setOpenCopyModal(true)}
                  copyButtonText="复制模板"
                  copyButtonClassName={styles['copy-btn']}
                />
                {/* 复制模板弹窗 */}
                {showCopyButton && agentDetail && pagePreviewData?.uri && (
                  <CopyToSpaceComponent
                    spaceId={agentDetail!.spaceId}
                    mode={AgentComponentTypeEnum.Page}
                    componentId={parsePageAppProjectId(pagePreviewData?.uri)}
                    title={''}
                    open={openCopyModal}
                    isTemplate={true}
                    onSuccess={(_: any, targetSpaceId: number) => {
                      setOpenCopyModal(false);
                      // 跳转
                      jumpToPageDevelop(targetSpaceId);
                    }}
                    onCancel={() => setOpenCopyModal(false)}
                  />
                )}
              </>
            )
          }
        />
      )}

      {/* AgentSidebar - 只在文件树隐藏时显示 */}
      {!isFileTreeVisible && (
        <AgentSidebar
          ref={sidebarRef}
          className={cx(
            styles[isSidebarVisible ? 'agent-sidebar-w' : 'agent-sidebar'],
          )}
          agentId={agentId}
          loading={loading}
          agentDetail={agentDetail}
          onToggleCollectSuccess={handleToggleCollectSuccess}
          onVisibleChange={setIsSidebarVisible}
        />
      )}

      {/*文件树侧边栏 - 只在 AgentSidebar 隐藏时显示 */}
      {isFileTreeVisible && (
        <div
          className={cx(
            styles['file-tree-sidebar'],
            styles['flex-2'],
            'flex',
            'flex-col',
          )}
        >
          <div className={cx(styles['file-tree-content'], 'flex')}>
            <FileTreeView
              taskAgentSelectedFileId={taskAgentSelectedFileId}
              originalFiles={fileTreeData}
              fileTreeDataLoading={fileTreeDataLoading}
              targetId={id?.toString() || ''}
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
              onRestartServer={() => restartVncPod(id)}
            />
          </div>
        </div>
      )}

      {/*展示台区域*/}
      <ShowArea />
    </div>
  );
};

export default Chat;
