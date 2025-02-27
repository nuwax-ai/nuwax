import CodeEditor from '@/components/CodeEditor';
import { ICON_WORKFLOW_CODE } from '@/constants/images.constants';
import type { NodeConfig } from '@/types/interfaces/node';
import { CloseOutlined } from '@ant-design/icons';
import { Select } from 'antd';
import React from 'react';
import './index.less';
interface MonacoProps {
  // 当前节点的参数
  params: NodeConfig;
  // 修改节点信息
  Modified: (params: NodeConfig) => void;
  // 是否显示
  isShow: boolean;
  // 关闭
  close: () => void;
}

const Monaco: React.FC<MonacoProps> = ({ params, Modified, isShow, close }) => {
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  return (
    <>
      {isShow && (
        <div className="monaco-container">
          {/* 头部的编辑 */}
          <div className="monaco-header dis-sb margin-bottom">
            {/* 左侧的标题和图标及语言选择 */}
            <div className="dis-left">
              {/* 图标 */}
              <ICON_WORKFLOW_CODE className="mr-6" />
              <span className="mr-16">代码</span>
              <Select
                value={params.codeLanguage}
                style={{ width: 100 }}
                options={[
                  { value: 'JavaScript', label: 'JavaScript' },
                  { value: 'Python', label: 'Python' },
                ]}
                placeholder="请选择语言"
                onChange={(value) => {
                  handleChangeNodeConfig({ ...params, codeLanguage: value });
                }}
              />
            </div>
            {/* 右侧的关闭按钮和试运行 */}
            <div>
              <CloseOutlined onClick={close} />
            </div>
          </div>
          <div className="monaco-editor-content">
            <CodeEditor
              height={'790px'}
              value={
                params.codeLanguage === 'Python'
                  ? params.codePython
                  : params.codeJavaScript
              }
              changeCode={(value) => {
                if (params.codeLanguage === 'Python') {
                  handleChangeNodeConfig({ ...params, codePython: value });
                } else {
                  handleChangeNodeConfig({ ...params, codeJavaScript: value });
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Monaco;
