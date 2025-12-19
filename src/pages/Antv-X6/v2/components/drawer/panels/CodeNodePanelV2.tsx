/**
 * V2 代码节点配置面板
 * 完全独立，不依赖 v1 任何代码
 */

import React from 'react';
import { Form, Radio, Typography, Button } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import InputArgsEditorV2 from '../../common/InputArgsEditorV2';
import OutputArgsEditorV2 from '../../common/OutputArgsEditorV2';
import CodeEditorV2 from '../../common/CodeEditorV2';

const { Text } = Typography;

export interface CodeNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const CodeNodePanelV2: React.FC<CodeNodePanelV2Props> = ({ node, referenceData }) => {
  const codeLanguage = Form.useWatch('codeLanguage');

  return (
    <div className="node-panel-v2">
      {/* 输入参数 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>输入参数</Text>
        </div>
        <Form.Item name="inputArgs" noStyle>
          <InputArgsEditorV2
            referenceData={referenceData}
            placeholder="添加输入参数"
          />
        </Form.Item>
      </div>

      {/* 代码语言 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>代码语言</Text>
        </div>
        <Form.Item name="codeLanguage" initialValue="JavaScript">
          <Radio.Group>
            <Radio value="JavaScript">JavaScript</Radio>
            <Radio value="Python">Python</Radio>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 代码编辑器 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>代码</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            使用 args 访问输入参数，返回值需赋值给 result
          </Text>
        </div>
        {codeLanguage === 'JavaScript' ? (
          <Form.Item
            name="codeJavaScript"
            rules={[{ required: true, message: '请输入代码' }]}
          >
            <CodeEditorV2
              language="javascript"
              placeholder={`// 示例代码
function main(args) {
  const result = {};
  // 你的代码逻辑
  return result;
}`}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="codePython"
            rules={[{ required: true, message: '请输入代码' }]}
          >
            <CodeEditorV2
              language="python"
              placeholder={`# 示例代码
def main(args):
    result = {}
    # 你的代码逻辑
    return result`}
            />
          </Form.Item>
        )}
      </div>

      {/* 输出参数 */}
      <div className="node-panel-v2-section">
        <div className="node-panel-v2-section-header">
          <Text strong>输出参数</Text>
        </div>
        <Form.Item name="outputArgs" noStyle>
          <OutputArgsEditorV2
            placeholder="添加输出参数"
          />
        </Form.Item>
      </div>
    </div>
  );
};

export default CodeNodePanelV2;
