/**
 * Agent 节点属性面板
 *
 * 数据格式（与后端对齐）：
 * - agentId: Long            智能体ID（添加节点弹窗选定，当前空间已发布 ChatBot）
 * - inputArgs: ArgItem[]     入参（引用上游变量，对照开始节点）
 * - extraPrompt: String      补充提示词
 * - selfLoopTimes: int       自身循环次数
 * - reminderPrompt: String   循环提醒提示词
 */

import ExpandableInputTextarea from '@/components/ExpandTextArea';
import CustomTree from '@/components/FormListItem/NestedForm';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { t } from '@/services/i18nRuntime';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form, Input, InputNumber } from 'antd';
import React from 'react';
import { useModel } from 'umi';

const AgentNodeForm: React.FC<NodeDisposeProps> = ({
  form,
  nodeConfig,
  id,
  type,
}) => {
  const { referenceList } = useModel('workflowV3');

  const inputArgs =
    Form.useWatch('inputArgs', { form, preserve: true }) ||
    nodeConfig?.inputArgs ||
    [];

  const promptVariables = transformToPromptVariables(
    (inputArgs as InputAndOutConfig[]).filter(
      (item) => !['', null, undefined].includes(item.name),
    ),
    referenceList?.argMap,
  );

  return (
    <>
      {/* agentId：添加节点时于 Created 弹窗绑定，属性面板只读保留 */}
      <Form.Item name="agentId" hidden>
        <Input />
      </Form.Item>

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
