import CustomFormModal from '@/components/CustomFormModal';
import LabelStar from '@/components/LabelStar';
// import { apiAddWorkflow, apiUpdateWorkflow } from '@/services/library';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { customizeRequiredMark } from '@/utils/form';
import type { FormProps } from 'antd';
import { Form, Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
// import { useRequest } from 'umi';
import TimedPeriodSelector from './components/TimedPeriodSelector';
import styles from './index.less';

import { apiPublishedAgentInfo } from '@/services/agentDev';
import { apiPublishedWorkflowInfo } from '@/services/plugin';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import SelectTarget from './components/SelectTarget';
const cx = classNames.bind(styles);

export interface CreateTimedTaskProps {
  spaceId: number;
  mode?: CreateUpdateModeEnum;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}
/**
 * 创建定时任务弹窗
 */
const CreateTimedTask: React.FC<CreateTimedTaskProps> = ({
  // spaceId,
  mode = CreateUpdateModeEnum.Create,
  open,
  onCancel,
  // onConfirm,
}) => {
  const [form] = Form.useForm();

  // 新增定时任务
  // const { run } = useRequest(apiAddWorkflow, {
  //   manual: true,
  //   debounceInterval: 300,
  //   onSuccess: (result: number) => {
  //     message.success('定时任务已创建成功');
  //     onCancel();
  //   },
  // });

  // 更新定时任务
  // const { run: runUpdate } = useRequest(apiUpdateWorkflow, {
  //   manual: true,
  //   debounceInterval: 300,
  //   onSuccess: () => {
  //     message.success('定时任务更新成功');
  //     onConfirm();
  //   },
  // });

  const onFinish: FormProps<{
    name: string;
    description: string;
  }>['onFinish'] = (values) => {
    console.log(values);
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
    if (!value) {
      form.setFieldsValue({
        variables: [],
      });
      return;
    }

    switch (value.targetType) {
      case AgentComponentTypeEnum.Workflow: {
        const {
          data: { inputArgs },
        } = await apiPublishedWorkflowInfo(Number(value.targetId));
        console.log('workflowInfo', inputArgs);
        // form.setFieldsValue({
        //   variables: inputArgs,
        // });
        break;
      }
      case AgentComponentTypeEnum.Agent: {
        const {
          data: { variables },
        } = await apiPublishedAgentInfo(Number(value.targetId));
        console.log('agentInfo', variables);
        // form.setFieldsValue({
        //   variables: variables,
        // });
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
    console.log(value);
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
          name="message"
          label="任务内容"
          rules={[{ required: true, message: '请输入任务内容' }]}
        >
          <Input.TextArea
            placeholder="请输入你要执行的任务信息，信息提供的越详细执行成功率越高"
            showCount
            autoSize={{ minRows: 3, maxRows: 6 }}
            maxLength={2000}
          />
        </Form.Item>
        <Form.Item
          name="variables"
          label="任务对象"
          rules={[
            { required: true, message: '请选择任务对象', type: 'object' },
          ]}
        >
          <SelectTarget onChange={handleChangeTarget} />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateTimedTask;
