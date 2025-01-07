import CodeEditor from '@/components/CodeEditor';
import { ICON_NEW_AGENT } from '@/constants/images.constants';
import { CloseOutlined, RightCircleOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
import React, { useState } from 'react';
import { useModel } from 'umi';
const Monaco: React.FC = ({}) => {
  const { isShow, setIsShow } = useModel('monaco');

  const [language, setLanguage] = useState('javascript');

  return (
    <>
      {isShow && (
        <div className="monaco-container">
          {/* 头部的编辑 */}
          <div className="monaco-header dis-sb margin-bottom">
            {/* 左侧的标题和图标及语言选择 */}
            <div className="dis-left">
              {/* 图标 */}
              <ICON_NEW_AGENT className="mr-16" />
              <span className="mr-16">代码</span>
              <Select
                prefix={'语言'}
                defaultValue={language}
                style={{ width: 120 }}
                options={[
                  { value: 'javascript', label: 'JavaScript' },
                  { value: 'python', label: 'Python' },
                ]}
                placeholder="请选择语言"
                onChange={(value) => {
                  setLanguage(value);
                }}
              />
            </div>
            {/* 右侧的关闭按钮和试运行 */}
            <div>
              <Button
                icon={<RightCircleOutlined />}
                className="mr-16"
                style={{ color: '#6A5CE9', background: '#F2F2FF' }}
              >
                试运行
              </Button>
              <CloseOutlined onClick={() => setIsShow(false)} />
            </div>
          </div>
          <div className="monaco-editor-content">
            <CodeEditor height={'790px'} />
          </div>
        </div>
      )}
    </>
  );
};

export default Monaco;
