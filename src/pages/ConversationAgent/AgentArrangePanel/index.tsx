import type { PromptVariable } from '@/components/TiptapVariableInput/types';
import AgentArrangeConfig from '@/pages/EditAgent/AgentArrangeConfig';
import ArrangeTitle from '@/pages/EditAgent/ArrangeTitle';
import SystemUserTipsWord, {
  SystemUserTipsWordRef,
} from '@/pages/EditAgent/SystemTipsWord';
import {
  AgentComponentInfo,
  AgentConfigInfo,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import type { ModelConfigInfo } from '@/types/interfaces/model';
import classNames from 'classnames';
import React, { RefObject } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AgentArrangePanelProps {
  /** 智能体 ID */
  agentId: number;
  /** 智能体配置信息 */
  agentConfigInfo?: AgentConfigInfo;
  /** 可用模型列表 */
  originalModelConfigList?: ModelConfigInfo[];
  /** 系统提示词组件引用 */
  systemUserTipsWordRef?: RefObject<SystemUserTipsWordRef>;
  /** 提示词变量列表 */
  promptVariables?: PromptVariable[];
  /** 提示词工具列表 */
  promptTools?: AgentComponentInfo[];
  /** 修改智能体配置 */
  onChangeAgent: (
    value: string | string[] | number | GuidQuestionDto[],
    attr: string,
  ) => void;
  /** 插入系统提示词 */
  onInsertSystemPrompt?: (text: string) => void;
  /** 变量列表变化 */
  onVariablesChange?: (variables: BindConfigWithSub[]) => void;
  /** 工具列表变化 */
  onToolsChange?: (tools: AgentComponentInfo[]) => void;
  /** 打开模型设置弹窗 */
  onOpenAgentModel: () => void;
  /** 通用智能体直接切换模型 */
  onModelChange?: (modelId: number, modelName: string) => void;
  /** 自定义容器类名 */
  className?: string;
}

/**
 * 智能体编排配置面板
 * 从 EditAgent 页面提取的公共组件，包含模型选择、提示词编辑和编排配置区域
 */
const AgentArrangePanel: React.FC<AgentArrangePanelProps> = ({
  agentId,
  agentConfigInfo,
  originalModelConfigList,
  systemUserTipsWordRef,
  promptVariables = [],
  promptTools = [],
  onChangeAgent,
  onInsertSystemPrompt,
  onVariablesChange,
  onToolsChange,
  onOpenAgentModel,
  onModelChange,
  className,
}) => {
  return (
    <div
      className={cx(
        styles.panel,
        'radius-6',
        'flex',
        'flex-col',
        'flex-1',
        className,
      )}
    >
      <ArrangeTitle
        originalModelConfigList={originalModelConfigList}
        agentConfigInfo={agentConfigInfo}
        icon={agentConfigInfo?.modelComponentConfig?.icon}
        modelName={agentConfigInfo?.modelComponentConfig?.name}
        onClick={onOpenAgentModel}
        onModelChange={onModelChange}
      />
      <div
        className={cx('flex-1', 'flex', 'overflow-y', styles['edit-content'])}
      >
        <AgentArrangeConfig
          agentId={agentId}
          agentConfigInfo={agentConfigInfo}
          onChangeAgent={onChangeAgent}
          onInsertSystemPrompt={onInsertSystemPrompt}
          onVariablesChange={onVariablesChange}
          onToolsChange={onToolsChange}
          extraComponent={
            <SystemUserTipsWord
              className={cx(styles['prompt-wrapper'], 'w-full')}
              ref={systemUserTipsWordRef}
              agentConfigInfo={agentConfigInfo}
              valueUser={agentConfigInfo?.userPrompt}
              valueSystem={agentConfigInfo?.systemPrompt}
              onChangeUser={(value) => onChangeAgent(value, 'userPrompt')}
              onChangeSystem={(value) => onChangeAgent(value, 'systemPrompt')}
              onReplace={(value) => onChangeAgent(value!, 'systemPrompt')}
              variables={promptVariables}
              skills={promptTools}
            />
          }
        />
      </div>
    </div>
  );
};

export default AgentArrangePanel;
