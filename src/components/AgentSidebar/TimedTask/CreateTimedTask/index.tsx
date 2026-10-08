import CustomFormModal from '@/components/CustomFormModal';
import LabelStar from '@/components/LabelStar';
import OverrideTextArea from '@/components/OverrideTextArea';
import SelectList from '@/components/custom/SelectList';
import { useTimedPeriodOptions } from '@/hooks/useTimedPeriodOptions';
import {
  apiAgentTaskCreate,
  apiAgentTaskCronList,
  apiAgentTaskUpdate,
} from '@/services/agentTask';
import { dict } from '@/services/i18nRuntime';
import { CreateUpdateModeEnum } from '@/types/enums/common';
import { CreateTimedTaskProps } from '@/types/interfaces/agentTask';
import { customizeRequiredMark } from '@/utils/form';
import { Form, FormProps, Input, message, Space } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 创建定时任务弹窗组件
const CreateTimedTask: React.FC<CreateTimedTaskProps> = ({
  agentId,
  mode = CreateUpdateModeEnum.Create,
  open,
  currentTask,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const [cronValue, setCronValue] = useState<string>();
  const editing = mode === CreateUpdateModeEnum.Update && currentTask;
  const {
    typeName,
    typeCron,
    typeNameList,
    typeCronList,
    isCustomCron,
    handleChangeTypeName,
    handleChangeTypeCron,
  } = useTimedPeriodOptions(
    apiAgentTaskCronList,
    cronValue ?? (editing ? currentTask.taskCron : undefined),
    setCronValue,
    false,
  );
  // 创建定时任务
  const { run: runCreate } = useRequest(apiAgentTaskCreate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(dict('PC.Components.CreateTimedTask.createSuccess'));
      onConfirm();
      // 重置定时周期
      setCronValue(undefined);
    },
  });

  // 更新定时会话
  const { run: runUpdate } = useRequest(apiAgentTaskUpdate, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success(dict('PC.Components.CreateTimedTask.updateSuccess'));
      onConfirm();
      // 重置定时周期
      setCronValue(undefined);
    },
  });

  useEffect(() => {
    setCronValue(
      mode === CreateUpdateModeEnum.Update ? currentTask?.taskCron : undefined,
    );
    if (open && mode === CreateUpdateModeEnum.Update && currentTask) {
      form.setFieldsValue({
        topic: currentTask.topic,
        summary: currentTask.summary,
      });
    }
  }, [open, mode, currentTask?.id, currentTask?.taskCron]);

  // 创建、更新定时任务
  const onFinish: FormProps<any>['onFinish'] = (values) => {
    const data = { ...values, taskCron: typeCron, agentId };
    if (mode === CreateUpdateModeEnum.Create) {
      runCreate(data);
    } else {
      runUpdate({
        ...data,
        id: currentTask?.id,
      });
    }
  };

  const handlerConfirm = () => {
    form.submit();
  };

  const onCancelCreate = () => {
    // 重置定时周期
    setCronValue(undefined);
    onCancel();
  };

  return (
    <CustomFormModal
      form={form}
      open={open}
      title={
        mode === CreateUpdateModeEnum.Create
          ? dict('PC.Components.CreateTimedTask.createTitle')
          : dict('PC.Components.CreateTimedTask.updateTitle')
      }
      onCancel={onCancelCreate}
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
        <Form.Item
          label={
            <LabelStar
              label={dict('PC.Components.CreateTimedTask.timedPeriod')}
            />
          }
        >
          <Space>
            <Form.Item
              noStyle
              rules={[
                {
                  required: true,
                  message: dict('PC.Common.Global.pleaseInput'),
                },
              ]}
            >
              <SelectList
                className={cx(styles.select)}
                options={typeNameList}
                value={typeName}
                onChange={handleChangeTypeName}
              />
            </Form.Item>
            {isCustomCron ? (
              <span title={typeCron}>{typeCron}</span>
            ) : (
              <Form.Item
                noStyle
                rules={[
                  {
                    required: true,
                    message: dict('PC.Common.Global.pleaseInput'),
                  },
                ]}
              >
                <SelectList
                  className={cx(styles.select)}
                  options={typeCronList}
                  value={typeCron}
                  onChange={handleChangeTypeCron}
                />
              </Form.Item>
            )}
          </Space>
        </Form.Item>
        <Form.Item
          name="topic"
          label={dict('PC.Components.CreateTimedTask.taskName')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Components.CreateTimedTask.pleaseInputTaskName',
              ),
            },
          ]}
        >
          <Input
            placeholder={dict(
              'PC.Components.CreateTimedTask.pleaseInputTaskName',
            )}
            showCount
            maxLength={100}
          />
        </Form.Item>
        <OverrideTextArea
          name="summary"
          label={dict('PC.Components.CreateTimedTask.taskContent')}
          rules={[
            {
              required: true,
              message: dict(
                'PC.Components.CreateTimedTask.pleaseInputTaskContent',
              ),
            },
          ]}
          placeholder={dict(
            'PC.Components.CreateTimedTask.taskContentPlaceholder',
          )}
          maxLength={2000}
        />
      </Form>
    </CustomFormModal>
  );
};

export default CreateTimedTask;
