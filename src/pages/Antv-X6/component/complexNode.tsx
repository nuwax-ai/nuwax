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
import { t } from '@/services/i18nRuntime';
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
import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
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
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  {
    label: t('PC.Pages.AntvX6ComplexNode.none'),
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
const skillCreatedTabs = CREATED_TABS.filter((item) =>
  [
    AgentComponentTypeEnum.Plugin,
    AgentComponentTypeEnum.Workflow,
    AgentComponentTypeEnum.MCP,
  ].includes(item.key),
);

// 定义大模型节点
const ModelNode: React.FC<NodeDisposeProps> = ({
  form,
  id,
  nodeConfig,
  type,
}) => {
  // 打开、关闭弹窗
  const [open, setOpen] = useState(false);
  // 打开关闭优化
  const [show, setShow] = useState(false);
  // 处于loading状态的组件列表
  const [addComponents, setAddComponents] = useState<
    AgentAddComponentStatusInfo[]
  >([]);
  const [needSubmit, setNeedSubmit] = useState(false);
  const skillLoadingRef = useRef<NodeJS.Timeout>();

  const { setSkillChange, setIsModified, skillChange, referenceList } =
    useModel('workflow');
  const [skillLoading, setSkillLoading] = useState(false);
  const updateAddComponents = (
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
  };

  // 新增技能
  const onAddedSkill = (item: CreatedNodeItem) => {
    const skillComponentConfigs = form.getFieldValue(SKILL_FORM_KEY) || [];
    item.type = item.targetType as unknown as NodeTypeEnum; // TODO 这里需要优化
    item.typeId = item.targetId;
    form.setFieldValue(SKILL_FORM_KEY, skillComponentConfigs.concat([item]));
    setIsModified(true);
    form.submit();
    setNeedSubmit(true);
    // setOpen(false);
  };

  useEffect(() => {
    //如果300ms内的变化不做显示loading
    if (skillChange) {
      skillLoadingRef.current = setTimeout(() => {
        setSkillLoading(true);
      }, 300);
    } else {
      clearTimeout(skillLoadingRef.current);
      setSkillLoading(false);
    }
    return () => {
      clearTimeout(skillLoadingRef.current);
    };
  }, [skillChange]);

  // 移出技能
  const removeItem = (item: CreatedNodeItem) => {
    const skillComponentConfigs = form.getFieldValue(SKILL_FORM_KEY);
    if (skillComponentConfigs) {
      const newSkillComponentConfigs = skillComponentConfigs.filter(
        (i: CreatedNodeItem) =>
          !(
            i.typeId === item.typeId &&
            (i.toolName || '') === (item.toolName || '')
          ),
      );
      form.setFieldValue(SKILL_FORM_KEY, newSkillComponentConfigs);
      setIsModified(true);
      setSkillChange(true);
    }
  };

  // 修改技能参数
  const modifyItem = (item: CreatedNodeItem) => {
    const skillComponentConfigs = form.getFieldValue(SKILL_FORM_KEY);
    if (skillComponentConfigs) {
      const newSkillComponentConfigs = skillComponentConfigs.map(
        (i: CreatedNodeItem) =>
          i.typeId === item.typeId &&
          (i.toolName || '') === (item.toolName || '')
            ? item
            : i,
      );
      form.setFieldValue(SKILL_FORM_KEY, newSkillComponentConfigs);
      setIsModified(true);
      setSkillChange(true);
    }
  };

  //   显示新增技能
  const showAdd = () => {
    setOpen(true);
  };

  const skillComponentConfigs = form.getFieldValue(SKILL_FORM_KEY);

  useEffect(() => {
    updateAddComponents(skillComponentConfigs, () => {
      return AgentAddComponentStatusEnum.Added;
    });
  }, [skillComponentConfigs]);
  const variables = (
    Form.useWatch(InputItemNameEnum.inputArgs, {
      form,
      preserve: true,
    }) || []
  ).filter(
    (item: InputAndOutConfig) => !['', null, undefined].includes(item.name),
  );

  const handleCreatedCancel = useCallback(() => {
    setOpen(false);
    if (needSubmit) {
      setNeedSubmit(false);
      setSkillChange(true);
      setIsModified(true);
      // 一起提交表单
      form.submit();
    }
  }, [needSubmit, form, setSkillChange, setNeedSubmit, setOpen]);

  const formSkillList = form.getFieldValue(SKILL_FORM_KEY);
  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <ModelSelected form={form} modelConfig={nodeConfig?.modelConfig} />
      {/* 技能模块 */}
      <div className="dis-sb">
        <span className="node-title-style">
          {t('PC.Pages.AntvX6ComplexNode.skills')}
        </span>
        <Button
          icon={<PlusOutlined />}
          size="small"
          onClick={showAdd}
          type="text"
        ></Button>
      </div>
      <Form.Item shouldUpdate noStyle>
        {() =>
          formSkillList ? (
            <div className="node-item-style">
              <SkillList
                params={formSkillList}
                skillName={SKILL_FORM_KEY}
                variables={variables}
                form={form}
                removeItem={removeItem}
                modifyItem={modifyItem}
                loading={skillLoading}
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
          title={t('PC.Pages.AntvX6ComplexNode.input')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      {/* 系统提示词 */}
      <div className="node-item-style">
        <ExpandableInputTextarea
          title={
            <>
              系统提示词
              <TooltipIcon
                title={t('PC.Pages.AntvX6ComplexNode.systemPromptTooltip')}
                icon={<ExclamationCircleOutlined />}
              ></TooltipIcon>
            </>
          }
          inputFieldName="systemPrompt"
          onExpand
          onOptimize
          onOptimizeClick={() => setShow(true)}
          placeholder={t('PC.Pages.AntvX6ComplexNode.systemPromptPlaceholder')}
          variables={transformToPromptVariables(
            variables,
            referenceList?.argMap,
          )}
          skills={skillComponentConfigs}
        />
      </div>
      {/* 用户提示词 */}
      <div className="node-item-style">
        <ExpandableInputTextarea
          title={
            <>
              用户提示词
              <TooltipIcon
                title={t('PC.Pages.AntvX6ComplexNode.userPromptTooltip')}
                icon={<ExclamationCircleOutlined />}
              ></TooltipIcon>
            </>
          }
          inputFieldName="userPrompt"
          onExpand
          // onOptimize
          // onOptimizeClick={() => setShow(true)}
          placeholder={t('PC.Pages.AntvX6ComplexNode.userPromptPlaceholder')}
          variables={transformToPromptVariables(
            variables,
            referenceList?.argMap,
          )}
          skills={skillComponentConfigs}
        />
      </div>
      {/* 输出参数 */}
      <Form.Item shouldUpdate name={'outputArgs'}>
        <CustomTree
          key={`${type}-${id}-outputArgs`}
          title={t('PC.Pages.AntvX6ComplexNode.output')}
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
        addSkillLoading={skillLoading}
        onCancel={handleCreatedCancel}
        addComponents={addComponents}
        tabs={skillCreatedTabs}
      />
      <PromptOptimizeModal
        title={t('PC.Pages.AntvX6ComplexNode.promptOptimizeTitle')}
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
  const { referenceList } = useModel('workflow');
  return (
    <div className="model-node-style">
      {/* 模型模块 */}
      <Form.Item noStyle>
        <ModelSelected form={form} />
      </Form.Item>
      {/* 输入参数 */}
      <div className="node-item-style">
        <InputAndOut
          title={t('PC.Pages.AntvX6ComplexNode.input')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      {/* 意图匹配 */}
      <div className="node-item-style">
        <FormList
          title={t('PC.Pages.AntvX6ComplexNode.intentMatchTitle')}
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
          title={t('PC.Pages.AntvX6ComplexNode.extraPromptTitle')}
          // inputFieldName="systemPrompt"
          inputFieldName="extraPrompt"
          onExpand
          placeholder={t('PC.Pages.AntvX6ComplexNode.extraPromptPlaceholder')}
          variables={transformToPromptVariables(
            (
              Form.useWatch(InputItemNameEnum.inputArgs, {
                form,
                preserve: true,
              }) || []
            ).filter(
              (item: InputAndOutConfig) =>
                !['', null, undefined].includes(item.name),
            ),
            referenceList?.argMap,
          )}
        />
      </div>
      {/* 输出 */}
      <Form.Item shouldUpdate>
        {() =>
          form.getFieldValue('outputArgs') && (
            <>
              <div className="node-title-style margin-bottom">
                {t('PC.Pages.AntvX6ComplexNode.output')}
              </div>
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
  nodeConfig,
  type,
  id,
}) => {
  const { referenceList } = useModel('workflow');
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
          content: t('PC.Pages.AntvX6CommonNode.otherBranchHint'),
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
          title={t('PC.Pages.AntvX6ComplexNode.input')}
          fieldConfigs={outPutConfigs}
          inputItemName={InputItemNameEnum.inputArgs}
          form={form}
        />
      </div>
      {/* 提问问题 */}
      <div className="node-item-style">
        <ExpandableInputTextarea
          title={t('PC.Pages.AntvX6ComplexNode.questionTitle')}
          inputFieldName="question"
          onExpand
          placeholder={t('PC.Pages.AntvX6ComplexNode.questionPlaceholder')}
          variables={transformToPromptVariables(
            (
              Form.useWatch(InputItemNameEnum.inputArgs, {
                form,
                preserve: true,
              }) || []
            ).filter(
              (item: InputAndOutConfig) =>
                !['', null, undefined].includes(item.name),
            ),
            referenceList?.argMap,
          )}
        />
      </div>
      {/* 回答类型 */}
      <div className="node-item-style">
        <Form.Item
          label={t('PC.Pages.AntvX6ComplexNode.answerTypeLabel')}
          name={'answerType'}
        >
          <Radio.Group
            onChange={(value: RadioChangeEvent) =>
              changeType(value.target.value)
            }
          >
            <Space direction="vertical">
              <Radio value={'TEXT'}>
                {t('PC.Pages.AntvX6ComplexNode.answerTypeText')}
              </Radio>
              <Radio value={'SELECT'}>
                {t('PC.Pages.AntvX6ComplexNode.answerTypeSelect')}
              </Radio>
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
              title={t('PC.Pages.AntvX6ComplexNode.output')}
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
              title={t('PC.Pages.AntvX6ComplexNode.optionContentTitle')}
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

const HttpToolNode: React.FC<NodeDisposeProps> = ({
  form,
  nodeConfig,
  type,
  id,
}) => {
  const bodyParams = nodeConfig?.body || [];
  const outputParams = nodeConfig?.outputArgs || [];
  return (
    <div>
      {/* 请求配置 */}
      <div className="node-item-style">
        <Form.Item label={t('PC.Pages.AntvX6ComplexNode.requestMethodAndPath')}>
          <div className="dis-sb">
            <Form.Item name="method" noStyle>
              <Select
                style={{ width: '30%', marginRight: '10px' }}
                options={REQUEST_METHOD_OPTIONS}
                placeholder={t(
                  'PC.Pages.AntvX6ComplexNode.requestMethodPlaceholder',
                )}
              />
            </Form.Item>
            <Form.Item name="url" noStyle>
              <Input
                placeholder={t('PC.Pages.AntvX6ComplexNode.urlPlaceholder')}
              />
            </Form.Item>
          </div>
        </Form.Item>
      </div>
      <div className="node-item-style">
        <Form.Item
          name="contentType"
          label={t('PC.Pages.AntvX6ComplexNode.requestContentTypeLabel')}
        >
          <Radio.Group
            className="margin-bottom"
            options={REQUEST_CONTENT_TYPE_OPTIONS}
          />
        </Form.Item>
      </div>
      <div className="node-item-style">
        <Form.Item
          label={t('PC.Pages.AntvX6ComplexNode.requestTimeoutLabel')}
          name="timeout"
        >
          <Input
            placeholder={t(
              'PC.Pages.AntvX6ComplexNode.requestTimeoutPlaceholder',
            )}
            addonAfter="s"
          ></Input>
        </Form.Item>
      </div>
      {/* 入参 */}
      <div className="has-child-node">
        <p className="node-title-bold-style">
          {t('PC.Pages.AntvX6ComplexNode.inputParams')}
        </p>
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
            key={`${type}-${id}-body`}
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
          key={`${type}-${id}-outputArgs`}
          title={t('PC.Pages.AntvX6ComplexNode.outputParams')}
          form={form}
          inputItemName="outputArgs"
          params={outputParams}
        />
      </Form.Item>
    </div>
  );
};

export default { ModelNode, IntentionNode, QuestionsNode, HttpToolNode };
