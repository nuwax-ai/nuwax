import CodeEditor from '@/components/CodeEditor';
import { ICON_WORKFLOW_CODE } from '@/constants/images.constants';
import { CodeLangEnum } from '@/types/enums/plugin';
import { CloseOutlined } from '@ant-design/icons';
import { Button, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import './index.less';
interface Code {
  code: string;
  language: CodeLangEnum;
}

interface MonacoProps {
  // 当前节点的参数
  language: CodeLangEnum;
  // 是否显示
  visible: boolean;
  value: string;
  onChange: (code: Code) => void;
  // 关闭
  onClose: () => void;
  // 是否禁用切换语言
  disabledSwitchLanguage?: boolean;
}
const DEFAULT_LANGUAGE = CodeLangEnum.JavaScript;
const LANGUAGE_OPTIONS = [
  { value: CodeLangEnum.JavaScript, label: 'JavaScript' },
  { value: CodeLangEnum.Python, label: 'Python' },
];
const NewMonaco: React.FC<MonacoProps> = ({
  visible,
  onClose,
  value,
  language,
  onChange,
  disabledSwitchLanguage = false,
}) => {
  const [codeLanguage, setCodeLanguage] = useState(
    language || DEFAULT_LANGUAGE,
  );
  const [innerCode, setInnerCode] = useState(value || '');
  useEffect(() => {
    setInnerCode(value || '');
  }, [value]);

  const handleChange = (code: string) => {
    setInnerCode(code);
    onChange?.({
      code: code,
      language: codeLanguage,
    });
  };
  const handleLanguageChange = (language: CodeLangEnum) => {
    setCodeLanguage(language);
    onChange?.({
      code: innerCode,
      language: language,
    });
  };
  return (
    <>
      {visible && (
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
              {!disabledSwitchLanguage && (
                <Select
                  style={{ width: 120 }}
                  value={codeLanguage}
                  onChange={handleLanguageChange}
                  options={LANGUAGE_OPTIONS}
                  size="small"
                  placeholder="请选择语言"
                />
              )}
            </Space>
            {/* 右侧的关闭按钮和试运行 */}
            <Button
              icon={<CloseOutlined />}
              size="small"
              type="text"
              onClick={onClose}
            />
          </div>
          <div className="monaco-editor-content">
            <CodeEditor
              value={innerCode}
              onChange={handleChange}
              codeLanguage={codeLanguage}
              minimap={true}
              height="790px"
              codeOptimizeVisible={false}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default NewMonaco;
