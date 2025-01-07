// 这个页面定义普通的节点，如输入，输出，等
import { Cascader, Input, Segmented, Switch } from 'antd';
import React, { useState } from 'react';
import { dataTypes, modelTypes } from '../params';
import { NodeDisposeProps } from '../type';
import { InputAndOut, InputOrReference } from './commonNode';
// 定义开始节点
// 定义开始节点的渲染逻辑
const StartNode: React.FC<NodeDisposeProps> = () => {
  const fieldConfigs = [
    {
      name: 'name',
      placeholder: '变量名',
      label: '变量名',
      rules: [{ required: true, message: '请输入变量名' }],
      component: Input,
      style: { width: '140px' },
    },
    {
      name: 'type',
      placeholder: '选择类型',
      label: '变量类型',
      rules: [{ required: true, message: '请选择变量类型' }],
      component: Cascader,
      style: { width: '100px' },
      props: { options: dataTypes }, // 传递特定于 Cascader 的属性
    },
  ];

  return (
    <InputAndOut
      title="输入"
      fieldConfigs={fieldConfigs}
      initialValues={{ inputItems: [{ name: '', type: '' }] }}
      showCheckbox={true}
      showCopy={true}
      showAssociation={true}
    />
  );
};

// 定义结束和过程输出的节点渲染
const EndNode: React.FC<NodeDisposeProps> = ({ type }) => {
  const [value, setValue] = useState<string>('返回变量');
  const fieldConfigs = [
    {
      name: 'name',
      placeholder: '参数名',
      label: '参数名',
      rules: [{ required: true, message: '请输入参数名' }],
      component: Input,
    },
    {
      name: 'paramsValue',
      placeholder: '输入或引用参数值',
      label: '参数值',
      rules: [{ required: true, message: '请输入参数值' }],
      component: InputOrReference,
      style: { flex: '0 0 50%' },
      props: { referenceList: modelTypes, fieldName: 'paramsValue' },
    },
  ];
  // 开关的状态
  const [checked, setChecked] = useState(true);
  return (
    <>
      <div className="node-item-style dis-center">
        <Segmented<string>
          options={['返回变量', '返回文本']}
          value={value}
          onChange={setValue}
          style={{ marginBottom: '10px' }}
        />
      </div>
      <InputAndOut
        title="输出变量"
        fieldConfigs={fieldConfigs}
        showCopy={true}
        initialValues={{ inputItems: [{ name: '123', paramsValue: '123' }] }}
      />
      <div className="margin-bottom">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">输出内容</span>
          {type && (
            <div>
              <span className="node-title-grey-style">
                {checked ? '流式输出' : '非流式输出'}
              </span>
              <Switch
                defaultChecked
                onChange={() => setChecked(!checked)}
                size="small"
              />
            </div>
          )}
        </div>
        <Input.TextArea
          placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、{{变量名[数组 索引]}}的方式引用输出参数中的变量"
          autoSize={{ minRows: 3, maxRows: 5 }}
          style={{ marginBottom: '10px' }}
        />
      </div>
    </>
  );
};

// 定义循环的节点渲染
const CycleNode: React.FC<NodeDisposeProps> = () => {
  return <div>循环节点</div>;
};

export default { StartNode, EndNode, CycleNode };
