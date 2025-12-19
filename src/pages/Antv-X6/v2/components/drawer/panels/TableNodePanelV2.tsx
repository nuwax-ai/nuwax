/**
 * V2 数据表节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, Input, Select, Typography } from 'antd';
import React from 'react';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import { NodeTypeEnumV2 } from '../../../types';
import ConditionEditorV2 from '../../common/ConditionEditorV2';
import InputArgsEditorV2 from '../../common/InputArgsEditorV2';

const { Text } = Typography;

export interface TableNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const TableNodePanelV2: React.FC<TableNodePanelV2Props> = ({
  node,
  referenceData,
}) => {
  const tableId = node.typeId || node.nodeConfig?.tableId;
  const nodeType = node.type;

  // 根据节点类型获取标题
  const getTitle = () => {
    switch (nodeType) {
      case NodeTypeEnumV2.TableDataAdd:
        return '数据新增';
      case NodeTypeEnumV2.TableDataDelete:
        return '数据删除';
      case NodeTypeEnumV2.TableDataUpdate:
        return '数据更新';
      case NodeTypeEnumV2.TableDataQuery:
        return '数据查询';
      case NodeTypeEnumV2.TableSQL:
        return 'SQL自定义';
      default:
        return '数据表操作';
    }
  };

  // 是否需要条件配置
  const needsCondition = [
    NodeTypeEnumV2.TableDataDelete,
    NodeTypeEnumV2.TableDataUpdate,
    NodeTypeEnumV2.TableDataQuery,
  ].includes(nodeType);

  return (
    <div className="node-panel-v2">
      {/* 数据表信息 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>数据表</Text>
        </div>
        {tableId ? (
          <div className="table-info">
            <Text>数据表 ID: {tableId}</Text>
          </div>
        ) : (
          <div className="table-info-empty">
            <Empty
              description="暂未选择数据表"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button type="primary" icon={<PlusOutlined />}>
                选择数据表
              </Button>
            </Empty>
            <Form.Item
              name={['nodeConfig', 'tableId']}
              label="数据表 ID"
              rules={[{ required: true, message: '请输入数据表 ID' }]}
            >
              <Input placeholder="请输入数据表 ID" />
            </Form.Item>
          </div>
        )}
      </div>

      {/* 数据新增/更新 - 字段配置 */}
      {(nodeType === NodeTypeEnumV2.TableDataAdd ||
        nodeType === NodeTypeEnumV2.TableDataUpdate) &&
        tableId && (
          <div className="node-panel-v2-section">
            <div className="node-panel-v2-section-header">
              <Text strong>字段配置</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                配置要
                {nodeType === NodeTypeEnumV2.TableDataAdd ? '新增' : '更新'}
                的字段值
              </Text>
            </div>
            <Form.Item name="inputArgs" noStyle>
              <InputArgsEditorV2
                referenceData={referenceData}
                placeholder="添加字段"
              />
            </Form.Item>
          </div>
        )}

      {/* 条件配置 */}
      {needsCondition && tableId && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>条件配置</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              配置查询/删除/更新条件
            </Text>
          </div>
          <Form.Item name="conditionType" initialValue="AND">
            <Select
              options={[
                { label: '满足所有条件 (AND)', value: 'AND' },
                { label: '满足任一条件 (OR)', value: 'OR' },
              ]}
              style={{ width: '100%', marginBottom: 12 }}
            />
          </Form.Item>
          <Form.Item name="conditionArgs" noStyle>
            <ConditionEditorV2
              referenceData={referenceData}
              placeholder="添加条件"
            />
          </Form.Item>
        </div>
      )}

      {/* SQL自定义 */}
      {nodeType === NodeTypeEnumV2.TableSQL && tableId && (
        <div className="node-panel-v2-section">
          <div className="node-panel-v2-section-header">
            <Text strong>SQL语句</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              输入自定义SQL语句
            </Text>
          </div>
          <Form.Item
            name="sql"
            rules={[{ required: true, message: '请输入SQL语句' }]}
          >
            <textarea
              placeholder="SELECT * FROM table WHERE ..."
              style={{
                width: '100%',
                height: 120,
                fontFamily: 'monospace',
                fontSize: 12,
                padding: 8,
                border: '1px solid #d9d9d9',
                borderRadius: 4,
              }}
            />
          </Form.Item>
        </div>
      )}
    </div>
  );
};

export default TableNodePanelV2;
