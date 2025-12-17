import CustomFormModal from '@/components/CustomFormModal';
import LabelStar from '@/components/LabelStar';
import { apiAddTimedTask, apiUpdateTimedTask } from '@/services/library';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input, message } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useRequest } from 'umi';
import TimedPeriodSelector from './components/TimedPeriodSelector';
import styles from './index.less';

import { apiPublishedAgentInfo } from '@/services/agentDev';
import { apiPublishedWorkflowInfo } from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { InputAndOutConfig } from '@/types/interfaces/node';
import ParameterConfig from './components/ParameterConfig';
import SelectTarget from './components/SelectTarget';
const cx = classNames.bind(styles);

export interface CreateTimedTaskProps {
  spaceId: number;
  id?: number;
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
  id,
  mode = CreateUpdateModeEnum.Create,
  open,
  onCancel = () => {},
  onConfirm = () => {},
}) => {
  const [form] = Form.useForm();
  // 监听 variables 字段变化，用于条件显示参数配置
  const variables = Form.useWatch('variables', form);
  const taskTarget = Form.useWatch('taskTarget', form);

  // 新增定时任务
  const { run } = useRequest(apiAddTimedTask, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('定时任务已创建成功');
      onCancel?.();
      onConfirm?.();
    },
  });

  // 更新定时任务
  const { run: runUpdate } = useRequest(apiUpdateTimedTask, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('定时任务更新成功');
      onCancel?.();
      onConfirm?.();
    },
  });

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
        } else if (item.dataType === 'File_Image') {
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
    console.log(values);
    const {
      taskTarget: { targetId, targetType },
      message,
      taskName,
      cron,
    } = values;

    // 基础数据
    let data: any = { spaceId, targetType, targetId, taskName, cron };

    // 获取参数配置
    const params = getParameterConfig(values);

    // 智能体
    if (targetType === AgentComponentTypeEnum.Agent) {
      data = {
        ...data,
        params: { message: message, variables: params },
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
      runUpdate({ ...data, id });
    }
  };

  const handlerSubmit = () => {
    form.submit();
  };

  // 获取智能体或工作流入参配置
  const getTargetConfig = async (
    value: {
      targetId: string;
      targetType:
        | AgentComponentTypeEnum.Workflow
        | AgentComponentTypeEnum.Agent;
    } | null,
  ) => {
    // 重置variables字段 防止表单校验不通过
    variables?.forEach((item: InputAndOutConfig) => {
      form.resetFields([item.name]);
    });

    if (!value) {
      form.setFieldsValue({ variables: [] });
      return;
    }

    switch (value.targetType) {
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

  const handleChangeTarget = (
    value: {
      targetId: string;
      targetType:
        | AgentComponentTypeEnum.Workflow
        | AgentComponentTypeEnum.Agent;
    } | null,
  ) => {
    getTargetConfig(value);
  };

  return (
    <CustomFormModal
      form={form}
      title={
        mode === CreateUpdateModeEnum.Create ? '创建定时任务' : '更新定时任务'
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
      >
        <Form.Item name="cron" label={<LabelStar label="定时周期" />}>
          <TimedPeriodSelector />
        </Form.Item>

        <Form.Item
          name="taskName"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        >
          <Input placeholder="请输入任务名称" showCount maxLength={100} />
        </Form.Item>

        <Form.Item
          name="taskTarget"
          label="任务对象"
          rules={[
            { required: true, message: '请选择任务对象', type: 'object' },
          ]}
        >
          <SelectTarget onChange={handleChangeTarget} />
        </Form.Item>

        {/* 只有智能体有任务内容 */}
        {taskTarget?.targetType === AgentComponentTypeEnum.Agent && (
          <Form.Item
            name="message"
            label="任务内容"
            rules={[{ required: true, message: '请输入任务内容' }]}
          >
            <Input.TextArea
              placeholder="请输入你要执行的任务信息，信息提供的越详细执行成功率越高"
              showCount
              autoSize={{ minRows: 3, maxRows: 6 }}
              maxLength={10000}
            />
          </Form.Item>
        )}

        {/* 不能直接不显示存在 否则无法触发表单校验 【variables】 */}
        <Form.Item
          name="variables"
          label={
            variables && Array.isArray(variables) && variables.length > 0
              ? '参数配置'
              : ''
          }
          rules={[
            { required: false, message: '请填写参数配置', type: 'array' },
          ]}
        >
          <ParameterConfig />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateTimedTask;
