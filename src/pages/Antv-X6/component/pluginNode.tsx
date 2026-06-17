import TreeInput from '@/components/FormListItem/TreeInput';
import { t } from '@/services/i18nRuntime';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form } from 'antd';
import React from 'react';
import { TreeOutput } from './commonNode';
import './pluginNode.less';

// Plugin/workflow node renderer.
const PluginInNode: React.FC<NodeDisposeProps> = ({ form }) => {
  // Render input and output sections.
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

export default { PluginInNode };
