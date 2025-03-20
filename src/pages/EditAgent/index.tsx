import CreateAgent from '@/components/CreateAgent';
import ShowStand from '@/components/ShowStand';
import VersionHistory from '@/components/VersionHistory';
import {
  apiAgentConfigHistoryList,
  apiAgentConfigInfo,
  apiAgentConfigUpdate,
} from '@/services/agentConfig';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { EditAgentShowType } from '@/types/enums/space';
import {
  AgentBaseInfo,
  AgentComponentInfo,
  AgentConfigInfo,
} from '@/types/interfaces/agent';
import type { HistoryData } from '@/types/interfaces/space';
import { message } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import React, { useEffect, useState } from 'react';
import { useMatch, useModel, useRequest } from 'umi';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import AgentModelSetting from './AgentModelSetting';
import ArrangeTitle from './ArrangeTitle';
import DebugDetails from './DebugDetails';
import styles from './index.less';
import PluginModelSetting from './PluginModelSetting';
import PreviewAndDebug from './PreviewAndDebug';
import PublishAgent from './PublishAgent';
import SystemTipsWord from './SystemTipsWord';

const cx = classNames.bind(styles);

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const match = useMatch('/space/:spaceId/agent/:agentId');
  const { spaceId, agentId } = match.params;
  const [open, setOpen] = useState<boolean>(false);
  const [openEditAgent, setOpenEditAgent] = useState<boolean>(false);
  const [openAgentModel, setOpenAgentModel] = useState<boolean>(false);
  const [openPluginModel, setOpenPluginModel] = useState<boolean>(false);
  // 智能体配置信息
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>(null);
  // 历史版本信息
  const [versionHistory, setVersionHistory] = useState<HistoryData[]>([]);
  const { showType, setShowType } = useModel('conversationInfo');

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
    onSuccess: () => {
      message.success('智能体编辑成功');
    },
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
  }, [agentId]);

  // 确认编辑智能体
  const handlerConfirmEditAgent = (info: AgentBaseInfo) => {
    const _agentConfigInfo = {
      ...agentConfigInfo,
      ...info,
    };
    setAgentConfigInfo(_agentConfigInfo);
    setOpenEditAgent(false);
  };

  // 更新智能体绑定模型
  const handleSelectMode = (id: number, name: string) => {
    const _agentConfigInfo = cloneDeep(agentConfigInfo);
    _agentConfigInfo.modelComponentConfig.targetId = id;
    _agentConfigInfo.modelComponentConfig.name = name;
    setAgentConfigInfo(_agentConfigInfo);
  };

  // 更新智能体信息
  const handleChangeAgent = (value: string, attr: string) => {
    // 更新智能体配置信息
    const _agentConfigInfo = {
      ...agentConfigInfo,
      [attr]: value,
    };
    setAgentConfigInfo(_agentConfigInfo);
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
      openingGuidQuestion,
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
      openingGuidQuestion,
      openLongMemory,
    });
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
              value={agentConfigInfo?.systemPrompt}
              onChange={(value) => handleChangeAgent(value, 'systemPrompt')}
            />
            <div className={cx(styles['h-line'])} />
            {/*配置区域*/}
            <AgentArrangeConfig
              spaceId={spaceId}
              agentId={agentId}
              agentConfigInfo={agentConfigInfo}
              onChangeEnable={handleChangeAgent}
              onSet={() => setOpenPluginModel(true)}
            />
          </div>
        </div>
        {/*预览与调试*/}
        <PreviewAndDebug
          agentConfigInfo={agentConfigInfo}
          agentId={agentId}
          onPressDebug={() => setShowType(EditAgentShowType.Debug_Details)}
        />
        {/*调试详情*/}
        <DebugDetails
          visible={showType === EditAgentShowType.Debug_Details}
          onClose={() => setShowType(EditAgentShowType.Hide)}
        />
        {/*展示台*/}
        <ShowStand
          list={[]}
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
      />
      {/*编辑智能体弹窗*/}
      <CreateAgent
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
      {/*插件设置弹窗*/}
      <PluginModelSetting
        open={openPluginModel}
        onCancel={() => setOpenPluginModel(false)}
      />
    </div>
  );
};

export default EditAgent;
