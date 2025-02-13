import ExpandableInputTextarea from '@/components/ExpandTextArea';
import { ModelSelected } from '@/components/ModelSetting';
import type { InputAndOutConfig, NodeConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Empty,
  Input,
  Radio,
  RadioChangeEvent,
  Select,
  Space,
} from 'antd';
import React from 'react';
import '../index.less';
import { InputConfigs, intentionConfigs, outPutConfigs } from '../params';
import { InputAndOut } from './commonNode';

// 定义大模型节点

const ModelNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  let inputInitialValues = {};
  if (params.inputArgs && params.inputArgs.length) {
    inputInitialValues = params.inputArgs;
  }
  let outputInitialValues = {};
  if (params.outputArgs && params.outputArgs.length) {
    outputInitialValues = params.outputArgs;
  }

  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  //   显示新增技能
  const showAdd = () => {
    console.log('showAdd');
  };

  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <ModelSelected onChange={handleChangeNodeConfig} nodeConfig={params} />
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
          referenceList={referenceList}
          inputItemName="inputArgs"
          handleChangeNodeConfig={handleChangeNodeConfig}
          initialValues={inputInitialValues}
        />
      </div>
      {/* 系统提示词 */}
      <ExpandableInputTextarea
        title="系统提示词"
        value={params.systemPrompt || ''}
        onChange={(value: string) =>
          Modified({ ...params, systemPrompt: value })
        }
        onExpand
        onOptimize
        placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
      />
      {/* 用户提示词 */}
      <ExpandableInputTextarea
        title="用户提示词"
        value={params.userPrompt || ''}
        onChange={(value: string) => Modified({ ...params, userPrompt: value })}
        onExpand
        placeholder="用户提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输出参数中的变量"
      />
      {/* 输出参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输出"
          fieldConfigs={InputConfigs}
          handleChangeNodeConfig={handleChangeNodeConfig}
          inputItemName="outputArgs"
          showCopy={true}
          showAssociation={true}
          initialValues={outputInitialValues}
        />
      </div>
    </div>
  );
};

// 定义意图识别
const IntentionNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  let inputInitialValues = {};
  if (params.inputArgs && params.inputArgs.length) {
    inputInitialValues = params.inputArgs;
  }

  let outputInitialValues = {};
  if (params.outputArgs && params.outputArgs.length) {
    outputInitialValues = params.outputArgs;
  }
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <ModelSelected onChange={handleChangeNodeConfig} nodeConfig={params} />
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="inputArgs"
          handleChangeNodeConfig={handleChangeNodeConfig}
          initialValues={inputInitialValues}
        />
      </div>
      {/* 意图匹配 */}
      <div className="node-item-style">
        <InputAndOut
          title="意图匹配"
          fieldConfigs={intentionConfigs}
          handleChangeNodeConfig={handleChangeNodeConfig}
          inputItemName="outputArgs"
          initialValues={{
            inputItems: [outputInitialValues],
          }}
        />
      </div>
      {/* 补充提示词 */}
      <ExpandableInputTextarea
        title="补充提示词"
        value={params.systemPrompt || ''}
        onChange={(value: string) =>
          Modified({ ...params, systemPrompt: value })
        }
        onExpand
        placeholder="支持额外的系统提示词，如对意图选项做更详细的例子以增 强用户输出与意图匹配的成功率。"
      />
    </div>
  );
};

// 定义问答
const QuestionsNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  let inputInitialValues: InputAndOutConfig[] = [];
  if (params.inputArgs && params.inputArgs.length) {
    inputInitialValues = params.inputArgs;
  }
  let outputInitialValues: InputAndOutConfig[] = [];
  if (params.outputArgs && params.outputArgs.length) {
    outputInitialValues = params.outputArgs;
  }

  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };
  return (
    <div className="node-title-style">
      {/* 模型模块 */}
      <ModelSelected onChange={handleChangeNodeConfig} nodeConfig={params} />
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          handleChangeNodeConfig={handleChangeNodeConfig}
          referenceList={referenceList}
          inputItemName="inputArgs"
          initialValues={{ inputArgs: inputInitialValues }}
        />
      </div>
      {/* 提问问题 */}
      <ExpandableInputTextarea
        title="提问问题"
        value={params.question || ''}
        onChange={(value: string) => Modified({ ...params, question: value })}
        onExpand
        placeholder="可使用{{变量名}}的方式引用输入参数中的变量"
      />
      {/* 回答类型 */}
      <div>
        <Radio.Group
          onChange={(value: RadioChangeEvent) =>
            Modified({ ...params, answerType: value.target.value })
          }
          value={params.answerType}
        >
          <Space direction="vertical">
            <Radio value={'TEXT'}>直接回答</Radio>
            <Radio value={'SELECT'}>选项回答</Radio>
          </Space>
        </Radio.Group>
      </div>
      {/* 输出参数 */}
      {params.answerType === 'TEXT' && (
        <div className="node-item-style">
          <InputAndOut
            title="输出"
            fieldConfigs={InputConfigs}
            handleChangeNodeConfig={handleChangeNodeConfig}
            inputItemName="outputArgs"
            showCopy={true}
            showAssociation={true}
            initialValues={outputInitialValues}
          />
        </div>
      )}
      {/* 选项内容 */}
      {params.answerType === 'SELECT' && (
        <>
          <div className="dis-sb margin-bottom">
            <span className="node-title-style">设置选项内容</span>
            <Button
              icon={<PlusOutlined />}
              size={'small'}
              onClick={() =>
                handleChangeNodeConfig({
                  ...params,
                  options: [
                    ...(params.options || []),
                    {
                      index: ((params.options?.length || 0) + 1).toString(),
                      content: '',
                    },
                  ],
                })
              }
            ></Button>
          </div>
          {params.options?.map((item) => (
            <div key={item.index} className="dis-sb">
              <span>{item.index}</span>
              <Input value={item.content} onChange={() => {}}></Input>
              <DeleteOutlined
                onClick={() =>
                  handleChangeNodeConfig({
                    ...params,
                    options: params.options?.filter(
                      (sun) => sun.index !== item.index,
                    ),
                  })
                }
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
};

// 定义http工具
const HttpToolNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
}) => {
  // 请求方法的选项
  const methodOption = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'PATCH', value: 'PATCH' },
  ];

  // 各种方法的options
  const methodOptions = [
    { label: 'json', value: 'json' },
    { label: 'form-data', value: 'formdata' },
    { label: 'x-www-form-urlencoded', value: 'urlencoded' },
    { label: '无', value: 'none' },
  ];

  // 请求头的数据
  let headersInitialValues: InputAndOutConfig[] = [];
  if (params.headers && params.headers.length) {
    headersInitialValues = params.headers;
  }
  // 节点入参
  let queriesInitialValues: InputAndOutConfig[] = [];
  if (params.queries && params.queries.length) {
    queriesInitialValues = params.queries;
  }
  // body的数据
  let bodyInitialValues: InputAndOutConfig[] = [];
  if (params.body && params.body.length) {
    bodyInitialValues = params.body;
  }

  // 节点出参
  let outputInitialValues: InputAndOutConfig[] = [];
  if (params.outputArgs && params.outputArgs.length) {
    outputInitialValues = params.outputArgs;
  }
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    console.log('123', newNodeConfig);
    Modified({ ...params, ...newNodeConfig });
  };

  return (
    <div>
      {/* 请求配置 */}
      <div className="node-item-style">
        <p className="node-title-style">请求配置</p>
        <p className="sub-item-title">请求方法与路径</p>
        <div className="margin-bottom">
          <Space>
            <Select
              value={params.method}
              style={{ width: 140 }}
              options={methodOption}
              onChange={(value) =>
                handleChangeNodeConfig({ ...params, method: value })
              }
            ></Select>
            <Input
              value={params.url}
              onChange={(e) =>
                handleChangeNodeConfig({ ...params, url: e.target.value })
              }
            ></Input>
          </Space>
        </div>
        <p className="margin-bottom">请求内容格式</p>
        <Radio.Group
          onChange={(value: RadioChangeEvent) =>
            handleChangeNodeConfig({
              ...params,
              contentType: value.target.value,
            })
          }
          value={params.contentType}
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
        <Input
          value={params.timeout}
          onChange={(e) =>
            handleChangeNodeConfig({ ...params, timeout: e.target.value })
          }
        ></Input>
      </div>
      {/* 入参 */}
      <div className="node-item-style">
        <InputAndOut
          title="Header"
          handleChangeNodeConfig={handleChangeNodeConfig}
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="headers"
          initialValues={{
            headers: headersInitialValues,
          }}
        />
        <InputAndOut
          title="Query"
          handleChangeNodeConfig={handleChangeNodeConfig}
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="queries"
          initialValues={{
            queries: queriesInitialValues,
          }}
        />
        <InputAndOut
          title="Body"
          handleChangeNodeConfig={handleChangeNodeConfig}
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="body"
          initialValues={{
            body: bodyInitialValues,
          }}
        />
      </div>
      {/* 出参 */}
      <div className="node-item-style">
        <InputAndOut
          title="出参"
          fieldConfigs={InputConfigs}
          handleChangeNodeConfig={handleChangeNodeConfig}
          inputItemName="outputArgs"
          initialValues={{
            outputArgs: outputInitialValues,
          }}
        />
      </div>
    </div>
  );
};

export default { ModelNode, IntentionNode, QuestionsNode, HttpToolNode };
