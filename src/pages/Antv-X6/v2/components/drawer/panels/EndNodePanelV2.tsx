/**
 * V2 结束节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Radio, Space, Typography } from 'antd';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import OutputArgsEditorV2 from '../../common/OutputArgsEditorV2';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

const { Text } = Typography;

export interface EndNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const EndNodePanelV2: React.FC<EndNodePanelV2Props> = ({ node, referenceData }) => {
  const returnType = Form.useWatch('returnType');

  return (
    <div className="node-panel-v2">
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>返回类型</Text>
        </div>

        <Form.Item name="returnType" initialValue="VARIABLE">
          <Radio.Group>
            <Radio value="VARIABLE">变量</Radio>
            <Radio value="TEXT">文本</Radio>
          </Radio.Group>
        </Form.Item>
      </div>

      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>输出参数</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            定义工作流的输出参数
          </Text>
        </div>

        <Form.Item name="outputArgs" noStyle>
          <OutputArgsEditorV2
            referenceData={referenceData}
            placeholder="添加输出参数"
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default EndNodePanelV2;
