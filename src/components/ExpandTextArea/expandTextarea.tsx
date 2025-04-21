// import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { CloseOutlined } from '@ant-design/icons';
import { ConfigProvider, Input, Space } from 'antd';
import { Form } from 'antd/lib';
import React from 'react';
import './index.less';
import type { ExpandableInputTextareaState } from './type';
const ExpandTextArea: React.FC<
  ExpandableInputTextareaState & { visible: boolean }
> = ({
  marginRight,
  title,
  inputFieldName,
  placeholder,
  visible, // 接收 visible 属性
  onClose,
}) => {
  return (
    <div
      className="expand-textarea"
      style={{ display: visible ? 'block' : 'none', right: marginRight }}
    >
      <div className="expand-textarea-header dis-sb">
        <div className="expand-textarea-header-title">{title}</div>
        <div className="dis-left mg">
          <ConfigProvider
            button={{
              className: 'gradient-button',
            }}
          >
            <Space>
              {/* 通知父组件关闭我 */}
              <CloseOutlined
                onClick={() => onClose()}
                className="cursor-pointer"
              />
            </Space>
          </ConfigProvider>
        </div>
      </div>
      <Form.Item name={inputFieldName} className="expand-textarea-pre-style">
        <Input.TextArea placeholder={placeholder} />
      </Form.Item>
    </div>
  );
};

export default ExpandTextArea;
