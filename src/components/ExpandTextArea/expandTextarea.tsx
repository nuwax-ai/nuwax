// import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { CloseOutlined } from '@ant-design/icons';
import { ConfigProvider, Input, Space } from 'antd';
import React from 'react';
import './index.less';
import type { ExpandableInputTextareaState } from './type';
const ExpandTextArea: React.FC<
  ExpandableInputTextareaState & { visible: boolean }
> = ({
  marginRight,
  title,
  value,
  onChange,
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
              {/* <Button
                size="small"
                icon={<ICON_OPTIMIZE />}
                type="primary"
                className="gradient-button"
              >
                优化
              </Button> */}
              {/* 通知父组件关闭我 */}
              <CloseOutlined
                onClick={() => onClose()}
                className="cursor-pointer"
              />
            </Space>
          </ConfigProvider>
        </div>
      </div>
      <Input.TextArea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoSize={{ minRows: 100, maxRows: 100 }}
        className="expand-textarea-pre-style"
      />
    </div>
  );
};

export default ExpandTextArea;
