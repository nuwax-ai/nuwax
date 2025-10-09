// import { ICON_OPTIMIZE } from '@/constants/images.constants';
import { CloseOutlined } from '@ant-design/icons';
import { ConfigProvider, Space } from 'antd';
import { Form } from 'antd/lib';
import { PromptEditorProvider, PromptEditorRender } from 'prompt-kit-editor';
import React from 'react';
import './expandTextarea.less';
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
      {/*<Form.Item name={inputFieldName} className="expand-textarea-pre-style">*/}
      {/*  <Input.TextArea*/}
      {/*    placeholder={placeholder}*/}
      {/*    className="no-resize-textarea"*/}
      {/*  />*/}
      {/*</Form.Item>*/}
      <PromptEditorProvider>
        <Form.Item
          name={inputFieldName}
          className="expand-textarea-pre-style scroll-container"
        >
          <PromptEditorRender
            className="prompt-editor-provider"
            isControled={true}
            placeholder={placeholder}
          />
        </Form.Item>
      </PromptEditorProvider>
    </div>
  );
};

export default ExpandTextArea;
