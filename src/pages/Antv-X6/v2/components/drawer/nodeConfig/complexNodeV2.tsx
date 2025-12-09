/**
 * V2 复杂节点配置组件
 *
 * 包含：LLM节点、意图识别节点、问答节点、HTTP请求节点
 * 完全独立，不依赖 V1
 */

import Created from '@/components/Created';
import ExpandableInputTextarea from '@/components/ExpandTextArea';
import CustomTree from '@/components/FormListItem/NestedForm';
import { ModelSelected } from '@/components/ModelSetting';
import PromptOptimizeModal from '@/components/PromptOptimizeModal';
import { transformToPromptVariables } from '@/components/TiptapVariableInput/utils/variableTransform';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { CREATED_TABS } from '@/constants/common.constants';
import { SKILL_FORM_KEY } from '@/constants/node.constants';
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
import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Empty,
  Form,
  FormInstance,
  Input,
  Radio,
  RadioChangeEvent,
  Select,
  Space,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type {
  InputAndOutConfigV2,
  NodeConfigV2,
  NodePreviousAndArgMapV2,
} from '../../../types';
import {
  FormListV2,
  InputAndOutV2,
  TreeOutputV2,
  outPutConfigsV2,
} from './commonNodeV2';

import './complexNodeV2.less';

// ==================== 类型定义 ====================

export interface NodeDisposePropsV2 {
  form: FormInstance;
  nodeConfig?: NodeConfigV2;
  id: number;
  type: string;
  referenceData?: NodePreviousAndArgMapV2;
}

// ==================== 常量配置 ====================

const REQUEST_METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
];

const REQUEST_CONTENT_TYPE_OPTIONS = [
  {
    label: '无',
    value: HttpContentTypeEnum.OTHER,
    style: { marginTop: 3, marginBottom: 3 },
  },
  {
    label: 'form-data',
    value: HttpContentTypeEnum.FORM_DATA,
    style: { marginTop: 3, marginBottom: 3 },
  },
  {
    label: 'json',
    value: HttpContentTypeEnum.JSON,
    style: { marginTop: 3, marginBottom: 3 },
  },
  {
    label: 'x-www-form-urlencoded',
    value: HttpContentTypeEnum.X_WWW_FORM_URLENCODED,
    style: { marginTop: 3, marginBottom: 3 },
  },
];

// 技能创建的 tabs 配置
const skillCreatedTabs = CREATED_TABS.filter((item) =>
  [
    AgentComponentTypeEnum.Plugin,
    AgentComponentTypeEnum.Workflow,
    AgentComponentTypeEnum.MCP,
  ].includes(item.key),
);

// ==================== 组件实现 ====================

/**
 * LLM 大模型节点配置
 */
export const ModelNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
  id,
  nodeConfig,
  type,
  referenceData,
}) => {
  // 技能弹窗状态
  const [open, setOpen] = useState(false);
  // 提示词优化弹窗状态
  const [showOptimize, setShowOptimize] = useState(false);
  // 处于 loading 状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  // 是否需要提交
  const [needSubmit, setNeedSubmit] = useState(false);

  // 输入变量
  const variables = (
    Form.useWatch(InputItemNameEnum.inputArgs, {
      form,
      preserve: true,
    }) || []
  ).filter(
    (item: InputAndOutConfigV2) => !['', null, undefined].includes(item.name),
  );

  // 技能配置
  const skillComponentConfigs = form.getFieldValue(SKILL_FORM_KEY);

  // 更新添加组件状态
  const updateAddComponents = useCallback(
    (
      configs: CreatedNodeItem[],
      customize: (item: CreatedNodeItem) => AgentAddComponentStatusEnum,
    ) => {
      const theList =
        configs?.map((item: CreatedNodeItem) => {
          return {
            type: item.type as unknown as AgentComponentTypeEnum,
            targetId: Number(item.typeId),
            status: customize(item),
            toolName: item.toolName || '',
          };
        }) || [];
      setAddComponents(theList);
    },
    [],
  );

  // 初始化技能组件状态
  useEffect(() => {
    updateAddComponents(skillComponentConfigs, () => {
      return AgentAddComponentStatusEnum.Added;
    });
  }, [skillComponentConfigs, updateAddComponents]);

  // 新增技能
  const onAddedSkill = useCallback(
    (item: CreatedNodeItem) => {
      const currentConfigs = form.getFieldValue(SKILL_FORM_KEY) || [];
      item.type = item.targetType as unknown as NodeTypeEnum;
      item.typeId = item.targetId;
      form.setFieldValue(SKILL_FORM_KEY, currentConfigs.concat([item]));
      setNeedSubmit(true);
    },
    [form],
  );

  // 移除技能
  const removeItem = useCallback(
    (item: CreatedNodeItem) => {
      const currentConfigs = form.getFieldValue(SKILL_FORM_KEY);
      if (currentConfigs) {
        const newConfigs = currentConfigs.filter(
          (i: CreatedNodeItem) =>
            !(
              i.typeId === item.typeId &&
              (i.toolName || '') === (item.toolName || '')
            ),
        );
        form.setFieldValue(SKILL_FORM_KEY, newConfigs);
      }
    },
    [form],
  );

  // 修改技能参数
  const modifyItem = useCallback(
    (item: CreatedNodeItem) => {
      const currentConfigs = form.getFieldValue(SKILL_FORM_KEY);
      if (currentConfigs) {
        const newConfigs = currentConfigs.map((i: CreatedNodeItem) =>
          i.typeId === item.typeId &&
          (i.toolName || '') === (item.toolName || '')
            ? item
            : i,
        );
        form.setFieldValue(SKILL_FORM_KEY, newConfigs);
      }
    },
    [form],
  );

  // 显示新增技能弹窗
  const showAdd = useCallback(() => {
    setOpen(true);
  }, []);

  // 关闭技能弹窗
  const handleCreatedCancel = useCallback(() => {
    setOpen(false);
    if (needSubmit) {
      setNeedSubmit(false);
    }
  }, [needSubmit]);

  // 提示词优化替换
  const handleOptimizeReplace = useCallback(
    (newValue?: string) => {
      if (!newValue) return;
      let text = newValue;
      if (text.includes('```')) {
        text = text.replace(/```/g, '');
      }
      form.setFieldsValue({ systemPrompt: text || '' });
      setShowOptimize(false);
    },
    [form],
  );

  const formSkillList = form.getFieldValue(SKILL_FORM_KEY);

  return (
    <div className="model-node-style-v2">
      {/* 模型模块 */}
      <ModelSelected form={form} modelConfig={nodeConfig?.modelConfig} />

      {/* 技能模块 */}
      <div className="dis-sb">
        <span className="node-title-style-v2">技能</span>
        <Button
          icon={<PlusOutlined />}
          size="small"
          onClick={showAdd}
          type="text"
        />
      </div>
      <Form.Item shouldUpdate noStyle>
        {() =>
          formSkillList ? (
            <div className="node-item-style-v2">
              <SkillList
                params={formSkillList}
                skillName={SKILL_FORM_KEY}
                variables={variables}
                form={form}
                removeItem={removeItem}
                modifyItem={modifyItem}
              />
            </div>
          ) : (
            <Empty description="暂无技能" />
          )
        }
      </Form.Item>

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

      {/* 系统提示词 */}
      <div className="node-item-style-v2">
        <ExpandableInputTextarea
          title={
            <>
              系统提示词
              <TooltipIcon
                title="为对话提供系统级指导，如设定人设和回复逻辑。"
                icon={<ExclamationCircleOutlined />}
              />
            </>
          }
          inputFieldName="systemPrompt"
          onExpand
          onOptimize
          onOptimizeClick={() => setShowOptimize(true)}
          placeholder="系统提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输入参数中的变量"
          variables={transformToPromptVariables(
            variables,
            referenceData?.argMap as any,
          )}
          skills={skillComponentConfigs}
        />
      </div>

      {/* 用户提示词 */}
      <div className="node-item-style-v2">
        <ExpandableInputTextarea
          title={
            <>
              用户提示词
              <TooltipIcon
                title="向模型提供用户指令，如查询或任何基于文本输入的提问。"
                icon={<ExclamationCircleOutlined />}
              />
            </>
          }
          inputFieldName="userPrompt"
          onExpand
          placeholder="用户提示词，可以使用{{变量名}}、{{变量名.子变量名}}、 {{变量名[数组索引]}}的方式引用输入参数中的变量"
          variables={transformToPromptVariables(
            variables,
            referenceData?.argMap as any,
          )}
          skills={skillComponentConfigs}
        />
      </div>

      {/* 输出参数 */}
      <Form.Item shouldUpdate name="outputArgs">
        <CustomTree
          key={`${type}-${id}-outputArgs`}
          title="输出"
          notShowTitle
          form={form}
          params={(nodeConfig?.outputArgs || []) as any}
          inputItemName="outputArgs"
        />
      </Form.Item>

      {/* 技能选择弹窗 */}
      <Created
        checkTag={AgentComponentTypeEnum.Plugin}
        onAdded={onAddedSkill}
        open={open}
        onCancel={handleCreatedCancel}
        addComponents={addComponents}
        tabs={skillCreatedTabs}
      />

      {/* 提示词优化弹窗 */}
      <PromptOptimizeModal
        title="提示词优化"
        open={showOptimize}
        onCancel={() => setShowOptimize(false)}
        defaultValue={form.getFieldValue('systemPrompt') || ''}
        onReplace={handleOptimizeReplace}
        targetId={id}
        type={PromptOptimizeTypeEnum.WORKFLOW_LLM_NODE}
      />
    </div>
  );
};

/**
 * 意图识别节点配置
 */
export const IntentionNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
  referenceData,
}) => {
  return (
    <div className="model-node-style-v2">
      {/* 模型模块 */}
      <Form.Item noStyle>
        <ModelSelected form={form} />
      </Form.Item>

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

      {/* 意图匹配 */}
      <div className="node-item-style-v2">
        <FormListV2
          title="意图匹配"
          form={form}
          field="intent"
          showIndex
          limitAddLength={26}
          inputItemName={InputItemNameEnum.intentConfigs}
        />
      </div>

      {/* 补充提示词 */}
      <div className="node-item-style-v2">
        <ExpandableInputTextarea
          title="补充提示词"
          inputFieldName="extraPrompt"
          onExpand
          placeholder="支持额外的系统提示词，如对意图选项做更详细的例子以增强用户输出与意图匹配的成功率。"
          variables={transformToPromptVariables(
            (
              Form.useWatch(InputItemNameEnum.inputArgs, {
                form,
                preserve: true,
              }) || []
            ).filter(
              (item: InputAndOutConfigV2) =>
                !['', null, undefined].includes(item.name),
            ),
            referenceData?.argMap as any,
          )}
        />
      </div>

      {/* 输出 */}
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style-v2 margin-bottom">输出</div>
              <TreeOutputV2 treeData={form.getFieldValue('outputArgs')} />
            </>
          )
        }
      </Form.Item>
    </div>
  );
};

/**
 * 问答节点配置
 */
export const QuestionsNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
  nodeConfig,
  type,
  id,
  referenceData,
}) => {
  // 更改问答方式
  const changeType = (val: string) => {
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

    if (val === 'TEXT') {
      options = options?.map((item: any) => ({
        ...item,
        nextNodeIds: [],
      }));
    }

    form.setFieldsValue({
      answerType: val,
      options,
    });
  };

  return (
    <div className="node-title-style-v2">
      {/* 模型模块 */}
      <ModelSelected form={form} />

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

      {/* 提问问题 */}
      <div className="node-item-style-v2">
        <ExpandableInputTextarea
          title="提问问题"
          inputFieldName="question"
          onExpand
          placeholder="可使用{{变量名}}的方式引用输入参数中的变量"
          variables={transformToPromptVariables(
            (
              Form.useWatch(InputItemNameEnum.inputArgs, {
                form,
                preserve: true,
              }) || []
            ).filter(
              (item: InputAndOutConfigV2) =>
                !['', null, undefined].includes(item.name),
            ),
            referenceData?.argMap as any,
          )}
        />
      </div>

      {/* 回答类型 */}
      <div className="node-item-style-v2">
        <Form.Item label="回答类型" name="answerType">
          <Radio.Group
            onChange={(value: RadioChangeEvent) =>
              changeType(value.target.value)
            }
          >
            <Space direction="vertical">
              <Radio value="TEXT">直接回答</Radio>
              <Radio value="SELECT">选项回答</Radio>
            </Space>
          </Radio.Group>
        </Form.Item>
      </div>

      {/* 输出参数 */}
      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('answerType') === 'TEXT' ? (
            <CustomTree
              key={`${type}-${id}-outputArgs`}
              title="输出"
              form={form}
              params={(nodeConfig?.outputArgs as any) || []}
              inputItemName="outputArgs"
              showCheck
            />
          ) : null
        }
      </Form.Item>

      <Form.Item shouldUpdate noStyle>
        {() =>
          form.getFieldValue('answerType') === 'SELECT' ? (
            <FormListV2
              title="设置选项内容"
              form={form}
              field="content"
              inputItemName={InputItemNameEnum.options}
              showIndex
            />
          ) : null
        }
      </Form.Item>
    </div>
  );
};

/**
 * HTTP 请求节点配置
 */
export const HttpToolNodeV2: React.FC<NodeDisposePropsV2> = ({
  form,
  nodeConfig,
  type,
  id,
  referenceData,
}) => {
  const bodyParams = nodeConfig?.body || [];
  const outputParams = nodeConfig?.outputArgs || [];

  return (
    <div>
      {/* 请求配置 */}
      <div className="node-item-style-v2">
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

      <div className="node-item-style-v2">
        <Form.Item name="contentType" label="请求内容格式">
          <Radio.Group
            className="margin-bottom"
            options={REQUEST_CONTENT_TYPE_OPTIONS}
          />
        </Form.Item>
      </div>

      <div className="node-item-style-v2">
        <Form.Item label="请求超时配置" name="timeout">
          <Input placeholder="请输入超时配置时长" addonAfter="s" />
        </Form.Item>
      </div>

      {/* 入参 */}
      <div className="has-child-node-v2">
        <p className="node-title-bold-style-v2">入参</p>
        <div className="node-item-style-v2">
          <InputAndOutV2
            title="Header"
            fieldConfigs={outPutConfigsV2}
            inputItemName={InputItemNameEnum.headers}
            form={form}
            referenceData={referenceData}
          />
        </div>
        <div className="node-item-style-v2">
          <InputAndOutV2
            title="Query"
            form={form}
            fieldConfigs={outPutConfigsV2}
            inputItemName={InputItemNameEnum.queries}
            referenceData={referenceData}
          />
        </div>
        <div className="node-item-style-v2">
          <CustomTree
            key={`${type}-${id}-body`}
            title="Body"
            form={form}
            inputItemName="body"
            isBody
            params={bodyParams as any}
          />
        </div>
      </div>

      {/* 出参 */}
      <Form.Item name="outputArgs">
        <CustomTree
          key={`${type}-${id}-outputArgs`}
          title="出参"
          form={form}
          inputItemName="outputArgs"
          params={outputParams as any}
        />
      </Form.Item>
    </div>
  );
};

export default {
  ModelNodeV2,
  IntentionNodeV2,
  QuestionsNodeV2,
  HttpToolNodeV2,
};
