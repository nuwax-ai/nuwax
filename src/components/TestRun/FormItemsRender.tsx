import {
  InputAndOutConfig,
  NodePreviousAndArgMap,
} from '@/types/interfaces/node';
import { Form, Tag } from 'antd';
import React from 'react';
import InputBox from './InputBox';

interface FormItemRenderProps {
  items: InputAndOutConfig[];
  loading?: boolean;
  options?: NodePreviousAndArgMap;
}

const FormItemsRender: React.FC<FormItemRenderProps> = ({
  items,
  loading,
  options,
}) => {
  return (
    <>
      {items.map((item, index) => {
        // 动态类型修正
        if (options !== undefined && JSON.stringify(options.argMap) !== '{}') {
          const isReference = options.argMap[item.bindValue];
          if (isReference) {
            item.dataType = isReference.dataType;
          }
        }

        // 处理 dataType
        let dataType: string = item.dataType || '';
        // String 类型下，根据 inputType 决定 dataType
        if (item.dataType === 'String' && item.inputType) {
          dataType = item.inputType;
        }

        return (
          <div key={item.key || `${item.name}-${index}`}>
            <Form.Item
              name={[item.name]}
              label={
                <>
                  {item.name}
                  <Tag color="#C9CDD4" className="ml-10">
                    {dataType}
                  </Tag>
                </>
              }
              rules={
                item.require
                  ? [
                      {
                        required: true,
                        message: `${item.name}是必填项`,
                      },
                    ]
                  : []
              }
            >
              <InputBox item={item} loading={loading} />
            </Form.Item>
          </div>
        );
      })}
    </>
  );
};

export default FormItemsRender;
