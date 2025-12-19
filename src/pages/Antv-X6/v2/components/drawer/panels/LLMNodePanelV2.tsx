/**
 * V2 LLM 节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Input, Select, Slider, InputNumber, Typography, Space, Collapse } from 'antd';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import VariableSelectorV2 from '../../common/VariableSelectorV2';
import PromptEditorV2 from '../../common/PromptEditorV2';

const { Text } = Typography;
const { TextArea } = Input;
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

const LLMNodePanelV2: React.FC<LLMNodePanelV2Props> = ({ node, referenceData }) => {
  return (
    <div className="node-panel-v2">
      {/* 模型选择 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>模型</Text>
        </div>
        <Form.Item
          name="modelId"
          rules={[{ required: true, message: '请选择模型' }]}
        >
          <Select
            placeholder="选择模型"
            options={MODEL_OPTIONS}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </div>

      {/* 系统提示词 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>系统提示词</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            设定模型的角色和行为
          </Text>
        </div>
        <Form.Item name="systemPrompt">
          <PromptEditorV2
            placeholder="输入系统提示词，如：你是一个专业的助手..."
            referenceData={referenceData}
            rows={4}
          />
        </Form.Item>
      </div>

      {/* 用户提示词 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>用户提示词</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            发送给模型的消息，可以引用变量
          </Text>
        </div>
        <Form.Item
          name="userPrompt"
          rules={[{ required: true, message: '请输入用户提示词' }]}
        >
          <PromptEditorV2
            placeholder="输入用户提示词，使用 {{ }} 引用变量"
            referenceData={referenceData}
            rows={6}
          />
        </Form.Item>
      </div>

      {/* 高级设置 */}
      <Collapse ghost>
        <Panel header="高级设置" key="advanced">
          <div className="node-panel-v2-section">
            <Form.Item label="最大回复长度" name="maxTokens" initialValue={2000}>
              <InputNumber
                min={1}
                max={8000}
                style={{ width: '100%' }}
                placeholder="2000"
              />
            </Form.Item>

            <Form.Item label="生成随机性 (Temperature)" name="temperature" initialValue={0.7}>
              <Slider
                min={0}
                max={2}
                step={0.1}
                marks={{ 0: '精确', 1: '平衡', 2: '创意' }}
              />
            </Form.Item>

            <Form.Item label="Top P" name="topP" initialValue={0.9}>
              <Slider
                min={0}
                max={1}
                step={0.1}
              />
            </Form.Item>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default LLMNodePanelV2;
