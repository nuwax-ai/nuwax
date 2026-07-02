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
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { t } from '@/services/i18nRuntime';
import { InputItemNameEnum } from '@/types/enums/node';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form, Input, InputNumber } from 'antd';
import React from 'react';
import { useModel } from 'umi';
import { outPutConfigs } from '../../ParamsV3';
import { InputAndOut } from '../../component/commonNode';

const AgentNodeForm: React.FC<NodeDisposeProps> = ({ form, nodeConfig }) => {
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
        <InputAndOut
          title={t('PC.Pages.AgentFlowNode.agentInputLabel', '入参')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>

      <div className="node-item-style">
        <ExpandableInputTextarea
          title={t('PC.Pages.AgentFlowNode.extraPromptLabel', '补充提示词')}
          inputFieldName="extraPrompt"
          onExpand
          placeholder={t(
            'PC.Pages.AgentFlowNode.extraPromptPlaceholder',
            '请输入补充提示词，进一步对智能体行为进行约束',
          )}
          variables={promptVariables}
        />
      </div>

      {/* 自循环配置暂时隐藏 */}
      <div style={{ display: 'none' }}>
        <div className="node-item-style">
          <Form.Item
            name="selfLoopTimes"
            label={t(
              'PC.Pages.AgentFlowNode.selfLoopTimesLabel',
              '自身循环次数',
            )}
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
      </div>
    </>
  );
};

export default AgentNodeForm;
