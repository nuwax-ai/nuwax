import InputOrReference from '@/components/FormListItem/InputOrReference';
import { InputItemNameEnum } from '@/types/enums/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Form, FormInstance, Popover } from 'antd';
import React from 'react';

import { TreeOutput } from './commonNode';
import './pluginNode.less';
interface InputListProps {
  form: FormInstance;
  title: string;
  inputItemName: string;
}
// 根据输入的list遍历创建输入框

export const InputList: React.FC<InputListProps> = ({
  form,
  title,
  inputItemName,
}) => {
  return (
    <>
      <Form.List name={inputItemName}>
        {(fields) => (
          <>
            <span className="node-title-style">{title}</span>
            {fields.map((item, index) => {
              const bindValueType = form.getFieldValue([
                inputItemName,
                item.name,
                'bindValueType',
              ]);
              return (
                <div key={item.name}>
                  {/* 只在第一个输入框组旁边显示标签 */}
                  {index === 0 && (
                    <>
                      <span>参数名</span>
                      <span style={{ marginLeft: '25%' }}>参数值</span>
                    </>
                  )}
                  <Form.Item key={item.key}>
                    <div className="dis-left">
                      <Form.Item noStyle name={[item.name, 'bindValue']}>
                        <div className="dis-left node-form-label-style">
                          <span className="margin-right-6 font-12 form-name-style">
                            {form.getFieldValue([
                              inputItemName,
                              item.name,
                              'name',
                            ])}
                          </span>
                          <Popover
                            placement="right"
                            content={form.getFieldValue([
                              inputItemName,
                              item.name,
                              'description',
                            ])}
                          >
                            <InfoCircleOutlined className="margin-right-6 font-12" />
                          </Popover>
                        </div>
                      </Form.Item>
                      <Form.Item name={[item.name, 'bindValue']} noStyle>
                        <InputOrReference
                          form={form}
                          fieldName={[inputItemName, item.name, 'bindValue']}
                          style={{ width: '65%' }}
                          referenceType={bindValueType}
                        />
                      </Form.Item>
                    </div>
                  </Form.Item>
                </div>
              );
            })}
          </>
        )}
      </Form.List>
    </>
  );
};

// 定义插件,工作流的节点渲染
const PluginInNode: React.FC<NodeDisposeProps> = ({ form }) => {
  //  获取输入的列表
  return (
    <>
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('inputArgs') && (
            <>
              <InputList
                form={form}
                title={'输入'}
                inputItemName={InputItemNameEnum.inputArgs}
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
