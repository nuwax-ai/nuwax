/**
 * V2 插件/工作流节点配置组件
 *
 * 支持插件、工作流、MCP、长期记忆节点的输入输出配置
 * 完全独立，不依赖 V1
 */

import TreeInput from '@/components/FormListItem/TreeInput';
import { Form, FormInstance } from 'antd';
import React from 'react';

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

const PluginNodeV2: React.FC<PluginNodeV2Props> = ({ form }) => {
  return (
    <>
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
    </>
  );
};

export default PluginNodeV2;
