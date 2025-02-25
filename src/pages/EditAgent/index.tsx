import CreateAgent from '@/components/CreateAgent';
import VersionHistory from '@/components/VersionHistory';
import {
  apiAgentConfigHistoryList,
  apiAgentConfigInfo,
} from '@/services/agentConfig';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { EditAgentShowType } from '@/types/enums/space';
import {
  AgentBaseInfo,
  AgentComponentInfo,
  AgentConfigInfo,
} from '@/types/interfaces/agent';
import type { HistoryData } from '@/types/interfaces/space';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useMatch, useRequest } from 'umi';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import AgentModelSetting from './AgentModelSetting';
import ArrangeTitle from './ArrangeTitle';
import DebugDetails from './DebugDetails';
import styles from './index.less';
import KnowledgeSetting from './KnowledgeSetting';
import PluginModelSetting from './PluginModelSetting';
import PreviewAndDebug from './PreviewAndDebug';
import PublishAgent from './PublishAgent';
import ShowStand from './ShowStand';
import SystemTipsWord from './SystemTipsWord';

const cx = classNames.bind(styles);

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const match = useMatch('/space/:spaceId/agent/:agentId');
  const { spaceId, agentId } = match.params;
  const [tipsText, setTipsText] = useState<string>('');
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );
  const [open, setOpen] = useState<boolean>(false);
  const [openEditAgent, setOpenEditAgent] = useState<boolean>(false);
  const [openAgentModel, setOpenAgentModel] = useState<boolean>(false);
  const [openPluginModel, setOpenPluginModel] = useState<boolean>(false);
  const [openKnowledgeModel, setOpenKnowledgeModel] = useState<boolean>(false);
  const [agentConfigInfo, setAgentConfigInfo] = useState<AgentConfigInfo>(null);
  const [versionHistory, setVersionHistory] = useState<HistoryData[]>([]);

  // 查询智能体配置信息
  const { run } = useRequest(apiAgentConfigInfo, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: AgentConfigInfo) => {
      setAgentConfigInfo(result);
    },
  });

  // 版本历史记录
  const { run: runHistory } = useRequest(apiAgentConfigHistoryList, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result: HistoryData[]) => {
      setVersionHistory(result);
    },
  });

  useEffect(() => {
    run(agentId);
    runHistory(agentId);
  }, [agentId]);

  const handlerToggleType = (type: EditAgentShowType) => {
    setShowType(type);
  };

  // 点击发布按钮，打开发布智能体弹窗
  const handlerPublishAgent = () => {
    setOpen(true);
  };

  // 取消发布
  const handlerCancelPublish = () => {
    setOpen(false);
  };

  // 点击编辑智能体按钮，打开弹窗
  const handlerEditAgent = () => {
    setOpenEditAgent(true);
  };

  // 确认编辑智能体
  const handlerConfirmEditAgent = (info: AgentBaseInfo) => {
    const _agentConfigInfo = {
      ...agentConfigInfo,
      ...info,
    };
    setAgentConfigInfo(_agentConfigInfo);
    setOpenEditAgent(false);
  };

  // 插件设置
  const handlerPluginSetting = () => {
    setOpenPluginModel(true);
  };

  // 知识库
  const handleKnowledge = () => {
    setOpenKnowledgeModel(true);
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <AgentHeader
        agentConfigInfo={agentConfigInfo}
        onToggleShowStand={() =>
          handlerToggleType(EditAgentShowType.Show_Stand)
        }
        onToggleVersionHistory={() =>
          handlerToggleType(EditAgentShowType.Version_History)
        }
        onEditAgent={handlerEditAgent}
        onPublish={handlerPublishAgent}
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
            modelName={agentConfigInfo?.modelComponentConfig?.name}
            onClick={() => setOpenAgentModel(true)}
          />
          <div className={cx('flex-1', 'flex', 'overflow-y')}>
            {/*系统提示词*/}
            <SystemTipsWord
              placeholder={agentConfigInfo?.systemPrompt}
              value={tipsText}
              onChange={setTipsText}
            />
            <div className={cx(styles['h-line'])} />
            {/*配置区域*/}
            <AgentArrangeConfig
              spaceId={spaceId}
              agentId={agentId}
              onKnowledge={handleKnowledge}
              onSet={handlerPluginSetting}
            />
          </div>
        </div>
        {/*预览与调试*/}
        <PreviewAndDebug
          onPressDebug={() =>
            handlerToggleType(EditAgentShowType.Debug_Details)
          }
        />
        {/*调试详情*/}
        <DebugDetails
          visible={showType === EditAgentShowType.Debug_Details}
          onClose={() => handlerToggleType(EditAgentShowType.Hide)}
        />
        {/*展示台*/}
        <ShowStand
          visible={showType === EditAgentShowType.Show_Stand}
          onClose={() => handlerToggleType(EditAgentShowType.Hide)}
        />
        {/*版本历史*/}
        <VersionHistory
          list={versionHistory}
          visible={showType === EditAgentShowType.Version_History}
          onClose={() => handlerToggleType(EditAgentShowType.Hide)}
        />
      </section>
      {/*发布智能体弹窗*/}
      <PublishAgent
        agentId={agentId}
        open={open}
        onCancel={handlerCancelPublish}
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
      />
      {/*插件设置弹窗*/}
      <PluginModelSetting
        open={openPluginModel}
        onCancel={() => setOpenPluginModel(false)}
      />
      {/*知识库设置*/}
      <KnowledgeSetting
        open={openKnowledgeModel}
        onCancel={() => setOpenKnowledgeModel(false)}
      />
    </div>
  );
};

export default EditAgent;
