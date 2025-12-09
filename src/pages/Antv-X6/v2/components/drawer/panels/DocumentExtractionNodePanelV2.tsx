/**
 * V2 文档提取节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Typography } from 'antd';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

const { Text } = Typography;

export interface DocumentExtractionNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const DocumentExtractionNodePanelV2: React.FC<DocumentExtractionNodePanelV2Props> = ({ node, referenceData }) => {
  return (
    <div className="node-panel-v2">
      {/* 文档输入 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>文档输入</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            选择要提取内容的文档变量
          </Text>
        </div>
        <Form.Item
          name={['inputArgs', 0, 'bindValue']}
          rules={[{ required: true, message: '请选择文档变量' }]}
        >
          <VariableSelectorV2
            referenceData={referenceData}
            placeholder="选择文档变量"
            filterType={['File']}
          />
        </Form.Item>
      </div>

      {/* 支持的文件类型说明 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>支持的文件类型</Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          txt、markdown、pdf、html、xlsx、xls、docx、csv、md、htm
        </Text>
      </div>
    </div>
  );
};

export default DocumentExtractionNodePanelV2;
