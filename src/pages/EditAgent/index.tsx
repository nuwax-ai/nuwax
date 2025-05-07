import CreateAgent from '@/components/CreateAgent';
import ShowStand from '@/components/ShowStand';
import VersionHistory from '@/components/VersionHistory';
import {
  apiAgentConfigHistoryList,
  apiAgentConfigInfo,
  apiAgentConfigUpdate,
} from '@/services/agentConfig';
import { CreateUpdateModeEnum, PublishStatusEnum } from '@/types/enums/common';
import { EditAgentShowType, OpenCloseEnum } from '@/types/enums/space';
import {
  AgentBaseInfo,
  AgentComponentInfo,
  AgentConfigInfo,
} from '@/types/interfaces/agent';
import type { HistoryData } from '@/types/interfaces/space';
import { addBaseTarget } from '@/utils/common';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { useModel, useParams, useRequest } from 'umi';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import AgentModelSetting from './AgentModelSetting';
import ArrangeTitle from './ArrangeTitle';
import DebugDetails from './DebugDetails';
import styles from './index.less';
import PreviewAndDebug from './PreviewAndDebug';
import PublishAgent from './PublishAgent';
import SystemTipsWord from './SystemTipsWord';

const cx = classNames.bind(styles);

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const { spaceId, agentId } = useParams();
  const [open, setOpen] = useState<boolean>(false);
  const [openEditAgent, setOpenEditAgent] = useState<boolean>(false);
  const [openAgentModel, setOpenAgentModel] = useState<boolean>(false);
  // 智能体配置信息
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>();
  // 历史版本信息
  const [versionHistory, setVersionHistory] = useState<HistoryData[]>([]);
  const { cardList, showType, setShowType, setIsSuggest } =
    useModel('conversationInfo');
  const { setTitle } = useModel('tenantConfigInfo');

  // 查询智能体配置信息
  const { run } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: AgentConfigInfo) => {
      setAgentConfigInfo(result);
    },
  });

  // 更新智能体基础配置信息
  const { run: runUpdate } = useRequest(apiAgentConfigUpdate, {
    manual: true,
    debounceInterval: 1000,
  });

  // 版本历史记录
  const { run: runHistory } = useRequest(apiAgentConfigHistoryList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: HistoryData[]) => {
      setVersionHistory(result);
    },
  });

  useEffect(() => {
    run(agentId);
    runHistory(agentId);
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

  // 更新智能体绑定模型
  const handleSelectMode = (id: number, name: string) => {
    const _agentConfigInfo = cloneDeep(agentConfigInfo) as AgentConfigInfo;
    // 智能体组件模型信息可能为null
    if (!_agentConfigInfo?.modelComponentConfig) {
      _agentConfigInfo.modelComponentConfig = {} as AgentComponentInfo;
    }
    _agentConfigInfo.modelComponentConfig.targetId = id;
    _agentConfigInfo.modelComponentConfig.name = name;
    setAgentConfigInfo(_agentConfigInfo);
  };

  // 更新智能体信息
  const handleChangeAgent = (value: string | string[], attr: string) => {
    // 更新智能体配置信息
    const _agentConfigInfo = {
      ...agentConfigInfo,
      [attr]: value,
    } as AgentConfigInfo;

    // 已发布的智能体，修改时需要更新修改时间
    if (_agentConfigInfo.publishStatus === PublishStatusEnum.Published) {
      _agentConfigInfo.modified = moment().toISOString();
    }

    setAgentConfigInfo(_agentConfigInfo);
    // 用户问题建议
    if (attr === 'openSuggest') {
      setIsSuggest(value === OpenCloseEnum.Open);
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
      openingGuidQuestions,
      openLongMemory,
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
      openingGuidQuestions,
      openLongMemory,
    });
  };

  // 调试
  const handlePressDebug = () => {
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
    const time = moment().toISOString();
    // 更新智能体配置信息
    const _agentConfigInfo = {
      ...agentConfigInfo,
      publishDate: time,
      modified: time,
      publishStatus: PublishStatusEnum.Published,
    } as AgentConfigInfo;
    setAgentConfigInfo(_agentConfigInfo);
  };

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
      />
      <section
        className={cx('flex', 'flex-1', 'px-16', 'py-16', styles.section)}
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
          <div className={cx('flex-1', 'flex', 'overflow-y')}>
            {/*系统提示词*/}
            <SystemTipsWord
              agentConfigInfo={agentConfigInfo}
              value={agentConfigInfo?.systemPrompt}
              onChange={(value) => handleChangeAgent(value, 'systemPrompt')}
              onReplace={(value) => handleChangeAgent(value!, 'systemPrompt')}
            />
            <div className={cx(styles['h-line'])} />
            {/*配置区域*/}
            <AgentArrangeConfig
              agentId={agentId}
              agentConfigInfo={agentConfigInfo}
              onChangeAgent={handleChangeAgent}
            />
          </div>
        </div>
        {/*预览与调试*/}
        <PreviewAndDebug
          agentConfigInfo={agentConfigInfo}
          agentId={agentId}
          onPressDebug={handlePressDebug}
        />
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
          list={versionHistory}
          visible={showType === EditAgentShowType.Version_History}
          onClose={() => setShowType(EditAgentShowType.Hide)}
        />
      </section>
      {/*发布智能体弹窗*/}
      <PublishAgent
        agentId={agentId}
        open={open}
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
        onCancel={() => setOpenAgentModel(false)}
        onSelectMode={handleSelectMode}
      />
    </div>
  );
};

export default EditAgent;
