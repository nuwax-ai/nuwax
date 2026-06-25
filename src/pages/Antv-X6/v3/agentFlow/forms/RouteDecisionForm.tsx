/**
 * RouteDecision（路由决策）属性面板
 *
 * 独立维护，对照 Workflow IntentionNode；后端 type 映射为 IntentRecognition。
 * 路由分支 UI 对齐原型：卡片 + 条件匹配结构化编辑。
 */

import ExpandableInputTextarea from '@/components/ExpandTextArea';
import { ModelSelected } from '@/components/ModelSetting';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import { t } from '@/services/i18nRuntime';
import { InputItemNameEnum } from '@/types/enums/node';
import { InputAndOutConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form } from 'antd';
import React from 'react';
import { useModel } from 'umi';
import { outPutConfigs } from '../../ParamsV3';
import { InputAndOut } from '../../component/commonNode';
import RouteBranchList from './RouteBranchList';

const RouteDecisionForm: React.FC<NodeDisposeProps> = ({ form }) => {
  const { referenceList } = useModel('workflowV3');

  const inputArgs =
    Form.useWatch(InputItemNameEnum.inputArgs, { form, preserve: true }) || [];

  const promptVariables = transformToPromptVariables(
    (inputArgs as InputAndOutConfig[]).filter(
      (item) => !['', null, undefined].includes(item.name),
    ),
    referenceList?.argMap,
  );

  return (
    <div className="model-node-style">
      <Form.Item noStyle>
        <ModelSelected form={form} />
      </Form.Item>

      <div className="node-item-style">
        <InputAndOut
          title={t('PC.Pages.AgentFlowNode.routeInputLabel', '输入')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>

      <div className="node-item-style">
        <ExpandableInputTextarea
          title={t(
            'PC.Pages.AgentFlowNode.routeExtraPromptLabel',
            '补充提示词',
          )}
          inputFieldName="extraPrompt"
          onExpand
          placeholder={t(
            'PC.Pages.AgentFlowNode.routeDecisionExtraPromptPlaceholder',
            '描述路由决策规则...',
          )}
          variables={promptVariables}
        />
      </div>

      <div className="node-item-style">
        <RouteBranchList form={form} argMap={referenceList?.argMap} />
      </div>
    </div>
  );
};

export default RouteDecisionForm;
