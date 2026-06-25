/**
 * Agent 节点属性面板
 *
 * 数据格式（与后端对齐）：
 * - agentId: Long       智能体ID（当前空间内选择）
 * - inputArgs: ArgItem[] 入参（对照开始节点）
 * - extraPrompt: String  补充提示词
 * - selfLoopTimes: int   自身循环次数
 * - reminderPrompt: String 循环提醒提示词
 *
 * 样式对齐 Workflow V3：node-item-style 分区
 */

import ExpandableInputTextarea from '@/components/ExpandTextArea';
import CustomTree from '@/components/FormListItem/NestedForm';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { apiAgentConfigList } from '@/services/agentConfig';
import { t } from '@/services/i18nRuntime';
import type { AgentConfigInfo } from '@/types/interfaces/agent';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form, InputNumber, Select, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { useModel, useParams } from 'umi';

const AgentNodeForm: React.FC<NodeDisposeProps> = ({
  form,
  nodeConfig,
  id,
  type,
}) => {
  const { referenceList } = useModel('workflowV3');
  const params = useParams<{ spaceId?: string }>();
  const spaceId = Number(params.spaceId);
  const [agents, setAgents] = useState<AgentConfigInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const inputArgs =
    Form.useWatch('inputArgs', { form, preserve: true }) ||
    nodeConfig?.inputArgs ||
    [];

  useEffect(() => {
    if (!spaceId || Number.isNaN(spaceId)) return;
    let cancelled = false;
    setLoading(true);
    apiAgentConfigList(spaceId)
      .then((res) => {
        if (cancelled) return;
        setAgents(res?.data || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const promptVariables = transformToPromptVariables(
    (inputArgs as InputAndOutConfig[]).filter(
      (item) => !['', null, undefined].includes(item.name),
    ),
    referenceList?.argMap,
  );

  return (
    <>
      <div className="node-item-style">
        <Form.Item
          name="agentId"
          label={t('PC.Pages.AgentFlowNode.agentIdLabel', '智能体')}
          rules={[{ required: true }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t(
              'PC.Pages.AgentFlowNode.agentIdPlaceholder',
              '选择当前空间内的智能体',
            )}
            loading={loading}
            notFoundContent={
              loading ? (
                <Spin size="small" />
              ) : (
                t('PC.Pages.AgentFlowNode.agentIdEmpty', '暂无智能体')
              )
            }
            options={agents.map((a) => ({
              label: a.name || `#${a.id}`,
              value: a.id,
            }))}
          />
        </Form.Item>
      </div>

      <div className="node-item-style">
        <Form.Item name="inputArgs">
          <CustomTree
            key={`${type}-${id}-inputArgs`}
            title={t('PC.Pages.AgentFlowNode.agentInputLabel', '入参')}
            inputItemName="inputArgs"
            params={nodeConfig?.inputArgs || []}
            form={form}
            showCheck
          />
        </Form.Item>
      </div>

      <div className="node-item-style">
        <ExpandableInputTextarea
          title={t('PC.Pages.AgentFlowNode.extraPromptLabel', '补充提示词')}
          inputFieldName="extraPrompt"
          onExpand
          placeholder={t(
            'PC.Pages.AgentFlowNode.extraPromptPlaceholder',
            '可添加提示词约束智能体输出格式...',
          )}
          variables={promptVariables}
        />
      </div>

      <div className="node-item-style">
        <Form.Item
          name="selfLoopTimes"
          label={t('PC.Pages.AgentFlowNode.selfLoopTimesLabel', '自身循环次数')}
          tooltip={t(
            'PC.Pages.AgentFlowNode.selfLoopTimesTooltip',
            '智能体自循环执行的次数，0 表示不循环',
          )}
          initialValue={0}
        >
          <InputNumber
            min={0}
            max={100}
            precision={0}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </div>

      <div className="node-item-style">
        <ExpandableInputTextarea
          title={t(
            'PC.Pages.AgentFlowNode.reminderPromptLabel',
            '循环提醒提示词',
          )}
          inputFieldName="reminderPrompt"
          onExpand
          placeholder={t(
            'PC.Pages.AgentFlowNode.reminderPromptPlaceholder',
            '循环提醒提示词...',
          )}
          variables={promptVariables}
        />
      </div>
    </>
  );
};

export default AgentNodeForm;
