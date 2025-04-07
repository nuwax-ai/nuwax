import Created from '@/components/Created';
import type { HasIdsType } from '@/components/Created/type';
import ExpandableInputTextarea from '@/components/ExpandTextArea';
import CustomTree from '@/components/FormListItem/NestedForm';
import { ModelSelected } from '@/components/ModelSetting';
import { SkillList } from '@/components/Skill';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { InputItemNameEnum } from '@/types/enums/node';
import { CreatedNodeItem } from '@/types/interfaces/common';
import type { NodeConfig } from '@/types/interfaces/node';
import { NodeDisposeProps } from '@/types/interfaces/workflow';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Empty, Form, Input, Radio, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import '../index.less';
import { outPutConfigs } from '../params';
import { FormList, InputAndOut, TreeOutput } from './commonNode';
// 定义大模型节点
const ModelNode: React.FC<NodeDisposeProps> = ({
  form,
  params,
  Modified,
  updateNode,
}) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  // 添加状态保持稳定key
  const [outputKey] = useState(() => uuidv4());
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
    }
    setOpen(false);
  };

  //   显示新增技能
  const showAdd = () => {
    setOpen(true);
  };

  const hasIds: HasIdsType = {
    [AgentComponentTypeEnum.Plugin]: [],
    [AgentComponentTypeEnum.Workflow]: [],
    [AgentComponentTypeEnum.Knowledge]: [],
  };

  // 遍历 skillComponentConfigs 并填充 hasIds
  for (const item of params.skillComponentConfigs || []) {
    if (item.type) {
      const type = item.type as AgentComponentTypeEnum; // 明确类型
      if (hasIds[type]) {
        hasIds[type]?.push(Number(item.typeId));
      }
    }
  }

  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <ModelSelected onChange={handleChangeNodeConfig} nodeConfig={params} />
      {/* 技能模块 */}
      <div className="dis-sb margin-bottom">
        <span className="node-title-style">技能</span>
        <Button
          icon={<PlusOutlined />}
          size={'small'}
          onClick={showAdd}
        ></Button>
      </div>
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('skillComponentConfigs') ? (
            <SkillList
              skillName={'skillComponentConfigs'}
              params={params}
              handleChange={handleChangeNodeConfig}
            />
          ) : (
            <Empty />
          )
        }
      </Form.Item>
      {/* 输入参数 */}
      <InputAndOut
        nodeKey={outputKey}
        title="输入"
        fieldConfigs={outPutConfigs}
        inputItemName={InputItemNameEnum.inputArgs}
        form={form}
      />
      {/* 系统提示词 */}
      <ExpandableInputTextarea
        title="系统提示词"
        value={params.systemPrompt || ''}
        onChange={(value: string) =>
          Modified({ ...params, systemPrompt: value })
        }
        onExpand
        // onOptimize
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
      <Form.Item shouldUpdate name={'outputArgs'}>
        <CustomTree
          title={'输出'}
          notShowTitle
          showCheck
          form={form}
          params={form.getFieldValue('outputArgs') || []}
          inputItemName={'outputArgs'}
        />
      </Form.Item>

      <Created
        checkTag={AgentComponentTypeEnum.Plugin}
        spaceId={Number(sessionStorage.getItem('spaceId'))}
        onAdded={onAddedSkill}
        open={open}
        onCancel={() => setOpen(false)}
        hasIds={hasIds}
      />
    </div>
  );
};

// 定义意图识别
const IntentionNode: React.FC<NodeDisposeProps> = ({ form }) => {
  // 添加状态保持稳定key
  const [outputKey] = useState(() => uuidv4());

  const handleChangeNodeConfig = (newNodeConfig: NodeConfig) => {
    console.log(newNodeConfig, 'newNodeConfig');
    form.setFieldsValue({ ...newNodeConfig });
  };

  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <Form.Item noStyle>
        <ModelSelected
          onChange={handleChangeNodeConfig}
          nodeConfig={form.getFieldsValue()}
        />
      </Form.Item>
      {/* 输入参数 */}
      <InputAndOut
        nodeKey={outputKey}
        title="输入"
        fieldConfigs={outPutConfigs}
        inputItemName={InputItemNameEnum.inputArgs}
        form={form}
      />
      {/* 意图匹配 */}
      <FormList
        form={form}
        title={'意图匹配'}
        field="intent"
        hasUuid
        inputItemName={InputItemNameEnum.intentConfigs}
      />
      {/* 补充提示词 */}
      <ExpandableInputTextarea
        title="补充提示词"
        value={form.getFieldValue('systemPrompt') || ''}
        onChange={
          (value: string) => form.setFieldsValue({ systemPrompt: value }) // 直接修改 Form 的值，而不是调用 Modified 函数，因为 Modified 函数是用于修改整个节点的配置，而这里是修改 Form 中的一个字段的值，所以直接修改 Form 的值就可以了，不需要调用 Modified 函数
        }
        onExpand
        placeholder="支持额外的系统提示词，如对意图选项做更详细的例子以增 强用户输出与意图匹配的成功率。"
      />
      {/* 输出 */}
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">输出</div>
              <TreeOutput treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>
    </div>
  );
};

// 定义问答
const QuestionsNode: React.FC<NodeDisposeProps> = ({
  form,
  params,
  Modified,
  updateNode,
}) => {
  // 添加状态保持稳定key
  const [outputKey] = useState(() => uuidv4());
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
  useEffect(() => {
    if (params && params.answerType === null) {
      Modified({ ...params, answerType: 'TEXT' });
    }
  }, [params]);
  return (
    <div className="node-title-style">
      {/* 模型模块 */}
      <ModelSelected onChange={handleChangeNodeConfig} nodeConfig={params} />
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          nodeKey={outputKey}
          title="输入"
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      {/* 提问问题 */}
      <ExpandableInputTextarea
        title="提问问题"
        value={form.getFieldValue('question') || ''}
        onChange={(value: string) =>
          handleChangeNodeConfig({ ...params, question: value })
        }
        onExpand
        placeholder="可使用{{变量名}}的方式引用输入参数中的变量"
      />
      {/* 回答类型 */}
      <Form.Item label="回答类型" name={'answerType'}>
        <Radio.Group>
          <Space direction="vertical">
            <Radio value={'TEXT'}>直接回答</Radio>
            <Radio value={'SELECT'}>选项回答</Radio>
          </Space>
        </Radio.Group>
      </Form.Item>

      {/* 输出参数 */}
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('answerType') === 'TEXT' ? (
            <CustomTree
              title={'输出'}
              form={form}
              params={form.getFieldValue('outputArgs') || []}
              inputItemName={'outputArgs'}
              showCheck
            />
          ) : null
        }
      </Form.Item>

      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('answerType') === 'SELECT' ? (
            <FormList
              title={'设置选项内容'}
              form={form}
              updateNode={changeOptions}
              field="content"
              inputItemName={InputItemNameEnum.options}
              showIndex
              hasUuid
            />
          ) : null
        }
      </Form.Item>
    </div>
  );
};

// 定义http工具
const HttpToolNode: React.FC<NodeDisposeProps> = ({ form, params }) => {
  // 添加状态保持稳定key
  const [outputKey] = useState(() => uuidv4());
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

  useEffect(() => {
    form.setFieldsValue({
      ...params,
      method: params.method || 'GET',
      contentType: params.contentType || 'JSON',
    });
  }, [params]);
  return (
    <div>
      {/* 请求配置 */}
      <Form.Item label="请求方法与路径">
        <div className="dis-sb">
          <Form.Item name="method" noStyle>
            <Select
              style={{ width: '30%', marginRight: '10px' }}
              options={methodOption}
              placeholder="请求方法"
            ></Select>
          </Form.Item>
          <Form.Item name="url" noStyle>
            <Input placeholder="请输入url地址"></Input>
          </Form.Item>
        </div>
      </Form.Item>
      <Form.Item label="请求内容格式" name="contentType">
        <Radio.Group
          className="margin-bottom"
          options={methodOptions}
        ></Radio.Group>
      </Form.Item>
      <Form.Item label="请求超时配置" name="timeout">
        <Input placeholder="请输入超时配置时长"></Input>
      </Form.Item>
      {/* 入参 */}
      <div className="node-item-style has-child-node">
        <p className="node-title-bold-style">入参</p>
        <InputAndOut
          nodeKey={outputKey}
          title="Header"
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.headers}
          form={form}
        />
        <InputAndOut
          nodeKey={outputKey}
          title="Query"
          form={form}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.queries}
        />
        <CustomTree
          title={'body'}
          form={form}
          inputItemName="body"
          isBody
          params={form.getFieldValue('body') || []}
        />
      </div>
      {/* 出参 */}
      <div className="node-item-style">
        <CustomTree
          title={'出参'}
          form={form}
          inputItemName="outputArgs"
          params={form.getFieldValue('outputArgs') || []}
        />
      </div>
    </div>
  );
};

export default { ModelNode, IntentionNode, QuestionsNode, HttpToolNode };
