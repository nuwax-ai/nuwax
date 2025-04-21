import TreeInput from '@/components/FormListItem/TreeInput';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { Form } from 'antd';
import React from 'react';
import '../index.less';
import { TreeOutput } from './commonNode';

// 数据新增
const DataAdd: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <div>
      <div className="node-item-style">
        <TreeInput
          title={'输入'}
          form={form}
          params={form.getFieldValue('inputArgs')}
        />
      </div>
      {/* 输出 */}
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
    </div>
  );
};

export default { DataAdd };
