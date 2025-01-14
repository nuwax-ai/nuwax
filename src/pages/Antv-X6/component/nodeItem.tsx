// 这个页面定义普通的节点，如输入，输出，等
import CodeEditor from '@/components/CodeEditor';
import { ExpandAltOutlined } from '@ant-design/icons';
import type { InputRef } from 'antd';
import {
  Button,
  Divider,
  Input,
  InputNumber,
  Segmented,
  Select,
  Space,
  Switch,
} from 'antd';
import React, { useRef, useState } from 'react';
import { useModel } from 'umi';
import { cycleOption, InputConfigs, outPutConfigs } from '../params';
import { NodeDisposeProps } from '../type';
import { InputAndOut } from './commonNode';
// 定义一些公共的数组

// 定义开始节点
// 定义开始和文档提取节点的渲染逻辑
const StartNode: React.FC<NodeDisposeProps> = ({ type }) => {
  return (
    <>
      <InputAndOut
        title="输入"
        fieldConfigs={InputConfigs}
        initialValues={{ inputItems: [{ name: '', type: '' }] }}
        showCheckbox={true}
        showCopy={true}
        showAssociation={true}
      />
      {type && (
        <div className="margin-bottom">
          <div className="dis-sb margin-bottom">
            <span className="node-title-style">输出</span>
          </div>
        </div>
      )}
    </>
  );
};

// 定义结束和过程输出的节点渲染
const EndNode: React.FC<NodeDisposeProps> = ({ type }) => {
  const [value, setValue] = useState<string>('返回变量');
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
        fieldConfigs={outPutConfigs}
        showCopy={true}
        initialValues={{ inputItems: [{ name: '', paramsValue: '' }] }}
      />
      {type && (
        <div className="margin-bottom">
          <div className="dis-sb margin-bottom">
            <span className="node-title-style">输出内容</span>

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
          </div>
          <Input.TextArea
            placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、{{变量名[数组 索引]}}的方式引用输出参数中的变量"
            autoSize={{ minRows: 3, maxRows: 5 }}
            style={{ marginBottom: '10px' }}
          />
        </div>
      )}
    </>
  );
};

// 定义循环的节点渲染
const CycleNode: React.FC<NodeDisposeProps> = () => {
  const [selectOption, setSelectOption] = useState<number>(1);

  const [count, setCount] = useState<number | null>(1);

  return (
    <div>
      <div className=" node-item-style">
        <span className="node-title-style margin-bottom">循环设置</span>
        <Select
          options={cycleOption}
          onChange={(value) => setSelectOption(value)}
        ></Select>
      </div>
      {selectOption !== 3 && (
        <div className=" node-item-style">
          {selectOption === 1 && (
            <div>
              <InputAndOut
                title="循环数组"
                fieldConfigs={outPutConfigs}
                initialValues={{
                  inputItems: [{ name: '123', paramsValue: '123' }],
                }}
              />
            </div>
          )}
          {selectOption === 2 && (
            <div>
              <div className="node-title-style margin-bottom">循环次数</div>
              <InputNumber size="small" value={count} onChange={setCount} />
            </div>
          )}
        </div>
      )}
      <InputAndOut
        title="中间变量"
        fieldConfigs={outPutConfigs}
        initialValues={{
          inputItems: [{ name: '123', paramsValue: '123' }],
        }}
      />
      <InputAndOut
        title="输出"
        fieldConfigs={outPutConfigs}
        initialValues={{
          inputItems: [{ name: '123', paramsValue: '123' }],
        }}
      />
    </div>
  );
};

// 定义变量和文本处理的节点渲染
const VariableNode: React.FC<NodeDisposeProps> = ({ type }) => {
  const [value, setValue] = useState<string>('设置变量值');
  const [name, setName] = useState('');
  const inputRef = useRef<InputRef>(null);
  const [options, setOptions] = useState([
    { label: '换行 (\n)', value: '\n' },
    { label: '制表符 (\t)', value: '\t' },
    { label: '句号 (。)', value: '.' },
    { label: '逗号 (,)', value: ',' },
    { label: '分号 (;)', value: ';' },
    { label: '空格 ( )', value: ' ' },
  ]);
  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };
  const addItem = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    const _option = {
      label: name,
      value: name,
    };
    setOptions([...options, _option]);
    setName('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };
  return (
    <>
      <div className="node-item-style dis-center">
        <Segmented<string>
          options={
            type ? ['字符串拼接', '字符串分割'] : ['设置变量值', '获取变量值']
          }
          value={value}
          onChange={setValue}
          style={{ marginBottom: '10px' }}
        />
      </div>
      <InputAndOut
        title="输出变量"
        fieldConfigs={outPutConfigs}
        showCopy={true}
        initialValues={{ inputItems: [{ name: '123', paramsValue: '123' }] }}
      />
      {value === '字符串拼接' && (
        <div className="margin-bottom">
          <div className=" margin-bottom">
            <span className="node-title-style">字符串拼接</span>
          </div>
          <Input.TextArea
            placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、{{变量名[数组 索引]}}的方式引用输出参数中的变量"
            autoSize={{ minRows: 3, maxRows: 5 }}
            style={{ marginBottom: '10px' }}
          />
        </div>
      )}
      {value === '字符串分割' && (
        <div className="margin-bottom">
          <div className=" margin-bottom">
            <span className="node-title-style">字符串分割</span>
          </div>
          <Select
            style={{ width: 300 }}
            mode="multiple"
            placeholder="custom dropdown render"
            dropdownRender={(menu) => (
              <>
                {menu}
                <Divider style={{ margin: '8px 0' }} />
                <Space style={{ padding: '0 8px 4px' }}>
                  <Input
                    placeholder="Please enter item"
                    ref={inputRef}
                    value={name}
                    onChange={onNameChange}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  <Button type="text" onClick={addItem}>
                    添加自定义符号
                  </Button>
                </Space>
              </>
            )}
            options={options}
          />
        </div>
      )}
      {value !== '获取变量值' && (
        <div>
          <div className="node-title-style margin-bottom">输出</div>
        </div>
      )}
    </>
  );
};

// 定义代码节点
const CodeNode: React.FC<NodeDisposeProps> = () => {
  const { setIsShow } = useModel('monaco');
  return (
    <>
      <InputAndOut
        title="输入"
        fieldConfigs={InputConfigs}
        initialValues={{ inputItems: [{ name: '', type: '' }] }}
        showCheckbox={true}
        showCopy={true}
        showAssociation={true}
      />
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style ">代码</span>
          <ExpandAltOutlined onClick={() => setIsShow(true)} />
        </div>
        <CodeEditor height="180px" />
      </div>
      <InputAndOut
        title="输出变量"
        fieldConfigs={outPutConfigs}
        showCopy={true}
        initialValues={{ inputItems: [{ name: '123', paramsValue: '123' }] }}
      />
    </>
  );
};

export default { StartNode, EndNode, CycleNode, VariableNode, CodeNode };
