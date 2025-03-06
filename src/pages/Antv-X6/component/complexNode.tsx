import Created from '@/components/Created';
import ExpandableInputTextarea from '@/components/ExpandTextArea';
import CustomTree from '@/components/FormListItem/NestedForm';
import { ModelSelected } from '@/components/ModelSetting';
import { SkillList } from '@/components/Skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type { NodeConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Empty,
  Form,
  Input,
  Radio,
  RadioChangeEvent,
  Select,
  Space,
} from 'antd';
import React, { useState } from 'react';
import '../index.less';
import { outPutConfigs } from '../params';
import { FormList, InputAndOut, TreeOutput } from './commonNode';
// 定义大模型节点

const ModelNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
  updateNode,
}) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);

  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  // 新增技能
  const onAddedSkill = (item: CreatedNodeItem) => {
    item.type = item.targetType;
    item.typeId = item.targetId;
    const skillComponentConfigs = params.skillComponentConfigs || [];
    if (updateNode) {
      updateNode({
        ...params,
        skillComponentConfigs: [...skillComponentConfigs, item],
      });
      setOpen(false);
    }
  };

  //   显示新增技能
  const showAdd = () => {
    setOpen(true);
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
        {params.skillComponentConfigs &&
          params.skillComponentConfigs.length > 0 && (
            <SkillList params={params} handleChange={handleChangeNodeConfig} />
          )}
        {(!params.skillComponentConfigs ||
          !params.skillComponentConfigs.length) && <Empty />}
      </div>
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="inputArgs"
          handleChangeNodeConfig={handleChangeNodeConfig}
          initialValues={{ inputArgs: params.inputArgs || [] }}
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
        <CustomTree
          title={'输出'}
          notShowTitle
          params={params}
          handleChangeNodeConfig={handleChangeNodeConfig}
          inputItemName={'outputArgs'}
        />
      </div>

      <Created
        checkTag={AgentComponentTypeEnum.Plugin}
        spaceId={36}
        onAdded={onAddedSkill}
        open={open}
        onCancel={() => setOpen(false)}
        hasIds={params.skillComponentConfigs?.map((item) =>
          Number(item.typeId),
        )}
      />
    </div>
  );
};

// 定义意图识别
const IntentionNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
  updateNode,
}) => {
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  const changeIntent = (newNodeConfig: NodeConfig) => {
    if (updateNode) {
      updateNode({
        ...params,
        ...newNodeConfig,
        extension: {
          ...params.extension,
          height: newNodeConfig?.intentConfigs!.length * 18 + 42,
        },
      });
    }
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
          initialValues={{ inputArgs: params.inputArgs || [] }}
        />
      </div>
      {/* 意图匹配 */}
      <div className="node-item-style">
        <FormList
          title={'意图匹配'}
          handleChangeNodeConfig={handleChangeNodeConfig}
          field="intent"
          inputItemName="intentConfigs"
          initialValues={{ intentConfigs: params.intentConfigs || [] }}
          updateNode={changeIntent}
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
      {/* 输出 */}
      <p className="node-title-style mt-16">{'输出'}</p>
      <TreeOutput treeData={params.outputArgs || []} />
    </div>
  );
};

// 定义问答
const QuestionsNode: React.FC<NodeDisposeProps> = ({
  params,
  Modified,
  referenceList,
  updateNode,
}) => {
  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  const changeOptions = (newNodeConfig: NodeConfig) => {
    if (updateNode) {
      updateNode({
        ...params,
        ...newNodeConfig,
        answerType: 'SELECT',
        extension: {
          ...params.extension,
          height: newNodeConfig?.options!.length * 18 + 110,
        },
      });
    }
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
          initialValues={{ inputArgs: params.inputArgs || [] }}
        />
      </div>
      {/* 提问问题 */}
      <ExpandableInputTextarea
        title="提问问题"
        value={params.question || ''}
        onChange={(value: string) =>
          handleChangeNodeConfig({ ...params, question: value })
        }
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
          <CustomTree
            title={'输出'}
            params={params}
            handleChangeNodeConfig={handleChangeNodeConfig}
            inputItemName={'outputArgs'}
          />
        </div>
      )}
      {/* 选项内容 */}
      {params.answerType === 'SELECT' && (
        <FormList
          title={'设置选项内容'}
          updateNode={changeOptions}
          field="content"
          inputItemName="options"
          initialValues={{ options: params.options || [] }}
          showIndex
          handleChangeNodeConfig={handleChangeNodeConfig}
        />
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
    { label: 'json', value: 'JSON' },
    { label: 'form-data', value: 'FORM_DATA' },
    { label: 'x-www-form-urlencoded', value: 'X_WWW_FORM_URLENCODED' },
    { label: '无', value: 'OTHER' },
  ];

  const [form] = Form.useForm();

  // 修改模型的入参和出参
  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    Modified({ ...params, ...newNodeConfig });
  };

  const submitForm = () => {
    const values = form.getFieldsValue();
    handleChangeNodeConfig(values);
  };

  return (
    <div>
      {/* 请求配置 */}
      <div className="node-item-style">
        <p className="node-title-style">请求配置</p>
        <Form
          form={form}
          onValuesChange={submitForm}
          initialValues={params}
          layout={'vertical'}
        >
          <Form.Item label="请求方法与路径">
            <div className="dis-sb">
              <Form.Item name="method" noStyle>
                <Select
                  style={{ width: '30%', marginRight: '10px' }}
                  options={methodOption}
                  placeholder="请求方法"
                  defaultValue={'GET'}
                ></Select>
              </Form.Item>
              <Form.Item name="url" noStyle>
                <Input placeholder="请输入url地址"></Input>
              </Form.Item>
            </div>
          </Form.Item>
          <Form.Item label="请求内容格式" name="contentType">
            <Radio.Group className="margin-bottom" defaultValue={'JSON'}>
              <Space wrap>
                {methodOptions.map((item) => (
                  <Radio key={item.value} value={item.value}>
                    {item.label}
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="请求超时配置" name="timeout">
            <Input placeholder="请输入超时配置时长"></Input>
          </Form.Item>
        </Form>
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
            headers: params.headers || [],
          }}
        />
        <InputAndOut
          title="Query"
          handleChangeNodeConfig={handleChangeNodeConfig}
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="queries"
          initialValues={{
            queries: params.queries || [],
          }}
        />
        <InputAndOut
          title="Body"
          handleChangeNodeConfig={handleChangeNodeConfig}
          fieldConfigs={outPutConfigs}
          referenceList={referenceList}
          inputItemName="body"
          initialValues={{
            body: params.body || [],
          }}
        />
      </div>
      {/* 出参 */}
      <div className="node-item-style">
        <CustomTree
          title={'出参'}
          params={params}
          handleChangeNodeConfig={handleChangeNodeConfig}
          inputItemName={'outputArgs'}
        />
      </div>
    </div>
  );
};

export default { ModelNode, IntentionNode, QuestionsNode, HttpToolNode };
