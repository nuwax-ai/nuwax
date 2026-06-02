import type { PromptVariable } from '@/components/TiptapVariableInput/types';
import AgentGitVersionRecordPanel from '@/pages/ConversationAgent/AgentGitVersionRecordPanel';
import AgentArrangeConfig from '@/pages/EditAgent/AgentArrangeConfig';
import ArrangeTitle from '@/pages/EditAgent/ArrangeTitle';
import SystemUserTipsWord, {
  SystemUserTipsWordRef,
} from '@/pages/EditAgent/SystemTipsWord';
import { dict } from '@/services/i18nRuntime';
import {
  AgentComponentInfo,
  AgentConfigInfo,
  GuidQuestionDto,
} from '@/types/interfaces/agent';
import type { BindConfigWithSub } from '@/types/interfaces/common';
import type { ModelConfigInfo } from '@/types/interfaces/model';
import type { GitCommitRecordItem } from '@/types/interfaces/vncDesktop';
import classNames from 'classnames';
import React, { RefObject, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 编排面板顶部 Tab */
export type AgentArrangePanelTabKey = 'config' | 'debug' | 'version';

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
  /** 调试 Tab：智能体聊天面板（由父页面注入） */
  debugPanel?: React.ReactNode;
  /** 开发会话 ID，版本 Tab 拉取 Git 提交记录 */
  devConversationId?: number;
  /** 查看某次提交的代码变更 */
  onViewCommitChanges?: (commit: GitCommitRecordItem) => void;
  /** Git 回滚成功后刷新文件等 */
  onCommitRollbackSuccess?: () => void;
  /** 自定义容器类名 */
  className?: string;
}

/**
 * 智能体编排配置面板
 * 顶部 Tab：配置 / 调试 / 版本；配置区为模型与编排，调试区为对话预览
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
  debugPanel,
  devConversationId,
  onViewCommitChanges,
  onCommitRollbackSuccess,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<AgentArrangePanelTabKey>('config');

  const tabItems = useMemo(
    () =>
      [
        {
          key: 'config' as const,
          label: dict('PC.Pages.ConversationAgent.ArrangePanel.tabConfig'),
        },
        {
          key: 'debug' as const,
          label: dict('PC.Pages.ConversationAgent.ArrangePanel.tabDebug'),
        },
        {
          key: 'version' as const,
          label: dict('PC.Pages.ConversationAgent.ArrangePanel.tabVersion'),
        },
      ] as const,
    [],
  );

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
      <div className={cx(styles['panel-tabs'])}>
        {tabItems.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={cx(styles['panel-tab'], {
              [styles['panel-tab-active']]: activeTab === tab.key,
            })}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={cx(styles['panel-body'])}>
        {activeTab === 'config' && (
          <>
            <ArrangeTitle
              originalModelConfigList={originalModelConfigList}
              agentConfigInfo={agentConfigInfo}
              icon={agentConfigInfo?.modelComponentConfig?.icon}
              modelName={agentConfigInfo?.modelComponentConfig?.name}
              onClick={onOpenAgentModel}
              onModelChange={onModelChange}
            />
            <div
              className={cx(
                'flex-1',
                'flex',
                'overflow-y',
                styles['edit-content'],
              )}
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
                    onChangeSystem={(value) =>
                      onChangeAgent(value, 'systemPrompt')
                    }
                    onReplace={(value) => onChangeAgent(value!, 'systemPrompt')}
                    variables={promptVariables}
                    skills={promptTools}
                  />
                }
              />
            </div>
          </>
        )}

        {activeTab === 'debug' && (
          <div className={cx(styles['debug-panel'])}>{debugPanel}</div>
        )}

        {activeTab === 'version' && (
          <div className={cx(styles['version-panel'])}>
            <AgentGitVersionRecordPanel
              conversationId={devConversationId}
              defaultAuthor={agentConfigInfo?.name}
              onViewChanges={onViewCommitChanges}
              onRollbackSuccess={onCommitRollbackSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentArrangePanel;
