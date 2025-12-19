/**
 * V2 插件/工作流节点配置组件
 *
 * 支持插件、工作流、MCP、长期记忆节点的选择、输入输出配置
 * 完全独立，不依赖 V1
 */

import Created from '@/components/Created';
import TreeInput from '@/components/FormListItem/TreeInput';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, FormInstance, Typography } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';

import type { NodeConfigV2 } from '../../../types';
import { TreeOutputV2 } from './commonNodeV2';

import './PluginNodeV2.less';

// ==================== 类型定义 ====================

export interface PluginNodeV2Props {
  form: FormInstance;
  nodeConfig?: NodeConfigV2;
  id: number;
  type: string;
  referenceData?: any;
}

// ==================== 组件实现 ====================

const { Text } = Typography;

const PluginNodeV2: React.FC<PluginNodeV2Props> = ({ form, type }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CreatedNodeItem | null>(null);

  // 当前节点对应的组件类型
  const componentType = useMemo<AgentComponentTypeEnum>(() => {
    if (type === 'Workflow') return AgentComponentTypeEnum.Workflow;
    if (type === 'Mcp') return AgentComponentTypeEnum.MCP;
    return AgentComponentTypeEnum.Plugin;
  }, [type]);

  const titleLabel = useMemo(() => {
    switch (componentType) {
      case AgentComponentTypeEnum.Workflow:
        return '工作流';
      case AgentComponentTypeEnum.MCP:
        return 'MCP';
      default:
        return '插件';
    }
  }, [componentType]);

  /**
   * 选择组件后同步基础信息 & 入出参
   */
  const handleAdded = useCallback(
    (item: CreatedNodeItem) => {
      setSelected(item);

      const baseFields: Record<string, any> = {
        typeId: item.targetId,
        name: form.getFieldValue('name') || item.name,
      };

      if (componentType === AgentComponentTypeEnum.Plugin) {
        baseFields.pluginId = item.targetId;
        baseFields.toolName = item.name;
      }
      if (componentType === AgentComponentTypeEnum.Workflow) {
        baseFields.workflowName = item.name;
      }

      // 将已发布组件的参数透传给节点，便于直接编辑/引用
      if (item.inputArgBindConfigs?.length) {
        baseFields.inputArgs = item.inputArgBindConfigs;
      }
      if (item.outputArgBindConfigs?.length) {
        baseFields.outputArgs = item.outputArgBindConfigs;
      }

      form.setFieldsValue(baseFields);
      setOpen(false);
    },
    [componentType, form],
  );

  /**
   * 清除已选组件
   */
  const handleClear = useCallback(() => {
    setSelected(null);
    form.setFieldsValue({
      typeId: undefined,
      pluginId: undefined,
      toolName: undefined,
      workflowName: undefined,
    });
  }, [form]);

  return (
    <>
      {/* 组件选择 */}
      <div className="node-item-style-v2">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style-v2">{titleLabel}选择</span>
          <Button
            icon={<PlusOutlined />}
            size="small"
            type="text"
            onClick={() => setOpen(true)}
          />
        </div>
        {selected || form.getFieldValue('typeId') ? (
          <div className="skill-item-style background-c9 dis-sb">
            <div className="dis-left">
              <div className="skill-item-content-style">
                <div className="skill-item-title-style">
                  {selected?.name ||
                    form.getFieldValue('toolName') ||
                    form.getFieldValue('workflowName') ||
                    form.getFieldValue('name')}
                </div>
                <div className="skill-item-desc-style">
                  {selected?.description || '已选择的组件'}
                </div>
              </div>
            </div>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={handleClear}
            />
          </div>
        ) : (
          <Empty description={`请选择${titleLabel}`} />
        )}
        <Text type="secondary" style={{ fontSize: 12 }}>
          选择后会自动带入已发布组件的输入输出参数，便于直接引用。
        </Text>
      </div>

      {/* 输入参数 */}
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('inputArgs') && (
            <div className="node-item-style-v2">
              <TreeInput
                form={form}
                title={'输入'}
                params={form.getFieldValue('inputArgs')}
              />
            </div>
          )
        }
      </Form.Item>

      {/* 输出参数 */}
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style-v2 margin-bottom">输出</div>
              <TreeOutputV2 treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>

      {/* 选择弹窗 */}
      <Created
        checkTag={componentType}
        onAdded={handleAdded}
        open={open}
        onCancel={() => setOpen(false)}
        hideTop={
          componentType === AgentComponentTypeEnum.Plugin
            ? [AgentComponentTypeEnum.Knowledge, AgentComponentTypeEnum.Table]
            : undefined
        }
      />
    </>
  );
};

export default PluginNodeV2;
