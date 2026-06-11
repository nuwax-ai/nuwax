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

export interface AgentArrangeConfigSectionProps {
  agentId: number;
  agentConfigInfo?: AgentConfigInfo;
  originalModelConfigList?: ModelConfigInfo[];
  systemUserTipsWordRef?: RefObject<SystemUserTipsWordRef>;
  promptVariables?: PromptVariable[];
  promptTools?: AgentComponentInfo[];
  onChangeAgent: (
    value: string | string[] | number | GuidQuestionDto[],
    attr: string,
  ) => void;
  onInsertSystemPrompt?: (text: string) => void;
  onVariablesChange?: (variables: BindConfigWithSub[]) => void;
  onToolsChange?: (tools: AgentComponentInfo[]) => void;
  onOpenAgentModel: () => void;
  onModelChange?: (modelId: number, modelName: string) => void;
  className?: string;
}

/**
 * 智能体编排配置区（模型、提示词、变量、工具等）
 * 由顶部「编排」页签承载，不再使用编排面板内部 Tab 切换
 */
const AgentArrangeConfigSection: React.FC<AgentArrangeConfigSectionProps> = ({
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
}) => (
  <div className={cx(styles.section, 'flex', 'flex-col', 'flex-1', className)}>
    <ArrangeTitle
      originalModelConfigList={originalModelConfigList}
      agentConfigInfo={agentConfigInfo}
      icon={agentConfigInfo?.modelComponentConfig?.icon}
      modelName={agentConfigInfo?.modelComponentConfig?.name}
      onClick={onOpenAgentModel}
      onModelChange={onModelChange}
    />
    <div className={cx('flex-1', 'flex', 'overflow-y', styles['edit-content'])}>
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

export default AgentArrangeConfigSection;
