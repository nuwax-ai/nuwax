import CustomFormModal from '@/components/CustomFormModal';
import LabelStar from '@/components/LabelStar';
import { t } from '@/services/i18nRuntime';
import { apiAddTimedTask } from '@/services/library';
import { apiSystemTaskUpdate } from '@/services/systemManage';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input, message, Switch } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import TimedPeriodSelector from './components/TimedPeriodSelector';
import styles from './index.less';

import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiPublishedAgentInfo } from '@/services/agentDev';
import { apiPublishedWorkflowInfo } from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { BindConfigWithSub } from '@/types/interfaces/common';
import { TaskInfo } from '@/types/interfaces/library';
import { McpConfigComponentInfo } from '@/types/interfaces/mcp';
import { InputAndOutConfig } from '@/types/interfaces/node';
import ParameterConfig from './components/ParameterConfig';
import SelectTargetFormItem from './components/SelectTargetFormItem';
const cx = classNames.bind(styles);

export interface CreateTimedTaskProps {
  spaceId?: number;
  info?: TaskInfo | null;
  mode?: CreateUpdateModeEnum;
  open: boolean;
  onCancel?: () => void;
  onConfirm?: () => void;
}
/**
 * 创建定时任务弹窗
 */
const CreateTimedTask: React.FC<CreateTimedTaskProps> = ({
  spaceId,
  info,
  mode = CreateUpdateModeEnum.Create,
  open,
  onCancel = () => {},
  onConfirm = () => {},
}) => {
  const [form] = Form.useForm();
  // 监听 variables 字段变化，用于条件显示参数配置
  const variables = Form.useWatch('variables', form);
  const taskTarget = Form.useWatch('taskTarget', form);

  // 加载中
  const [loading, setLoading] = useState<boolean>(false);

  // 新增定时任务
  const run = async (data: any) => {
    try {
      setLoading(true);
      const resp = await apiAddTimedTask(data);
      if (resp?.code === SUCCESS_CODE) {
        message.success(t('PC.Pages.SystemTaskCreateTimedTask.createSuccess'));
        onCancel?.();
        onConfirm?.();
      }
    } finally {
      setLoading(false);
    }
  };

  // 更新定时任务
  const runUpdate = async (data: any) => {
    try {
      setLoading(true);
      const resp = await apiSystemTaskUpdate(data);
      if (resp?.code === SUCCESS_CODE) {
        message.success(t('PC.Pages.SystemTaskCreateTimedTask.updateSuccess'));
        onCancel?.();
        onConfirm?.();
      }
    } finally {
      setLoading(false);
    }
  };

  // 获取参数配置
  const getParameterConfig = (values: any) => {
    const { variables } = values;
    if (variables && Array.isArray(variables) && variables.length > 0) {
      const obj: any = {};
      variables.forEach((item: InputAndOutConfig) => {
        if (item.dataType === 'Object') {
          obj[item.name] = JSON.parse(values[item.name] || '{}');
        } else if (item.dataType === 'Array_String') {
          obj[item.name] = JSON.parse(values[item.name] || '[]');
        } else if (
          item.dataType &&
          ['File_Image', 'File_Default'].includes(item.dataType)
        ) {
          obj[item.name] = values[item.name]?.url || '';
        } else {
          obj[item.name] = values[item.name] || '';
        }
      });
      return obj;
    } else {
      return {};
    }
  };

  const onFinish: FormProps<{
    name: string;
    description: string;
  }>['onFinish'] = (values: any) => {
    const {
      taskTarget: { targetId, type: targetType },
      message: messageText,
      taskName,
      cron,
      lockTime,
      keepConversation,
    } = values;

    const isSpecificTime = cron === 'SpecificTime';

    // 最终校验：指定时间不能早于当前时间
    if (isSpecificTime && lockTime && dayjs(lockTime).isBefore(dayjs())) {
      message.warning(
        t('PC.Pages.SystemTaskCreateTimedTask.specificTimeMustBeFuture'),
      );
      return;
    }

    // 基础数据
    let data: any = {
      targetType,
      targetId,
      taskName,
      cron: isSpecificTime ? null : cron,
      lockTime: isSpecificTime ? lockTime?.valueOf() : null,
      maxExecTimes: isSpecificTime ? 1 : null,
      keepConversation: keepConversation ? 1 : 0,
    };

    if (spaceId !== undefined) {
      data.spaceId = spaceId;
    }

    // 获取参数配置
    const params = getParameterConfig(values);

    // 智能体
    if (targetType === AgentComponentTypeEnum.Agent) {
      data = {
        ...data,
        params: { message: messageText, variables: params },
      };
    }

    // 工作流
    if (targetType === AgentComponentTypeEnum.Workflow) {
      data = { ...data, params };
    }

    // 创建定时任务
    if (mode === CreateUpdateModeEnum.Create) {
      run(data);
    } else {
      runUpdate({ ...data, id: info?.id });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 获取智能体或工作流入参配置
  const getTargetConfig = async (value: McpConfigComponentInfo | null) => {
    // 重置variables字段 防止表单校验不通过
    variables?.forEach((item: InputAndOutConfig) => {
      form.resetFields([item.name]);
    });

    if (!value) {
      form.setFieldsValue({ variables: [] });
      return;
    }

    switch (value.type) {
      case AgentComponentTypeEnum.Workflow: {
        const {
          data: { inputArgs },
        } = await apiPublishedWorkflowInfo(Number(value.targetId));
        form.setFieldsValue({ variables: inputArgs });
        break;
      }
      case AgentComponentTypeEnum.Agent: {
        const {
          data: { variables },
        } = await apiPublishedAgentInfo(Number(value.targetId));
        form.setFieldsValue({ variables: variables });
        break;
      }
    }
  };

  const handleChangeTarget = (value: McpConfigComponentInfo | null) => {
    getTargetConfig(value);
  };

  // 更新定时任务
  const updateTaskInfo = async (info: TaskInfo) => {
    const { taskName, targetType, targetId, params } = info;
    let result: any = null;
    let message: string = '';
    let keepConversation: string = '';
    let paramsVariables: Record<string, any> = {};
    if (info.targetType === AgentComponentTypeEnum.Agent) {
      message = params.message;
      keepConversation = params.keepConversation;
      paramsVariables = params.variables;
      // 查询智能体信息
      const {
        data: { name, description, variables, icon },
      } = await apiPublishedAgentInfo(Number(targetId));
      result = {
        name,
        description,
        variables,
        icon,
      };
    }

    if (info.targetType === AgentComponentTypeEnum.Workflow) {
      paramsVariables = params;
      // 查询工作流入参配置
      const {
        data: { name, description, inputArgs, icon },
      } = await apiPublishedWorkflowInfo(Number(targetId));
      result = {
        name,
        description,
        variables: inputArgs,
        icon,
      };
    }
    if (!result) {
      return;
    }
    const { name, description, variables, icon } = result;
    // 初始化参数对象
    const paramsObj = variables.reduce((acc: any, item: BindConfigWithSub) => {
      if (item.dataType === 'Object') {
        acc[item.name] = JSON.stringify(paramsVariables[item.name] || '{}');
      } else if (item.dataType === 'Array_String') {
        acc[item.name] = JSON.stringify(paramsVariables[item.name] || '[]');
      } else if (
        item.dataType &&
        ['File_Image', 'File_Default'].includes(item.dataType)
      ) {
        acc[item.name] = paramsVariables[item.name] || '';
      } else {
        acc[item.name] = paramsVariables[item.name] || '';
      }
      return acc;
    }, {});

    // 更新回显任务信息表单值
    form.setFieldsValue({
      taskName,
      taskTarget: {
        name: name,
        icon: icon,
        description: description,
        type: targetType,
        targetId: targetId,
        targetConfig: '',
      },
      variables: variables, // 工作流入参配置
      ...paramsObj, // 初始化参数对象
      ...(info.targetType === AgentComponentTypeEnum.Agent
        ? {
            message,
            keepConversation: keepConversation ? true : false,
          }
        : {}),
      // 处理定时模式回显
      cron: info.maxExecTimes === 1 ? 'SpecificTime' : info.cron,
      lockTime:
        info.maxExecTimes === 1 && info.lockTime ? dayjs(info.lockTime) : null,
    });
  };

  useEffect(() => {
    // 更新定时任务
    if (open && mode === CreateUpdateModeEnum.Update && info) {
      updateTaskInfo(info);
    }
  }, [open, mode, info]);

  return (
    <CustomFormModal
      loading={loading}
      form={form}
      title={
        mode === CreateUpdateModeEnum.Create
          ? t('PC.Pages.SystemTaskCreateTimedTask.createTitle')
          : t('PC.Pages.SystemTaskCreateTimedTask.updateTitle')
      }
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
      }}
      open={open}
      onCancel={onCancel}
      onConfirm={handlerSubmit}
    >
      <Form
        form={form}
        preserve={false}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
        style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}
        initialValues={{
          keepConversation: false,
        }}
      >
        <Form.Item
          name="cron"
          label={
            <LabelStar
              label={t('PC.Pages.SystemTaskCreateTimedTask.timedPeriod')}
            />
          }
        >
          <TimedPeriodSelector />
        </Form.Item>

        <Form.Item
          name="taskName"
          label={t('PC.Pages.SystemTaskCreateTimedTask.taskName')}
          rules={[
            {
              required: true,
              message: t('PC.Pages.SystemTaskCreateTimedTask.enterTaskName'),
            },
          ]}
        >
          <Input
            placeholder={t('PC.Pages.SystemTaskCreateTimedTask.enterTaskName')}
            showCount
            maxLength={100}
          />
        </Form.Item>

        {/* 任务对象 自定义 Form.Item */}
        <SelectTargetFormItem
          form={form}
          name="taskTarget"
          label={t('PC.Pages.SystemTaskCreateTimedTask.taskTarget')}
          mode={mode}
          onChange={handleChangeTarget}
        />

        {/* 只有智能体有任务内容 */}
        {taskTarget?.type === AgentComponentTypeEnum.Agent && (
          <>
            <Form.Item
              name="keepConversation"
              label={t('PC.Pages.SystemTaskCreateTimedTask.keepConversation')}
              tooltip={t(
                'PC.Pages.SystemTaskCreateTimedTask.keepConversationTooltip',
              )}
              rules={[
                {
                  required: true,
                  message: t(
                    'PC.Pages.SystemTaskCreateTimedTask.selectKeepConversation',
                  ),
                },
              ]}
            >
              <Switch
                checkedChildren={t('PC.Pages.SystemTaskCreateTimedTask.yes')}
                unCheckedChildren={t('PC.Pages.SystemTaskCreateTimedTask.no')}
              />
            </Form.Item>
            <Form.Item
              name="message"
              label={t('PC.Pages.SystemTaskCreateTimedTask.taskContent')}
              rules={[
                {
                  required: true,
                  message: t(
                    'PC.Pages.SystemTaskCreateTimedTask.enterTaskContent',
                  ),
                },
              ]}
            >
              <Input.TextArea
                placeholder={t(
                  'PC.Pages.SystemTaskCreateTimedTask.taskContentPlaceholder',
                )}
                showCount
                autoSize={{ minRows: 3, maxRows: 6 }}
                maxLength={10000}
              />
            </Form.Item>
          </>
        )}

        {/* 不能直接不显示存在 否则无法触发表单校验 【variables】 */}
        <Form.Item
          name="variables"
          label={
            variables && Array.isArray(variables) && variables.length > 0
              ? t('PC.Pages.SystemTaskCreateTimedTask.parameterConfig')
              : ''
          }
          rules={[
            {
              required: false,
              message: t(
                'PC.Pages.SystemTaskCreateTimedTask.fillParameterConfig',
              ),
              type: 'array',
            },
          ]}
        >
          <ParameterConfig />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateTimedTask;
