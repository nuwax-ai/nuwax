import CodeEditor from '@/components/CodeEditor';
import { ICON_NEW_AGENT } from '@/constants/images.constants';
import type { NodeConfig } from '@/types/interfaces/node';
import { CloseOutlined, RightCircleOutlined } from '@ant-design/icons';
import { Button, Select } from 'antd';
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
              <ICON_NEW_AGENT className="mr-16" />
              <span className="mr-16">代码</span>
              <Select
                prefix={'语言'}
                value={params.codeLanguage}
                style={{ width: 120 }}
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
              <Button
                icon={<RightCircleOutlined />}
                className="mr-16"
                style={{ color: '#6A5CE9', background: '#F2F2FF' }}
              >
                试运行
              </Button>
              <CloseOutlined onClick={close} />
            </div>
          </div>
          <div className="monaco-editor-content">
            <CodeEditor
              height={'790px'}
              value={params.code}
              changeCode={(value) =>
                handleChangeNodeConfig({ ...params, code: value })
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Monaco;
