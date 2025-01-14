import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { CloseOutlined } from '@ant-design/icons';
import { Button, ConfigProvider, Input, Space } from 'antd';
import React from 'react';
import { useModel } from 'umi';
import './index.less';
import type { ExpandableInputTextareaState } from './type';
const ExpandTextArea: React.FC<ExpandableInputTextareaState> = ({
  marginRight,
  title,
  value,
  onChange,
}) => {
  const { expand, setExpand } = useModel('model');
  return (
    <div
      className="expand-textarea"
      style={{ display: expand ? 'block' : 'none', right: marginRight }}
    >
      <div className="expand-textarea-header dis-sb">
        <div className="expand-textarea-header-title">{title}</div>
        <div className="dis-left mg">
          <ConfigProvider
            button={{
              // 使用全局定义的 CSS 类名
              className: 'gradient-button',
            }}
          >
            <Space>
              <Button
                size="small"
                icon={<ICON_OPTIMIZE />}
                type="primary"
                className="gradient-button"
              >
                优化
              </Button>
              <CloseOutlined onClick={() => setExpand(false)} />
            </Space>
          </ConfigProvider>
        </div>
      </div>
      <Input.TextArea
        value={value}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
          onChange(event.target.value)
        }
        placeholder="Autosize height with minimum and maximum number of lines"
        autoSize={{ minRows: 100, maxRows: 100 }}
        className="expand-textarea-pre-style"
      />
    </div>
  );
};

export default ExpandTextArea;
