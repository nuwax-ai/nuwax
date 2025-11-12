// import { ICON_OPTIMIZE } from '@/constants/images.constants';
import PromptEditorWithVariable from '@/components/PromptEditorWithVariable';
import { InputItemNameEnum } from '@/types/enums/node';
import { CloseOutlined } from '@ant-design/icons';
import { ConfigProvider, Form, Space } from 'antd';
import { PromptEditorProvider } from 'prompt-kit-editor';
import React from 'react';
import './expandTextarea.less';
import type { ExpandableInputTextareaState } from './type';
const ExpandTextArea: React.FC<
  ExpandableInputTextareaState & { visible: boolean; form?: any }
> = ({
  marginRight,
  title,
  inputFieldName,
  placeholder,
  visible, // 接收 visible 属性
  onClose,
  form,
}) => {
  // 获取输入参数变量数据
  // 注意：useWatch 必须在组件顶层调用，不能在条件中
  const watchedInputArgs = Form.useWatch(InputItemNameEnum.inputArgs, {
    form: form || undefined,
    preserve: true,
  });

  const variables =
    form && watchedInputArgs
      ? watchedInputArgs.filter(
          (item: any) => !['', null, undefined].includes(item.name),
        )
      : [];

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
          <PromptEditorWithVariable
            className="prompt-editor-provider"
            isControled={true}
            placeholder={placeholder}
            variables={variables}
          />
        </Form.Item>
      </PromptEditorProvider>
    </div>
  );
};

export default ExpandTextArea;
