import CreateAgent from '@/components/CreateAgent';
import PublishComponentModal from '@/components/PublishComponentModal';
import ResizableSplit from '@/components/ResizableSplit';
import ShowStand from '@/components/ShowStand';
import VersionHistory from '@/components/VersionHistory';
import useUnifiedTheme from '@/hooks/useUnifiedTheme';
import AnalyzeStatistics from '@/pages/SpaceDevelop/AnalyzeStatistics';
import CreateTempChatModal from '@/pages/SpaceDevelop/CreateTempChatModal';
import {
  apiAgentConfigInfo,
  apiAgentConfigUpdate,
} from '@/services/agentConfig';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import {
  ApplicationMoreActionEnum,
  EditAgentShowType,
  OpenCloseEnum,
} from '@/types/enums/space';
import {
  AgentBaseInfo,
  AgentComponentInfo,
  AgentConfigInfo,
  ComponentModelBindConfig,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import { AnalyzeStatisticsItem } from '@/types/interfaces/common';
import { modalConfirm } from '@/utils/ant-custom';
import { addBaseTarget } from '@/utils/common';
import { exportConfigFile } from '@/utils/exportImportFile';
import classNames from 'classnames';
import dayjs from 'dayjs';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useRef, useState } from 'react';
import { history, useModel, useParams, useRequest } from 'umi';
import PagePreviewIframe from '../../components/business-component/PagePreviewIframe';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import AgentModelSetting from './AgentModelSetting';
import ArrangeTitle from './ArrangeTitle';
import DebugDetails from './DebugDetails';
import styles from './index.less';
import PreviewAndDebug from './PreviewAndDebug';
import SystemTipsWord, { SystemTipsWordRef } from './SystemTipsWord';

const cx = classNames.bind(styles);

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const params = useParams();
  // 系统提示词组件引用
  const systemTipsWordRef = useRef<SystemTipsWordRef>(null);
  const spaceId = Number(params.spaceId);
  const agentId = Number(params.agentId);
  const [open, setOpen] = useState<boolean>(false);
  const [openEditAgent, setOpenEditAgent] = useState<boolean>(false);
  const [openAgentModel, setOpenAgentModel] = useState<boolean>(false);
  const { navigationStyle } = useUnifiedTheme();
  // 智能体配置信息
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>();
  const {
    cardList,
    showType,
    setShowType,
    setIsSuggest,
    messageList,
    setChatSuggestList,
    // setMessageList,
  } = useModel('conversationInfo');
  const { setTitle } = useModel('tenantConfigInfo');

  // 获取 chat model 中的页面预览状态
  const chatModel = useModel('chat');
  const { pagePreviewData, hidePagePreview, showPagePreview } = chatModel;

  // 查询智能体配置信息
  const { run } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentConfigInfo) => {
      setAgentConfigInfo(result);
    },
  });

  const { run: runUpdateAgent } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentConfigInfo) => {
      const _agentConfigInfo = {
        ...agentConfigInfo,
        pageHomeIndex: result.pageHomeIndex,
      } as AgentConfigInfo;

      setAgentConfigInfo(_agentConfigInfo);
    },
  });

  // 更新智能体基础配置信息
  const { run: runUpdate } = useRequest(apiAgentConfigUpdate, {
    manual: true,
    debounceInterval: 1000,
  });

  useEffect(() => {
    run(agentId);
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
    targetId: number,
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
    // @ts-ignore
    // setMessageList(prev => prev.map(item =>
    //   item.id === null ? {...item, text: _agentConfigInfo.openingChatMsg} : item
    // ))

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
  const handleChangeAgent = (
    value: string | string[] | number | GuidQuestionDto[],
    attr: string,
  ) => {
    // 更新智能体配置信息
    const _agentConfigInfo = handleUpdateEventQuestions(value, attr);
    // 用户问题建议
    if (attr === 'openSuggest') {
      setIsSuggest(value === OpenCloseEnum.Open);
    }
    // 打开扩展页面时，检查页面是否存在
    // 展开页面区在删除页面后重新添加没有后端接口没有返回添加的页面地址，需要前端手动刷新
    if (attr === 'expandPageArea' && agentConfigInfo?.pageHomeIndex === null) {
      runUpdateAgent(agentId, 'pageHomeIndex');
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

    // 更新智能体信息
    runUpdate({
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
    });
  };

  /**
   * 处理插入系统提示词
   * @param text 要插入的文本内容
   */
  const handleInsertSystemPrompt = (text: string) => {
    systemTipsWordRef.current?.insertText(text);
  };

  // 调试
  const handlePressDebug = () => {
    // 如果当前显示的是页面预览，先关闭页面预览
    if (pagePreviewData) {
      hidePagePreview();
    }

    // 切换调试面板
    if (showType === EditAgentShowType.Debug_Details) {
      setShowType(EditAgentShowType.Hide);
    } else {
      setShowType(EditAgentShowType.Debug_Details);
    }
  };

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
  const [agentStatistics, setAgentStatistics] = useState<
    AnalyzeStatisticsItem[]
  >([]);
  // 打开分析弹窗
  const [openAnalyze, setOpenAnalyze] = useState<boolean>(false);
  // 打开创建临时会话弹窗
  const [openTempChat, setOpenTempChat] = useState<boolean>(false);

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
        history.push(`/space/${spaceId}/${agentConfigInfo?.id}/log`);
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
        name: '页面预览',
        uri: process.env.BASE_URL + agentConfigInfo?.pageHomeIndex,
        params: {},
        executeId: '',
      });
    } else {
      showPagePreview(null);
    }
  };

  useEffect(() => {
    handleOpenPreview();
  }, [agentConfigInfo?.expandPageArea, agentConfigInfo?.pageHomeIndex]);

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <AgentHeader
        agentConfigInfo={agentConfigInfo}
        onToggleShowStand={() => setShowType(EditAgentShowType.Show_Stand)}
        onToggleVersionHistory={() =>
          setShowType(EditAgentShowType.Version_History)
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
            {/*系统提示词*/}
            <SystemTipsWord
              ref={systemTipsWordRef}
              agentConfigInfo={agentConfigInfo}
              value={agentConfigInfo?.systemPrompt}
              onChange={(value) => handleChangeAgent(value, 'systemPrompt')}
              onReplace={(value) => handleChangeAgent(value!, 'systemPrompt')}
            />
            {/*配置区域*/}
            <AgentArrangeConfig
              agentId={agentId}
              agentConfigInfo={agentConfigInfo}
              onChangeAgent={handleChangeAgent}
              onConfirmUpdateEventQuestions={handleUpdateEventQuestions}
              onInsertSystemPrompt={handleInsertSystemPrompt}
            />
          </div>
        </div>

        {(!agentConfigInfo?.hideChatArea || pagePreviewData) && (
          <div style={{ flex: pagePreviewData ? '9 1' : '4 1' }}>
            {/*预览与调试和预览页面*/}
            <ResizableSplit
              left={
                agentConfigInfo?.hideChatArea ? null : (
                  <PreviewAndDebug
                    agentConfigInfo={agentConfigInfo}
                    agentId={agentId}
                    onPressDebug={handlePressDebug}
                    onAgentConfigInfo={setAgentConfigInfo}
                    onOpenPreview={handleOpenPreview}
                  />
                )
              }
              right={
                pagePreviewData && (
                  <PagePreviewIframe
                    pagePreviewData={pagePreviewData}
                    showHeader={true}
                    onClose={hidePagePreview}
                    showCloseButton={!agentConfigInfo?.hideChatArea}
                    titleClassName={cx(styles['title-style'])}
                  />
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
        spaceId={spaceId}
        mode={CreateUpdateModeEnum.Update}
        agentConfigInfo={agentConfigInfo}
        open={openEditAgent}
        onCancel={() => setOpenEditAgent(false)}
        onConfirmUpdate={handlerConfirmEditAgent}
      />
      {/*智能体模型设置*/}
      <AgentModelSetting
        spaceId={spaceId}
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
