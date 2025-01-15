import ExpandableInputTextarea from '@/components/ExpandTextArea';
import { ModelSelected } from '@/components/ModelSetting';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Empty,
  Input,
  Radio,
  RadioChangeEvent,
  Select,
  Space,
} from 'antd';
import React, { useState } from 'react';
import '../index.less';
import { InputConfigs, intentionConfigs, outPutConfigs } from '../params';
import { NodeDisposeProps } from '../type';
import { InputAndOut } from './commonNode';
// 定义大模型节点
const ModelNode: React.FC<NodeDisposeProps> = ({ groupedOptionsData }) => {
  // 三个值(随机性，top，最大回复长度)
  const [value, setValue] = useState({
    top: 0,
    reply: 0,
    random: 0,
  });
  //   修改上述三个值
  const handleModelSetValue = (newSettings: typeof value) => {
    setValue(newSettings);
  };

  const settings = {
    value: value,
    onChange: handleModelSetValue,
  };

  //   选择模型的
  const [selectModel, setSelectModel] = useState('');
  //   跟换选中的模型
  const changeModel = (newModel: typeof selectModel) => {
    setSelectModel(newModel);
  };
  const groupModelList = {
    value: selectModel,
    onChange: changeModel,
    groupedOptionsData: groupedOptionsData,
  };

  // 用户提示词
  const [userPrompt, setUserPrompt] = useState('');
  // 系统提示词
  const [systemPrompt, setSystemPrompt] = useState('');
  //   显示新增技能
  const showAdd = () => {
    console.log('showAdd');
  };

  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <ModelSelected settings={settings} groupModelList={groupModelList} />
      {/* 技能模块 */}
      <div className="node-item-style">
        <div className="dis-sb margin-bottom">
          <span className="node-title-style">技能</span>
          <Button
            icon={<PlusOutlined />}
            size={'small'}
            onClick={showAdd}
          ></Button>
        </div>
        <Empty />
      </div>
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
      {/* 系统提示词 */}
      <ExpandableInputTextarea
        title="系统提示词"
        value={systemPrompt}
        onChange={setSystemPrompt}
        onExpand
        placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
      />
      {/* 用户提示词 */}
      <ExpandableInputTextarea
        title="用户提示词"
        value={userPrompt}
        onChange={setUserPrompt}
        onExpand
        placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
      />
      {/* 输出参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输出"
          fieldConfigs={InputConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
    </div>
  );
};

// 定义意图识别
const IntentionNode: React.FC<NodeDisposeProps> = ({
  groupedOptionsData = [],
}) => {
  // 三个值(随机性，top，最大回复长度)
  const [value, setValue] = useState({
    top: 0,
    reply: 0,
    random: 0,
  });
  //   修改上述三个值
  const handleModelSetValue = (newSettings: typeof value) => {
    setValue(newSettings);
  };

  const settings = {
    value: value,
    onChange: handleModelSetValue,
  };

  //   选择模型的
  const [selectModel, setSelectModel] = useState('');
  //   更换选中的模型
  const changeModel = (newModel: typeof selectModel) => {
    setSelectModel(newModel);
  };
  const groupModelList = {
    value: selectModel,
    onChange: changeModel,
    groupedOptionsData: groupedOptionsData,
  };

  // 用户提示词的数据
  const [userPrompt, setUserPrompt] = useState('');

  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <ModelSelected settings={settings} groupModelList={groupModelList} />
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
      {/* 意图匹配 */}
      <div className="node-item-style">
        <InputAndOut
          title="意图匹配"
          fieldConfigs={intentionConfigs}
          initialValues={{
            inputItems: [{ intention: '' }],
          }}
        />
      </div>
      {/* 补充提示词 */}
      <ExpandableInputTextarea
        title="补充提示词"
        value={userPrompt}
        onChange={setUserPrompt}
        onExpand
        placeholder="支持额外的系统提示词，如对意图选项做更详细的例子以增 强用户输出与意图匹配的成功率。"
      />
    </div>
  );
};

// 定义问答
const QuestionsNode: React.FC<NodeDisposeProps> = ({
  groupedOptionsData = [],
}) => {
  // 三个值(随机性，top，最大回复长度)
  const [value, setValue] = useState({
    top: 0,
    reply: 0,
    random: 0,
  });
  //   修改上述三个值
  const handleModelSetValue = (newSettings: typeof value) => {
    setValue(newSettings);
  };

  const settings = {
    value: value,
    onChange: handleModelSetValue,
  };

  //   选择模型的
  const [selectModel, setSelectModel] = useState('');
  //   更换选中的模型
  const changeModel = (newModel: typeof selectModel) => {
    setSelectModel(newModel);
  };
  const groupModelList = {
    value: selectModel,
    onChange: changeModel,
    groupedOptionsData: groupedOptionsData,
  };
  // 用户提示词的数据
  const [params, setParams] = useState({
    questions: '',
    answers: 1,
  });

  return (
    <div className="node-title-style">
      {/* 模型模块 */}
      <ModelSelected settings={settings} groupModelList={groupModelList} />
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
      {/* 提问问题 */}
      <ExpandableInputTextarea
        title="提问问题"
        value={params.questions}
        onChange={(value: string) => {
          setParams({ ...params, questions: value });
        }}
        onExpand
        placeholder="可使用{{变量名}}的方式引用输入参数中的变量"
      />
      {/* 回答类型 */}
      <div>
        <Radio.Group
          onChange={(value: RadioChangeEvent) =>
            setParams({ ...params, answers: value.target.value })
          }
          value={params.answers}
        >
          <Space direction="vertical">
            <Radio value={1}>直接回答</Radio>
            <Radio value={2}>选项回答</Radio>
          </Space>
        </Radio.Group>
      </div>
      {/* 输出参数 */}
      {params.answers === 1 && (
        <div className="node-item-style">
          <InputAndOut
            title="输出"
            fieldConfigs={InputConfigs}
            initialValues={{
              inputItems: [{ name: '', type: '', isSelect: true }],
            }}
          />
        </div>
      )}
      {/* 选项内容 */}
      {params.answers === 2 && (
        <div className="node-item-style">
          <InputAndOut
            title="设置选项内容"
            fieldConfigs={intentionConfigs}
            initialValues={{
              inputItems: [{ intention: '' }],
            }}
          />
        </div>
      )}
    </div>
  );
};

// 定义http工具
const HttpToolNode: React.FC<NodeDisposeProps> = ({}) => {
  // 各种方法的options
  const methodOptions = [
    { label: 'json', value: 'json' },
    { label: 'form-data', value: 'formdata' },
    { label: 'x-www-form-urlencoded', value: 'urlencoded' },
    { label: '无', value: 'none' },
  ];

  const [params, setParams] = useState({
    method: '',
    path: '',
    timeout: '',
    body: '',
  });

  return (
    <div>
      {/* 请求配置 */}
      <div className="node-item-style">
        <p className="node-title-style">请求配置</p>
        <p className="sub-item-title">请求方法与路径</p>
        <div className="margin-bottom">
          <Space>
            <Select value={params.method} style={{ width: 140 }}></Select>
            <Input value={params.path}></Input>
          </Space>
        </div>
        <p className="margin-bottom">请求内容格式</p>
        <Radio.Group
          onChange={(value: RadioChangeEvent) =>
            setParams({ ...params, body: value.target.value })
          }
          value={params.body}
          className="margin-bottom"
        >
          <Space wrap>
            {methodOptions.map((item) => (
              <Radio key={item.value} value={item.value}>
                {item.label}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
        <p className="margin-bottom">请求超时配置</p>
        <Input value={params.timeout}></Input>
      </div>
      {/* 入参 */}
      <div className="node-item-style">
        <InputAndOut
          title="Header"
          fieldConfigs={outPutConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
        <InputAndOut
          title="Query"
          fieldConfigs={outPutConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
        <InputAndOut
          title="Body"
          fieldConfigs={outPutConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '', isSelect: true }],
          }}
        />
      </div>
      {/* 出参 */}
      <div className="node-item-style">
        <InputAndOut
          title="出参"
          fieldConfigs={InputConfigs}
          initialValues={{
            inputItems: [{ name: '', type: '' }],
          }}
        />
      </div>
    </div>
  );
};

export default { ModelNode, IntentionNode, QuestionsNode, HttpToolNode };
