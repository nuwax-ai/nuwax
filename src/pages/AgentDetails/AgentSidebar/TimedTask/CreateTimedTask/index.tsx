import CustomFormModal from '@/components/CustomFormModal';
import LabelStar from '@/components/LabelStar';
import OverrideTextArea from '@/components/OverrideTextArea';
import SelectList from '@/components/SelectList';
import {
  apiAgentTaskCreate,
  apiAgentTaskCronList,
  apiAgentTaskUpdate,
} from '@/services/agentTask';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import {
  CreateTimedTaskProps,
  TaskCronInfo,
  TaskCronItemDto,
} from '@/types/interfaces/agentTask';
import { option } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 创建定时任务弹窗组件
const CreateTimedTask: React.FC<CreateTimedTaskProps> = ({
  agentId,
  mode = CreateUpdateModeEnum.Create,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [typeName, setTypeName] = useState<string>('');
  const [typeCron, setTypeCron] = useState<string>('');
  // 可选定时范围 - 名称
  const [typeNameList, setTypeNameList] = useState<option[]>([]);
  // cron
  const [typeCronList, setTypeCronList] = useState<option[]>([]);
  // 保存可选定时范围
  const taskCronListRef = useRef<TaskCronInfo[]>([]);

  // 设置子项
  const handleSetTypeCron = (cronList: TaskCronItemDto[]) => {
    // 子项
    const list =
      cronList?.map((item) => ({
        label: item.desc,
        value: item.cron,
      })) || [];
    setTypeCronList(list as option[]);
    setTypeCron(list[0]?.value || '');
  };

  // 处理定时信息
  const handleTimedInfo = (data: TaskCronInfo[]) => {
    if (data.length === 0) {
      return;
    }
    // 任务名称列表
    const _typeNameList = data?.map((item) => {
      return {
        label: item.typeName,
        value: item.typeName,
      };
    });
    setTypeNameList(_typeNameList);
    // 取第一个
    const firstItem = data[0];
    setTypeName(firstItem.typeName);
    // 子项
    handleSetTypeCron(firstItem?.items || []);
  };

  // 可选定时范围
  const { run: runCron } = useRequest(apiAgentTaskCronList, {
    manual: true,
    debounceInterval: 300,
    onSuccess: (result: TaskCronInfo[]) => {
      if (result.length > 0) {
        taskCronListRef.current = result;
        handleTimedInfo(result);
      }
    },
  });

  // 创建定时会话
  const { run: runCreate } = useRequest(apiAgentTaskCreate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('定时任务创建成功');
      onConfirm();
    },
  });

  // 更新定时会话
  const { run: runUpdate } = useRequest(apiAgentTaskUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('定时任务更新成功');
      onConfirm();
    },
  });

  useEffect(() => {
    runCron();
  }, []);

  // 创建、更新定时任务
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    const data = { ...values, taskCron: typeCron, agentId };
    if (mode === CreateUpdateModeEnum.Create) {
      runCreate(data);
    } else {
      runUpdate(data);
    }
  };

  const handlerConfirm = () => {
    form.submit();
  };

  // 选择定时范围 - 名称
  const handleChangeTypeName = (value: React.Key) => {
    setTypeName(value as string);
    const currentItem = taskCronListRef.current?.find(
      (item) => item.typeName === value,
    );
    // 子项
    handleSetTypeCron(currentItem?.items || []);
  };

  // 选择定时范围 - cron
  const handleChangeTypeCron = (value: React.Key) => {
    setTypeCron(value as string);
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={
        mode === CreateUpdateModeEnum.Create ? '创建定时任务' : '更新定时任务'
      }
      onCancel={onCancel}
      onConfirm={handlerConfirm}
    >
      <Form
        form={form}
        preserve={false}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item label={<LabelStar label="定时周期" />}>
          <Space>
            <Form.Item noStyle rules={[{ required: true, message: '请输入' }]}>
              <SelectList
                className={cx(styles.select)}
                options={typeNameList}
                value={typeName}
                onChange={handleChangeTypeName}
              />
            </Form.Item>
            <Form.Item noStyle rules={[{ required: true, message: '请输入' }]}>
              <SelectList
                className={cx(styles.select)}
                options={typeCronList}
                value={typeCron}
                onChange={handleChangeTypeCron}
              />
            </Form.Item>
          </Space>
        </Form.Item>
        <Form.Item name="topic" label="任务名称" rules={[{ required: true }]}>
          <Input placeholder="请输入任务摘要名称" showCount maxLength={100} />
        </Form.Item>
        <OverrideTextArea
          name="summary"
          label="任务内容"
          rules={[{ required: true, message: '请输入任务内容' }]}
          // initialValue={agentConfigInfo?.description}
          placeholder="请输入你要执行的任务信息，信息提供的越详细执行成功率越高"
          maxLength={2000}
        />
      </Form>
    </CustomFormModal>
  );
};

export default CreateTimedTask;
