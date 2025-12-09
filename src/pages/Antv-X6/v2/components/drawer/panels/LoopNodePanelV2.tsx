/**
 * V2 循环节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Select, InputNumber, Typography } from 'antd';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import { loopTypeOptionsV2 } from '../../../constants/stencilConfigV2';
import VariableSelectorV2 from '../../common/VariableSelectorV2';

const { Text } = Typography;

export interface LoopNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const LoopNodePanelV2: React.FC<LoopNodePanelV2Props> = ({ node, referenceData }) => {
  const loopType = Form.useWatch('loopType');

  return (
    <div className="node-panel-v2">
      {/* 循环类型 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>循环类型</Text>
        </div>
        <Form.Item
          name="loopType"
          rules={[{ required: true, message: '请选择循环类型' }]}
        >
          <Select
            placeholder="选择循环类型"
            options={loopTypeOptionsV2}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </div>

      {/* 数组循环 - 选择数组变量 */}
      {loopType === 'ARRAY_LOOP' && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>循环数组</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              选择要遍历的数组变量
            </Text>
          </div>
          <Form.Item
            name={['inputArgs', 0, 'bindValue']}
            rules={[{ required: true, message: '请选择数组变量' }]}
          >
            <VariableSelectorV2
              referenceData={referenceData}
              placeholder="选择数组变量"
              filterType={['Array']}
            />
          </Form.Item>
        </div>
      )}

      {/* 指定次数循环 */}
      {loopType === 'SPECIFY_TIMES_LOOP' && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>循环次数</Text>
          </div>
          <Form.Item
            name="loopTimes"
            rules={[{ required: true, message: '请输入循环次数' }]}
            initialValue={10}
          >
            <InputNumber
              min={1}
              max={1000}
              style={{ width: '100%' }}
              placeholder="输入循环次数"
            />
          </Form.Item>
        </div>
      )}

      {/* 无限循环提示 */}
      {loopType === 'INFINITE_LOOP' && (
        <div className="node-panel-v2-section">
          <Text type="warning">
            无限循环将一直执行，直到遇到终止循环节点或满足其他退出条件
          </Text>
        </div>
      )}

      {/* 循环体内节点提示 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>循环体</Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12 }}>
          在循环节点内部添加需要重复执行的节点。
          循环体内的节点可以访问当前循环的元素和索引。
        </Text>
      </div>
    </div>
  );
};

export default LoopNodePanelV2;
