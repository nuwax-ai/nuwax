import CodeEditor from '@/components/CodeEditor';
import { ICON_WORKFLOW_CODE } from '@/constants/images.constants';
import { CloseOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { Button, Form, Select, Space } from 'antd';
import React from 'react';
import './index.less';
interface MonacoProps {
  // 当前节点的参数
  form: FormInstance;
  // 是否显示
  isShow: boolean;
  value?: string | undefined;
  onChange?: (code: string) => void;
  // 关闭
  close: () => void;
}

const Monaco: React.FC<MonacoProps> = ({ form, isShow, close }) => {
  return (
    <>
      {isShow && (
        <div className="monaco-container">
          {/* 头部的编辑 */}
          <div className="monaco-header dis-sb margin-bottom">
            {/* 左侧的标题和图标及语言选择 */}
            <Space
              align="center"
              wrap
              className="dis-left"
              style={{
                flex: 1,
              }}
            >
              {/* 图标 */}
              <ICON_WORKFLOW_CODE />
              <span
                className="mr-16"
                style={{
                  height: 28,
                  lineHeight: '20px',
                  paddingBottom: 8,
                  display: 'inline-block',
                }}
              >
                代码
              </span>
              <Form.Item name={'codeLanguage'}>
                <Select
                  style={{ width: 120 }}
                  options={[
                    { value: 'JavaScript', label: 'JavaScript' },
                    { value: 'Python', label: 'Python' },
                  ]}
                  size="small"
                  placeholder="请选择语言"
                />
              </Form.Item>
            </Space>
            {/* 右侧的关闭按钮和试运行 */}
            <Button
              icon={<CloseOutlined />}
              size="small"
              type="text"
              onClick={close}
            />
          </div>
          <div className="monaco-editor-content">
            <Form.Item
              noStyle
              name={
                form.getFieldValue('codeLanguage') === 'JavaScript'
                  ? 'codeJavaScript'
                  : 'codePython'
              }
            >
              <CodeEditor
                value={form.getFieldValue(
                  form.getFieldValue('codeLanguage') === 'JavaScript'
                    ? 'codeJavaScript'
                    : 'codePython',
                )}
                onChange={(value) => {
                  form.setFieldValue(
                    form.getFieldValue('codeLanguage') === 'JavaScript'
                      ? 'codeJavaScript'
                      : 'codePython',
                    value,
                  );
                }}
                codeLanguage={
                  form.getFieldValue('codeLanguage') || 'JavaScript'
                }
                height="790px"
              />
            </Form.Item>
          </div>
        </div>
      )}
    </>
  );
};

export default Monaco;
