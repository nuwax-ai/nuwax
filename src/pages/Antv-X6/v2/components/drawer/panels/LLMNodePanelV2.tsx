/**
 * V2 LLM 节点配置面板
 * 从 v1 迁移，保持相同的功能和交互方式
 */

import { ModelSelected } from '@/components/ModelSetting';
import { InputItemNameEnum } from '@/types/enums/node';
import { Collapse, Form, InputNumber, Slider, Typography } from 'antd';
import React from 'react';

import CustomTree from '@/components/FormListItem/NestedForm';
import type {
  ChildNodeV2,
  InputAndOutConfigV2,
  NodePreviousAndArgMapV2,
} from '../../../types';
import PromptEditorV2 from '../../common/PromptEditorV2';
import {
  InputAndOutV2,
  outPutConfigsV2,
} from '../../drawer/nodeConfig/commonNodeV2';

const { Text } = Typography;
const { Panel } = Collapse;

export interface LLMNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

// 模型选项（实际应从接口获取）
const MODEL_OPTIONS = [
  { label: 'GPT-4', value: 1 },
  { label: 'GPT-3.5', value: 2 },
  { label: 'Claude', value: 3 },
  { label: 'DeepSeek', value: 4 },
];

const LLMNodePanelV2: React.FC<LLMNodePanelV2Props> = ({
  node,
  referenceData,
}) => {
  const form = Form.useFormInstance();

  // 输入变量
  const variables = (
    Form.useWatch(InputItemNameEnum.inputArgs, {
      form,
      preserve: true,
    }) || []
  ).filter(
    (item: InputAndOutConfigV2) => !['', null, undefined].includes(item.name),
  );

  return (
    <div className="model-node-style-v2">
      {/* 模型模块 */}
      <ModelSelected form={form} modelConfig={node.nodeConfig?.modelConfig} />

      {/* 输入参数 */}
      <div className="node-item-style-v2">
        <InputAndOutV2
          title="输入"
          fieldConfigs={outPutConfigsV2}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
          referenceData={referenceData}
        />
      </div>

      {/* 系统提示词 */}
      <Form.Item name="systemPrompt">
        <PromptEditorV2
          placeholder="系统提示词，可以使用 {{变量名}} {{变量名.子变量名}} {{变量名[索引]}} 引用变量"
          referenceData={referenceData}
          minRows={6}
          maxRows={12}
        />
      </Form.Item>

      {/* 用户提示词 */}
      <Form.Item
        name="userPrompt"
        rules={[{ required: true, message: '请输入用户提示词' }]}
      >
        <PromptEditorV2
          placeholder="用户提示词，可以使用 {{变量名}}、{{变量名.子变量名}}、{{变量名[索引]}} 引用变量"
          referenceData={referenceData}
          minRows={8}
          maxRows={14}
        />
      </Form.Item>

      {/* 输出参数 */}
      <Form.Item shouldUpdate name="outputArgs">
        <CustomTree
          key={`${node.type}-${node.id}-outputArgs`}
          title="输出"
          notShowTitle
          form={form}
          params={(node.nodeConfig?.outputArgs || []) as any}
          inputItemName="outputArgs"
        />
      </Form.Item>

      {/* 高级设置 */}
      <Collapse ghost>
        <Panel header="高级设置" key="advanced">
          <div className="node-panel-v2-section">
            <Form.Item
              label="最大回复长度"
              name="maxTokens"
              initialValue={2000}
            >
              <InputNumber
                min={1}
                max={8000}
                style={{ width: '100%' }}
                placeholder="2000"
              />
            </Form.Item>

            <Form.Item
              label="生成随机性 (Temperature)"
              name="temperature"
              initialValue={0.7}
            >
              <Slider
                min={0}
                max={2}
                step={0.1}
                marks={{ 0: '精确', 1: '平衡', 2: '创意' }}
              />
            </Form.Item>

            <Form.Item label="Top P" name="topP" initialValue={0.9}>
              <Slider min={0} max={1} step={0.1} />
            </Form.Item>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default LLMNodePanelV2;
