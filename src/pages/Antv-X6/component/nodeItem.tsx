// 这个页面定义普通的节点，如输入，输出，等
import CodeEditor from '@/components/CodeEditor';
import Monaco from '@/components/CodeEditor/monaco';
import CustomTree from '@/components/FormListItem/NestedForm';
import type { InputAndOutConfig, NodeConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import {
  CheckOutlined,
  ExpandAltOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Flex,
  Input,
  InputNumber,
  Popover,
  Segmented,
  Select,
  Space,
  Switch,
} from 'antd';
import React, { useState } from 'react';
import { cycleOption, outPutConfigs, variableConfigs } from '../params';
import { InputAndOut, TreeOutput } from './commonNode';
import './nodeItem.less';
// 定义一些公共的数组

// 定义开始节点
// 定义开始和文档提取节点的渲染逻辑
const StartNode: React.FC<NodeDisposeProps> = ({ params, Modified }) => {
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  return (
    <>
      <CustomTree
        title={'输入'}
        params={params}
        handleChangeNodeConfig={handleChangeNodeConfig}
      />
    </>
  );
};

const DocumentExtractionNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };
  return (
    <>
      <InputAndOut
        title="输入"
        fieldConfigs={outPutConfigs}
        referenceList={referenceList}
        showCopy={true}
        inputItemName="inputArgs"
        initialValues={{ inputArgs: params.inputArgs || [] }}
        handleChangeNodeConfig={handleChangeNodeConfig}
        disabledAdd
      />
      {params.outputArgs && (
        <div>
          <div className="node-title-style margin-bottom">输出</div>
          <TreeOutput treeData={params.outputArgs} />
        </div>
      )}
    </>
  );
};

// 定义结束和过程输出的节点渲染
const EndNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
  type,
}) => {
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };
  const [value, setValue] = useState<string>('返回变量');
  // 开关的状态
  const [checked, setChecked] = useState(true);
  return (
    <>
      {type === 'End' && (
        <div className="node-item-style dis-center">
          <Segmented<string>
            options={['返回变量', '返回文本']}
            value={value}
            onChange={setValue}
            style={{ marginBottom: '10px' }}
          />
        </div>
      )}
      <InputAndOut
        title="输出变量"
        fieldConfigs={outPutConfigs}
        referenceList={referenceList}
        showCopy={true}
        inputItemName="outputArgs"
        initialValues={{ outputArgs: params.outputArgs || [] }}
        handleChangeNodeConfig={handleChangeNodeConfig}
      />

      {value !== '返回变量' && (
        <div className="margin-bottom mt-16">
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
            value={params.content}
            onChange={(e) => {
              const newValue = e.target.value; // 直接从事件对象中获取最新值
              handleChangeNodeConfig({ ...params, content: newValue }); // 使用新值调用handleChangeNodeConfig
            }}
          />
        </div>
      )}
    </>
  );
};

// 定义循环的节点渲染
const CycleNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  let initialValues: InputAndOutConfig[] = [];
  if (params.inputArgs && params.inputArgs.length) {
    initialValues = params.inputArgs;
  }
  let outPutInitialValues: InputAndOutConfig[] = [];
  if (params.outputArgs && params.outputArgs.length) {
    outPutInitialValues = params.outputArgs;
  }
  let variableInitialValues: InputAndOutConfig[] = [];
  if (params.variableArgs && params.variableArgs.length) {
    variableInitialValues = params.variableArgs;
  }

  const [count, setCount] = useState<number | null>(1);

  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };
  return (
    <div>
      <div className=" node-item-style">
        <span className="node-title-style margin-bottom">循环设置</span>
        <Select
          value={params.loopType}
          options={cycleOption}
          onChange={(value) =>
            handleChangeNodeConfig({ ...params, loopType: value })
          }
        ></Select>
      </div>
      {params.loopType !== 'INFINITE_LOOP' && (
        <div className=" node-item-style">
          {params.loopType === 'ARRAY_LOOP' && (
            <div>
              <InputAndOut
                title="循环数组"
                fieldConfigs={outPutConfigs}
                referenceList={referenceList}
                inputItemName="inputArgs"
                handleChangeNodeConfig={handleChangeNodeConfig}
                initialValues={{ inputArgs: initialValues }}
              />
            </div>
          )}
          {params.loopType === 'SPECIFY_TIMES_LOOP' && (
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
        inputItemName="inputArgs"
        handleChangeNodeConfig={handleChangeNodeConfig}
        initialValues={{ inputArgs: outPutInitialValues }}
      />
      <InputAndOut
        title="输出"
        fieldConfigs={outPutConfigs}
        inputItemName="inputArgs"
        handleChangeNodeConfig={handleChangeNodeConfig}
        initialValues={{ inputArgs: variableInitialValues }}
      />
    </div>
  );
};

// 定义变量的节点渲染
const VariableNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  const outputArgs = params.outputArgs || null;

  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  const options = [
    { label: '设置变量值', value: 'SET_VARIABLE' },
    { label: '获取变量值', value: 'GET_VARIABLE' },
  ];

  return (
    <>
      <div className="node-item-style dis-center">
        <Segmented
          options={options}
          value={params.configType}
          onChange={(val) => {
            handleChangeNodeConfig({
              ...params,
              configType: val as 'SET_VARIABLE' | 'GET_VARIABLE',
            });
          }}
          style={{ marginBottom: '10px' }}
        />
      </div>
      <InputAndOut
        title={params.configType === 'SET_VARIABLE' ? '设置变量' : '输出变量'}
        fieldConfigs={
          params.configType === 'SET_VARIABLE' ? outPutConfigs : variableConfigs
        }
        referenceList={referenceList}
        inputItemName="inputArgs"
        handleChangeNodeConfig={handleChangeNodeConfig}
        initialValues={{ inputArgs: params.inputArgs || [] }}
      />

      {outputArgs && params.configType === 'SET_VARIABLE' && (
        <div>
          <div className="node-title-style margin-bottom">输出</div>
          <TreeOutput treeData={outputArgs} />
        </div>
      )}
    </>
  );
};

// 定义一个数组链接设置
export const ArrayLinkSetting: React.FC<{
  initValue: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}> = ({ initValue, onChange, multiple }) => {
  const [options, setOptions] = useState([
    { value: '\\n', label: '换行 (\\n)' },
    { value: '\\t', label: '制表符 (\\t)' },
    { value: '.', label: '句号 (。)' },
    { value: ',', label: '逗号 (,)' },
    { value: ';', label: '分号 (;)' },
    { value: '|', label: '空格 ( )' },
  ]);

  const [newItem, setNewItem] = useState({
    label: '',
    value: '',
  });

  // 添加新选项
  const addItem = (
    e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>,
  ) => {
    e.preventDefault();
    setOptions([...options, newItem]);
    setNewItem({ label: '', value: '' });
  };

  return (
    <div className="array-link-setting">
      <Select
        allowClear
        placeholder={'请选择连接符号'}
        mode={multiple ? 'multiple' : undefined}
        value={multiple ? (initValue as string[]) : (initValue as string)}
        onChange={onChange}
        className="array-link-setting-select"
        dropdownRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: '8px 0' }} />
            <div style={{ padding: '8px' }} className="dis-sb">
              <Space>
                <Input
                  value={newItem.label}
                  placeholder="选项名称"
                  onChange={(e) =>
                    setNewItem({ value: newItem.value, label: e.target.value })
                  }
                />
                <Input
                  value={newItem.value}
                  placeholder="选项值"
                  onChange={(e) =>
                    setNewItem({ label: newItem.label, value: e.target.value })
                  }
                />
                <Button type="primary" onClick={addItem}>
                  添加
                </Button>
              </Space>
            </div>
          </>
        )}
        options={options}
        optionRender={(option) => {
          return (
            <Flex gap={8} align={'center'}>
              <div className="array-link-setting-select-option-icon">
                {initValue === option.data.value && <CheckOutlined />}
              </div>
              <div>{option.data.label}</div>
            </Flex>
          );
        }}
      ></Select>
    </div>
  );
};
// 定义文本处理的节点渲染
const TextProcessingNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  // 输入参数的初始值

  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  const textTypeOptions = [
    { label: '字符串拼接', value: 'CONCAT' },
    { label: '字符串分割', value: 'SPLIT' },
  ];

  return (
    <>
      <div className="node-item-style dis-center">
        <Segmented
          options={textTypeOptions}
          value={params.textHandleType ?? 'CONCAT'}
          onChange={(val) => {
            handleChangeNodeConfig({
              ...params,
              textHandleType: val as 'CONCAT' | 'SPLIT',
            });
          }}
          style={{ marginBottom: '10px' }}
        />
      </div>
      <InputAndOut
        title="输入"
        fieldConfigs={outPutConfigs}
        referenceList={referenceList}
        inputItemName="inputArgs"
        handleChangeNodeConfig={handleChangeNodeConfig}
        initialValues={{ inputArgs: params.inputArgs || [] }}
      />
      {params.textHandleType === 'CONCAT' && (
        <div className="margin-bottom">
          <div className="dis-sb margin-bottom">
            <span className="node-title-style">字符串拼接</span>
            <Popover
              content={
                <>
                  <p className="node-title-style">数组连接符设置</p>
                  <p>使用以下符号来自动连接数组中的每个项目</p>
                  <p className="array-link-setting-select-label">连接符</p>
                  <ArrayLinkSetting
                    initValue={params.join || ''}
                    onChange={(value) =>
                      Modified({ ...params, join: value as string })
                    }
                  />
                </>
              }
              trigger="click"
            >
              <SettingOutlined />
            </Popover>
          </div>
          <Input.TextArea
            value={params.text}
            placeholder="可以使用{{变量名}}、{{变量名.子变量名}}、{{变量名[数组 索引]}}的方式引用输出参数中的变量"
            autoSize={{ minRows: 3, maxRows: 5 }}
            style={{ marginBottom: '10px' }}
            onChange={(e) => {
              const newValue = e.target.value; // 直接从事件对象中获取最新值
              handleChangeNodeConfig({ ...params, text: newValue }); // 使用新值调用handleChangeNodeConfig
            }}
          />
        </div>
      )}
      {params.textHandleType === 'SPLIT' && (
        <>
          <span className="node-title-style">分隔符</span>
          <ArrayLinkSetting
            initValue={params.splits || []}
            onChange={(value) =>
              Modified({ ...params, splits: value as string[] | undefined })
            }
            multiple
          />
        </>
      )}
      {params.outputArgs && params.configType === 'SET_VARIABLE' && (
        <div>
          <div className="node-title-style margin-bottom">输出</div>
          <TreeOutput treeData={params.outputArgs} />
        </div>
      )}
    </>
  );
};

// 定义代码节点
const CodeNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  const [show, setShow] = useState(false);

  // 修改模型的代码
  const changeCode = (code: string) => {
    Modified({ ...params, code });
  };
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };
  return (
    <>
      <InputAndOut
        title="输入"
        fieldConfigs={outPutConfigs}
        inputItemName="inputArgs"
        handleChangeNodeConfig={handleChangeNodeConfig}
        initialValues={{ inputArgs: params.inputArgs || [] }}
        referenceList={referenceList}
      />
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style ">代码</span>
          <ExpandAltOutlined onClick={() => setShow(true)} />
        </div>
        <CodeEditor
          value={
            params.codeLanguage === 'Python'
              ? params.codePython
              : params.codeJavaScript
          }
          changeCode={changeCode}
          height="180px"
        />
      </div>
      <CustomTree
        title={'输出'}
        params={params}
        handleChangeNodeConfig={handleChangeNodeConfig}
        inputItemName={'outputArgs'}
      />

      <Monaco
        params={params}
        Modified={Modified}
        isShow={show}
        close={() => setShow(false)}
      />
    </>
  );
};

export default {
  StartNode,
  EndNode,
  CycleNode,
  VariableNode,
  CodeNode,
  TextProcessingNode,
  DocumentExtractionNode,
};
