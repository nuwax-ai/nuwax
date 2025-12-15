/**
 * V2 代码节点配置面板
 * 从 v1 迁移，保持相同的功能和交互方式
 */

import CodeEditor from '@/components/CodeEditor';
import Monaco from '@/components/CodeEditor/monaco';
import CustomTree from '@/components/FormListItem/NestedForm';
import { ExpandAltOutlined } from '@ant-design/icons';
import { Button, Form } from 'antd';
import React, { useState } from 'react';

import { InputItemNameEnum } from '@/types/enums/node';
import { CodeLangEnum } from '@/types/enums/plugin';
import type { ChildNodeV2, NodePreviousAndArgMapV2 } from '../../../types';
import {
  InputAndOutV2,
  outPutConfigsV2,
} from '../../drawer/nodeConfig/commonNodeV2';

export interface CodeNodePanelV2Props {
  node: ChildNodeV2;
  referenceData?: NodePreviousAndArgMapV2;
}

const CodeNodePanelV2: React.FC<CodeNodePanelV2Props> = ({
  node,
  referenceData,
}) => {
  const form = Form.useFormInstance();
  const [show, setShow] = useState(false);

  // 根据 codeLanguage 动态选择字段名
  const codeLanguage =
    form.getFieldValue('codeLanguage') || CodeLangEnum.JavaScript;
  const fieldName =
    codeLanguage === CodeLangEnum.JavaScript ? 'codeJavaScript' : 'codePython';

  return (
    <>
      {/* 输入参数 */}
      <div className="node-item-style-v2">
        <InputAndOutV2
          title="输入"
          fieldConfigs={outPutConfigsV2}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
          referenceData={referenceData}
        />
      </div>

      {/* 代码编辑器 */}
      <div className="node-item-style-v2">
        <div>
          <div className="dis-sb margin-bottom">
            <span className="node-title-style-v2">代码</span>
            <Button
              icon={<ExpandAltOutlined />}
              size="small"
              type="text"
              onClick={() => setShow(true)}
            />
          </div>
          <CodeEditor
            form={form}
            value={form.getFieldValue(fieldName)}
            onChange={(value) => {
              form.setFieldValue(fieldName, value);
            }}
            codeLanguage={codeLanguage}
            height="180px"
          />
        </div>
      </div>

      {/* 输出参数 */}
      <CustomTree
        title="输出"
        key={`${node.type}-${node.id}-outputArgs`}
        params={(node.nodeConfig?.outputArgs as any) || []}
        form={form}
        inputItemName="outputArgs"
      />

      {/* Monaco 全屏编辑器 */}
      <Monaco form={form} isShow={show} close={() => setShow(false)} />
    </>
  );
};

export default CodeNodePanelV2;
