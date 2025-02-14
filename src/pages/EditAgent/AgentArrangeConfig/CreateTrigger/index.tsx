import CustomFormModal from '@/components/CustomFormModal';
import SelectList from '@/components/SelectList';
import { TRIGGER_TYPE_LIST } from '@/constants/agent.constants';
import { TASK_EXECUTION } from '@/constants/space.contants';
import { apiAgentComponentTriggerAdd } from '@/services/agentConfig';
import { TriggerTypeEnum } from '@/types/enums/agent';
import type { AgentComponentTriggerAddParams } from '@/types/interfaces/agent';
import type { CreateTriggerProps } from '@/types/interfaces/agentConfig';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import EventTrigger from './EventTrigger';
import TimingTrigger from './TimingTrigger';

/**
 * 创建触发器组件
 */
const CreateTrigger: React.FC<CreateTriggerProps> = ({
  agentId,
  title,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  // 	触发类型
  const [triggerType, setTriggerType] = useState<TriggerTypeEnum>(
    TriggerTypeEnum.TIME,
  );

  // 新增智能体触发器配置
  const { run } = useRequest(apiAgentComponentTriggerAdd, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('触发器创建成功');
      onConfirm();
    },
  });

  // todo
  const onFinish: FormProps<AgentComponentTriggerAddParams>['onFinish'] = (
    values,
  ) => {
    console.log(values, '-----');
    const timeCronExpression = values.timeCronExpression.join(',');
    const timeZone = values.timeZone.join(',');
    run({
      ...values,
      timeCronExpression,
      timeZone,
      agentId,
    });
  };

  const handlerConfirm = () => {
    form.submit();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={title}
      onCancel={onCancel}
      onConfirm={handlerConfirm}
    >
      <Form
        form={form}
        preserve={false}
        initialValues={{
          name: '',
          triggerType: triggerType,
        }}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="name"
          label="名称"
          rules={[{ required: true, message: '请输入触发器名称' }]}
        >
          <Input placeholder="请输入触发器名称" />
        </Form.Item>
        <Form.Item
          name="triggerType"
          label="触发器类型"
          rules={[{ required: true }]}
        >
          <SelectList
            options={TRIGGER_TYPE_LIST}
            onChange={(value) => setTriggerType(value as TriggerTypeEnum)}
          />
        </Form.Item>
        {triggerType === TriggerTypeEnum.TIME ? (
          // 定时触发
          <TimingTrigger />
        ) : (
          // 事件触发
          <EventTrigger />
        )}
        <Form.Item name="componentType" label="任务执行">
          <SelectList options={TASK_EXECUTION} placeholder="请选择任务执行" />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateTrigger;
