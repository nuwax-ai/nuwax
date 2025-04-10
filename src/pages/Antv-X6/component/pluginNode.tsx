import TreeInput from '@/components/FormListItem/TreeInput';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form } from 'antd';
import React from 'react';
import { TreeOutput } from './commonNode';
import './pluginNode.less';

// 定义插件,工作流的节点渲染
const PluginInNode: React.FC<NodeDisposeProps> = ({ form }) => {
  //  获取输入的列表
  return (
    <>
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('inputArgs') && (
            <>
              <TreeInput
                form={form}
                title={'输入'}
                params={form.getFieldValue('inputArgs')}
              />
            </>
          )
        }
      </Form.Item>

      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">输出</div>
              <TreeOutput treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>
    </>
  );
};

export default { PluginInNode };
