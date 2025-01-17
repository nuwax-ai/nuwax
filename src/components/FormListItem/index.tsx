/*
 * @Author: binxiaolin 18030705033
 * @Date: 2025-01-17 13:41:09
 * @LastEditors: binxiaolin 18030705033
 * @LastEditTime: 2025-01-17 14:04:03
 * @FilePath: \agent-platform-front\src\components\FormListItem\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { ICON_ASSOCIATION } from '@/constants/images.constants';
import { DeleteOutlined, FileDoneOutlined } from '@ant-design/icons';
import { Checkbox, Form, Input, Popover, Space, Typography } from 'antd';
// import { useState } from 'react';
import { RenderItemProps } from './type';
// 默认的变量输入输出方法
export const DefaultRenderItem: React.FC<RenderItemProps> = ({
  field,
  onRemove,
  fieldConfigs,
  rowIndex,
  showCheckbox,
  showCopy,
  showAssociation,
  form,
  onChange,
}) => {
  const changeValue = () => {
    onChange();
  };

  //   const [open, setOpen] = useState(false);

  return (
    <Space className="dis-sb form-list-item-style" style={{ width: '100%' }}>
      {fieldConfigs.map((config, index) => {
        const fieldValue = form.getFieldValue([field.name, config.name]);
        return (
          <div key={index}>
            {rowIndex === 0 && (
              <Typography.Text>{config.label}</Typography.Text>
            )}
            <Form.Item
              name={[field.name, config.name]}
              rules={config.rules}
              style={config.style}
            >
              {/* 使用 ...config.props 来传递特定组件的属性 */}
              <config.component
                {...config.props}
                placeholder={config.placeholder}
                form={form} // 将 form 传递给 CommonInput
                index={rowIndex} // 传递索引
                value={fieldValue} // 传递当前字段的值
                onBlur={config.component === Input ? changeValue : undefined}
                onChange={config.component !== Input ? changeValue : undefined}
              />
            </Form.Item>
          </div>
        );
      })}
      <Form.Item
        name={[field.name, 'isSelect']}
        valuePropName="checked"
        initialValue={true}
      >
        {/* 根据节点的需求，动态赋予右侧图标 */}
        <div className={`dis-sa  ${rowIndex === 0 ? 'margin-bottom-20' : ''}`}>
          {showCopy && (
            <Popover content={123} trigger="click">
              <FileDoneOutlined
                className="margin-right cursor-pointer"
                // onClick={() => setOpen(true)}
              />
            </Popover>
          )}
          {showCheckbox && <Checkbox className="margin-right"></Checkbox>}
          {showAssociation && <ICON_ASSOCIATION className="margin-right" />}
          <DeleteOutlined onClick={onRemove} />
        </div>
      </Form.Item>
      {/* {showCopy && (
        <Form.Item
          name={[field.name, 'description']}
          valuePropName="description"
        >
          <Popover content={123} trigger="click" open={open}>
            <FileDoneOutlined
              className="margin-right cursor-pointer"
              onClick={() => setOpen(true)}
            />
          </Popover>
        </Form.Item>
      )} */}
    </Space>
  );
};
