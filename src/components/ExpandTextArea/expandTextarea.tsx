import TiptapVariableInput from '@/components/TiptapVariableInput';
import { CloseOutlined } from '@ant-design/icons';
import { ConfigProvider, Space } from 'antd';
import { Form } from 'antd/lib';
import React from 'react';
import './expandTextarea.less';
import type { ExpandableInputTextareaState } from './type';

/**
 * 工作流节点输入框的展开编辑层。
 * 仅使用 TiptapVariableInput（不再依赖 prompt-kit-editor）。
 *
 * @param visible 是否显示展开层
 * @param onClose 关闭回调
 * @param inputFieldName Form 字段名
 * @param variables / skills 变量与技能提及数据
 * @param imeSafe 中文 IME 安全模式
 */
const ExpandTextArea: React.FC<
  ExpandableInputTextareaState & {
    visible: boolean;
    skills?: any[];
  }
> = ({
  marginRight,
  title,
  inputFieldName,
  placeholder,
  visible,
  onClose,
  variables,
  skills,
  imeSafe,
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
      <Form.Item
        name={inputFieldName}
        className="expand-textarea-pre-style scroll-container"
      >
        <TiptapVariableInput
          className="prompt-editor-provider"
          placeholder={placeholder}
          variables={variables}
          skills={skills}
          imeSafe={imeSafe}
          style={{ height: '100%', minHeight: '400px' }}
        />
      </Form.Item>
    </div>
  );
};

export default ExpandTextArea;
