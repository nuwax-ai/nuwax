/**
 * AgentFlow 工作流节点属性面板（独立维护，样式对齐 Workflow V3 PluginInNode）
 *
 * 字段：inputArgs 入参映射、outputArgs 出参展示
 */

import TreeInput from '@/components/FormListItem/TreeInput';
import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form } from 'antd';
import React from 'react';
import { TreeOutput } from '../../component/commonNode';
import '../../component/pluginNode.less';

const AgentFlowWorkflowForm: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <>
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('inputArgs') && (
            <div className="node-item-style">
              <TreeInput
                form={form}
                title={t('PC.Pages.AntvX6Data.input')}
                params={form.getFieldValue('inputArgs')}
              />
            </div>
          )
        }
      </Form.Item>

      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">
                {t('PC.Pages.AntvX6Data.output')}
              </div>
              <TreeOutput treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>
    </>
  );
};

export default AgentFlowWorkflowForm;
