/**
 * V2 知识库节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Select, InputNumber, Slider, Typography, Button, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

const { Text } = Typography;

export interface KnowledgeNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const SEARCH_STRATEGY_OPTIONS = [
  { label: '语义检索', value: 'SEMANTIC' },
  { label: '全文检索', value: 'FULLTEXT' },
  { label: '混合检索', value: 'HYBRID' },
];

const KnowledgeNodePanelV2: React.FC<KnowledgeNodePanelV2Props> = ({ node, referenceData }) => {
  const knowledgeBaseConfigs = Form.useWatch('knowledgeBaseConfigs');

  return (
    <div className="node-panel-v2">
      {/* 知识库选择 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>知识库</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            选择要检索的知识库
          </Text>
        </div>

        {knowledgeBaseConfigs && knowledgeBaseConfigs.length > 0 ? (
          <div className="knowledge-list">
            {knowledgeBaseConfigs.map((item: any, index: number) => (
              <div key={index} className="knowledge-item">
                <Text>{item.name || `知识库 ${index + 1}`}</Text>
              </div>
            ))}
          </div>
        ) : (
          <Empty
            description="暂未选择知识库"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" icon={<PlusOutlined />}>
              添加知识库
            </Button>
          </Empty>
        )}
      </div>

      {/* 检索查询 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>检索查询</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            输入检索的查询内容
          </Text>
        </div>
        <Form.Item
          name={['inputArgs', 0, 'bindValue']}
          rules={[{ required: true, message: '请选择查询变量' }]}
        >
          <VariableSelectorV2
            referenceData={referenceData}
            placeholder="选择查询变量"
          />
        </Form.Item>
      </div>

      {/* 检索策略 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>检索策略</Text>
        </div>
        <Form.Item name="searchStrategy" initialValue="SEMANTIC">
          <Select options={SEARCH_STRATEGY_OPTIONS} style={{ width: '100%' }} />
        </Form.Item>
      </div>

      {/* 最大召回数量 */}
      <div className="node-panel-v2-section">
        <Form.Item label="最大召回数量" name="maxRecallCount" initialValue={5}>
          <InputNumber min={1} max={20} style={{ width: '100%' }} />
        </Form.Item>
      </div>

      {/* 匹配度阈值 */}
      <div className="node-panel-v2-section">
        <Form.Item label="匹配度阈值" name="matchingDegree" initialValue={0.7}>
          <Slider
            min={0}
            max={1}
            step={0.1}
            marks={{ 0: '0', 0.5: '0.5', 1: '1' }}
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default KnowledgeNodePanelV2;
