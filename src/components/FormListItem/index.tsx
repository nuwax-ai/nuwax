/*
 * @Author: binxiaolin 18030705033
 * @Date: 2025-01-17 13:41:09
 * @LastEditors: binxiaolin 18030705033
 * @LastEditTime: 2025-01-17 16:37:26
 * @FilePath: \agent-platform-front\src\components\FormListItem\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Checkbox, Form, Input, Popover, Space } from 'antd';
// import { useState } from 'react';
import './index.less';
import { RenderItemProps } from './type';
// 默认的变量输入输出方法
export const DefaultRenderItem: React.FC<RenderItemProps> = ({
  field,
  onRemove,
  fieldConfigs,
  showCheckbox,
  showCopy,
  showAssociation,
  form,
  onChange,
}) => {
  const changeValue = () => {
    onChange();
  };

  return (
    <div>
      {/* 标题 */}
      {field.name === 0 && (
        <div className="dis-left">
          {fieldConfigs.map((item) => (
            <span
              key={item.name}
              style={{ width: (item.width as number) + 20 }}
            >
              {item.label}
            </span>
          ))}
        </div>
      )}
      <Space className="dis-sb form-list-item-style" style={{ width: '100%' }}>
        {fieldConfigs.map((config, index) => {
          if (config.name === 'description' || config.name === 'require') {
            // 跳过 description 和 require 字段，将在后面单独处理
            return null;
          }
          const fieldValue = form.getFieldValue([field.name, config.name]);
          return (
            <div key={index}>
              <Form.Item
                name={[field.name, config.name]}
                rules={config.rules}
                style={{ width: config.width }}
              >
                {/* 使用 ...config.props 来传递特定组件的属性 */}
                <config.component
                  {...config.props}
                  placeholder={config.placeholder}
                  form={form} // 将 form 传递给 CommonInput
                  index={field.name} // 传递索引
                  value={fieldValue} // 传递当前字段的值
                  onBlur={config.component === Input ? changeValue : undefined}
                  onChange={
                    config.component !== Input ? changeValue : undefined
                  }
                />
              </Form.Item>
            </div>
          );
        })}
        {/* 特殊处理 description 和 require 字段 */}
        <div className="dis-left">
          {showCopy && (
            <Form.Item noStyle>
              <Popover
                content={
                  <Form.Item name={[field.name, 'description']} noStyle>
                    <Input.TextArea onChange={changeValue} />
                  </Form.Item>
                }
                trigger="click"
              >
                <FileDoneOutlined
                  style={{ marginBottom: '14px' }}
                  className="margin-right cursor-pointer"
                />
              </Popover>
            </Form.Item>
          )}

          {showCheckbox && (
            <Form.Item name={[field.name, 'require']} valuePropName="checked">
              <Checkbox
                className="margin-right"
                onChange={(e) => {
                  form.setFieldsValue({
                    [field.name]: {
                      ...form.getFieldValue([field.name]),
                      require: e.target.checked,
                    },
                  });
                  changeValue();
                }}
              />
            </Form.Item>
          )}

          {showAssociation && (
            <Form.Item
              name={[field.name, 'association']}
              valuePropName="association"
            >
              <ICON_ASSOCIATION className="margin-right" />
            </Form.Item>
          )}
          <Form.Item>
            <DeleteOutlined onClick={onRemove} />
          </Form.Item>
        </div>

        {/* console.log(field.name) */}
      </Space>
    </div>
  );
};
