import Created from '@/components/Created';
import ExpandableInputTextarea from '@/components/ExpandTextArea';
import CustomTree from '@/components/FormListItem/NestedForm';
import { ModelSelected } from '@/components/ModelSetting';
import PromptOptimizeModal from '@/components/PromptOptimizeModal';
import { CREATED_TABS } from '@/constants/common.constants';
import { SkillList } from '@/pages/Antv-X6/components/NewSkill';
import {
  AgentAddComponentStatusEnum,
  AgentComponentTypeEnum,
} from '@/types/enums/agent';
import { HttpContentTypeEnum, NodeTypeEnum } from '@/types/enums/common';
import { InputItemNameEnum } from '@/types/enums/node';
import { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import { PromptOptimizeTypeEnum } from '@/types/interfaces/assistant';
import { CreatedNodeItem } from '@/types/interfaces/common';
import { InputAndOutConfig, QANodeOption } from '@/types/interfaces/node';
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
import React, { useEffect, useState } from 'react';
import { useModel } from 'umi';
import { v4 as uuidv4 } from 'uuid';
import '../index.less';
import { outPutConfigs } from '../params';
import { FormList, InputAndOut, TreeOutput } from './commonNode';
// 请求方法的选项
const REQUEST_METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
];

// 各种方法的options
const REQUEST_CONTENT_TYPE_OPTIONS = [
  { label: 'json', value: HttpContentTypeEnum.JSON },
  { label: 'form-data', value: HttpContentTypeEnum.FORM_DATA },
  {
    label: 'x-www-form-urlencoded',
    value: HttpContentTypeEnum.X_WWW_FORM_URLENCODED,
  },
  { label: '无', value: HttpContentTypeEnum.OTHER },
];
const skillCreatedTabs = CREATED_TABS.filter((item) =>
  [
    AgentComponentTypeEnum.Plugin,
    AgentComponentTypeEnum.Workflow,
    AgentComponentTypeEnum.MCP,
  ].includes(item.key),
);

const skillFormKey = 'skillComponentConfigs';
// 定义大模型节点
const ModelNode: React.FC<NodeDisposeProps> = ({ form, id, nodeConfig }) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  // 打开关闭优化
  const [show, setShow] = useState(false);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);

  const { setSkillChange, setIsModified } = useModel('workflow');
  // 新增技能
  const onAddedSkill = (item: CreatedNodeItem) => {
    setIsModified(true);
    const skillComponentConfigs = form.getFieldValue(skillFormKey) || [];
    item.type = item.targetType as unknown as NodeTypeEnum; // TODO 这里需要优化
    item.typeId = item.targetId;
    form.setFieldValue(skillFormKey, skillComponentConfigs.concat([item]));
    setSkillChange(true);
    form.submit();
    setOpen(false);
  };

  // 移出技能
  const removeItem = (item: CreatedNodeItem) => {
    const skillComponentConfigs = form.getFieldValue(skillFormKey);
    if (skillComponentConfigs) {
      const newSkillComponentConfigs = skillComponentConfigs.filter(
        (i: CreatedNodeItem) =>
          !(
            i.typeId === item.typeId &&
            (i.toolName || '') === (item.toolName || '')
          ),
      );
      form.setFieldValue(skillFormKey, newSkillComponentConfigs);
      setIsModified(true);
    }
  };

  // 修改技能参数
  const modifyItem = (item: CreatedNodeItem) => {
    setIsModified(true);
    const skillComponentConfigs = form.getFieldValue(skillFormKey);
    if (skillComponentConfigs) {
      const newSkillComponentConfigs = skillComponentConfigs.map(
        (i: CreatedNodeItem) =>
          i.typeId === item.typeId &&
          (i.toolName || '') === (item.toolName || '')
            ? item
            : i,
      );
      form.setFieldValue(skillFormKey, newSkillComponentConfigs);
    }
  };

  //   显示新增技能
  const showAdd = () => {
    setOpen(true);
  };

  const skillComponentConfigs = Form.useWatch(skillFormKey, {
    form,
    preserve: true,
  });

  useEffect(() => {
    const _arr =
      skillComponentConfigs?.map((item: CreatedNodeItem) => {
        return {
          type: item.type,
          targetId: item.typeId,
          status: AgentAddComponentStatusEnum.Added,
          toolName: item.toolName || '',
        };
      }) || [];
    setAddComponents(_arr);
  }, [skillComponentConfigs]);
  const variables = (
    Form.useWatch(InputItemNameEnum.inputArgs, {
      form,
      preserve: true,
    }) || []
  ).filter(
    (item: InputAndOutConfig) => !['', null, undefined].includes(item.name),
  );
  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <ModelSelected form={form} modelConfig={nodeConfig?.modelConfig} />
      {/* 技能模块 */}
      <div className="dis-sb margin-bottom ">
        <span className="node-title-style">技能</span>
        <Button
          icon={<PlusOutlined />}
          size="small"
          onClick={showAdd}
          type="text"
        ></Button>
      </div>
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue(skillFormKey) ? (
            <div className="node-item-style">
              <SkillList
                params={form.getFieldValue(skillFormKey)}
                skillName={skillFormKey}
                variables={variables}
                form={form}
                removeItem={removeItem}
                modifyItem={modifyItem}
              />
            </div>
          ) : (
            <Empty />
          )
        }
      </Form.Item>
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      {/* 系统提示词 */}
      <div className="node-item-style">
        <ExpandableInputTextarea
          title="系统提示词"
          inputFieldName="systemPrompt"
          onExpand
          onOptimize
          onOptimizeClick={() => setShow(true)}
          placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输入参数中的变量"
        />
      </div>
      {/* 用户提示词 */}
      <div className="node-item-style">
        <ExpandableInputTextarea
          title="用户提示词"
          inputFieldName="userPrompt"
          onExpand
          // onOptimize
          // onOptimizeClick={() => setShow(true)}
          placeholder="用户提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输入参数中的变量"
        />
      </div>
      {/* 输出参数 */}
      <Form.Item shouldUpdate name={'outputArgs'}>
        <CustomTree
          title={'输出'}
          notShowTitle
          form={form}
          params={nodeConfig?.outputArgs || []}
          inputItemName={'outputArgs'}
        />
      </Form.Item>
      <Created
        checkTag={AgentComponentTypeEnum.Plugin}
        onAdded={onAddedSkill}
        open={open}
        onCancel={() => setOpen(false)}
        addComponents={addComponents}
        tabs={skillCreatedTabs}
      />
      <PromptOptimizeModal
        title="提示词优化"
        open={show}
        onCancel={() => {
          setShow(false);
        }}
        defaultValue={form.getFieldValue('systemPrompt') || ''}
        onReplace={(newValue?: string) => {
          if (!newValue) return;
          let text = newValue;
          if (text.includes('```')) {
            text = text.replace(/```/g, '');
          }
          // 只取第二个SQL语句
          form.setFieldsValue({ systemPrompt: text || '' });
          setIsModified(true);
          setShow(false);
        }}
        targetId={id}
        type={PromptOptimizeTypeEnum.WORKFLOW_LLM_NODE}
      />
    </div>
  );
};

// 定义意图识别
const IntentionNode: React.FC<NodeDisposeProps> = ({ form }) => {
  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <Form.Item noStyle>
        <ModelSelected form={form} />
      </Form.Item>
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      {/* 意图匹配 */}
      <div className="node-item-style">
        <FormList
          title={'意图匹配'}
          form={form}
          field="intent"
          hasUuid
          showIndex
          limitAddLength={26}
          inputItemName={InputItemNameEnum.intentConfigs}
        />
      </div>
      {/* 补充提示词 */}
      <div className="node-item-style">
        <ExpandableInputTextarea
          title="补充提示词"
          inputFieldName="systemPrompt"
          onExpand
          placeholder="支持额外的系统提示词，如对意图选项做更详细的例子以增 强用户输出与意图匹配的成功率。"
        />
      </div>
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
const QuestionsNode: React.FC<NodeDisposeProps> = ({ form, nodeConfig }) => {
  // 更改问答方式
  const changeType = (val: string) => {
    // 首次选中
    let options = form.getFieldValue('options');
    if (val === 'SELECT' && (!options || !options.length)) {
      options = [
        {
          uuid: uuidv4(),
          index: 0,
          content: '',
          nextNodeIds: [],
        },
        {
          uuid: uuidv4(),
          index: 1,
          content: '此选项用户不可见，用户回复无关内容时走此分支',
          nextNodeIds: [],
        },
      ];
    }

    console.log('bb', val, form.getFieldValue('answerType'));
    if (val === 'TEXT') {
      options = options?.map((item: QANodeOption) => ({
        ...item,
        nextNodeIds: [],
      }));
    }

    form.setFieldsValue({
      answerType: val,
      options,
    });

    form.submit();
  };

  return (
    <div className="node-title-style">
      {/* 模型模块 */}
      <ModelSelected form={form} />
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title="输入"
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      {/* 提问问题 */}
      <div className="node-item-style">
        <ExpandableInputTextarea
          title="提问问题"
          inputFieldName="question"
          onExpand
          placeholder="可使用{{变量名}}的方式引用输入参数中的变量"
        />
      </div>
      {/* 回答类型 */}
      <div className="node-item-style">
        <Form.Item label="回答类型" name={'answerType'}>
          <Radio.Group
            onChange={(value: RadioChangeEvent) =>
              changeType(value.target.value)
            }
          >
            <Space direction="vertical">
              <Radio value={'TEXT'}>直接回答</Radio>
              <Radio value={'SELECT'}>选项回答</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 输出参数 */}
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('answerType') === 'TEXT' ? (
            <CustomTree
              title={'输出'}
              form={form}
              params={nodeConfig?.outputArgs || []}
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
              field="content"
              inputItemName={InputItemNameEnum.options}
              hasUuid
              showIndex
            />
          ) : null
        }
      </Form.Item>
    </div>
  );
};

// 定义http工具

const HttpToolNode: React.FC<NodeDisposeProps> = ({ form, nodeConfig }) => {
  const bodyParams = nodeConfig?.body || [];
  const outputParams = nodeConfig?.outputArgs || [];
  return (
    <div>
      {/* 请求配置 */}
      <div className="node-item-style">
        <Form.Item label="请求方法与路径">
          <div className="dis-sb">
            <Form.Item name="method" noStyle>
              <Select
                style={{ width: '30%', marginRight: '10px' }}
                options={REQUEST_METHOD_OPTIONS}
                placeholder="请求方法"
              />
            </Form.Item>
            <Form.Item name="url" noStyle>
              <Input placeholder="请输入url地址" />
            </Form.Item>
          </div>
        </Form.Item>
      </div>
      <div className="node-item-style">
        <Form.Item name="contentType" label="请求内容格式">
          <Radio.Group
            className="margin-bottom"
            options={REQUEST_CONTENT_TYPE_OPTIONS}
          />
        </Form.Item>
      </div>
      <div className="node-item-style">
        <Form.Item label="请求超时配置" name="timeout">
          <Input placeholder="请输入超时配置时长"></Input>
        </Form.Item>
      </div>
      {/* 入参 */}
      <div className="has-child-node">
        <p className="node-title-bold-style">入参</p>
        <div className="node-item-style">
          <InputAndOut
            title="Header"
            fieldConfigs={outPutConfigs}
            inputItemName={InputItemNameEnum.headers}
            form={form}
          />
        </div>
        <div className="node-item-style">
          <InputAndOut
            title="Query"
            form={form}
            fieldConfigs={outPutConfigs}
            inputItemName={InputItemNameEnum.queries}
          />
        </div>
        <div className="node-item-style">
          <CustomTree
            title={'Body'}
            form={form}
            inputItemName="body"
            isBody
            params={bodyParams}
          />
        </div>
      </div>
      {/* 出参 */}
      <Form.Item name={'outputArgs'}>
        <CustomTree
          title={'出参'}
          form={form}
          inputItemName="outputArgs"
          params={outputParams}
        />
      </Form.Item>
    </div>
  );
};

export default { ModelNode, IntentionNode, QuestionsNode, HttpToolNode };
