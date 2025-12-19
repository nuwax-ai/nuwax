/**
 * V2 变量节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Radio, Typography } from 'antd';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import InputArgsEditorV2 from '../../common/InputArgsEditorV2';
import OutputArgsEditorV2 from '../../common/OutputArgsEditorV2';

const { Text } = Typography;

export interface VariableNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const VariableNodePanelV2: React.FC<VariableNodePanelV2Props> = ({ node, referenceData }) => {
  const configType = Form.useWatch('configType');

  return (
    <div className="node-panel-v2">
      {/* 操作类型 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>操作类型</Text>
        </div>
        <Form.Item name="configType" initialValue="SET_VARIABLE">
          <Radio.Group>
            <Radio value="SET_VARIABLE">设置变量</Radio>
            <Radio value="GET_VARIABLE">获取变量</Radio>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 设置变量 */}
      {configType === 'SET_VARIABLE' && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>变量配置</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              设置要存储的变量值
            </Text>
          </div>
          <Form.Item name="variableArgs" noStyle>
            <InputArgsEditorV2
              referenceData={referenceData}
              placeholder="添加变量"
            />
          </Form.Item>
        </div>
      )}

      {/* 获取变量 */}
      {configType === 'GET_VARIABLE' && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>变量配置</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              选择要获取的变量
            </Text>
          </div>
          <Form.Item name="outputArgs" noStyle>
            <OutputArgsEditorV2
              placeholder="添加要获取的变量"
            />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default VariableNodePanelV2;
