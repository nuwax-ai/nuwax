import CustomFormModal from '@/components/CustomFormModal';
import SelectList from '@/components/SelectList';
import { TASK_EXECUTION } from '@/constants/space.contants';
import { TriggerTypeEnum } from '@/types/enums/space';
import { customizeRequiredMark } from '@/utils/form';
import type { CascaderProps } from 'antd';
import { Cascader, Form, Input } from 'antd';
// import classNames from 'classnames';
import React from 'react';
// import styles from './index.less';

// const cx = classNames.bind(styles);

interface CreateTriggerProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}

interface Option {
  value: string;
  label: string;
  children?: Option[];
}

const options: Option[] = [
  {
    value: 'zhejiang',
    label: 'Zhejiang',
    children: [
      {
        value: 'hangzhou',
        label: 'Hangzhou',
        children: [
          {
            value: 'xihu',
            label: 'West Lake',
          },
        ],
      },
    ],
  },
  {
    value: 'jiangsu',
    label: 'Jiangsu',
    children: [
      {
        value: 'nanjing',
        label: 'Nanjing',
        children: [
          {
            value: 'zhonghuamen',
            label: 'Zhong Hua Men',
          },
        ],
      },
    ],
  },
];

const TRIGGER_TYPE_LIST = [
  {
    value: TriggerTypeEnum.Timing_Trigger,
    label: '定时触发',
    img: 'https://p3-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/d50c9c5c2fe249c3bfee86299d152dfe~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739609524&x-signature=oQDYAxAVtYWH%2FsMGPZ6ItvH3D9E%3D',
  },
  {
    value: TriggerTypeEnum.Event_Trigger,
    label: '事件触发',
    img: 'https://p26-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/c2e3da86fb5747ef950beb99d9667eea~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1739609524&x-signature=JpRrZVRVUm3K3EZpDHu24cKxylI%3D',
  },
];

const CreateTrigger: React.FC<CreateTriggerProps> = ({
  title,
  open,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();

  const onFinish = (values) => {
    // todo 提交form表单
    console.log(values, '-----');
  };

  const handlerConfirm = () => {
    form.submit();
    onConfirm();
  };

  const onChange: CascaderProps<Option>['onChange'] = (value) => {
    console.log(value);
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
          triggerName: '',
          triggerType: TriggerTypeEnum.Timing_Trigger,
        }}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item
          name="triggerName"
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
          <SelectList options={TRIGGER_TYPE_LIST} />
        </Form.Item>
        <Form.Item
          name="triggerTime"
          label="触发器时间"
          rules={[{ required: true }]}
        >
          <Cascader
            options={options}
            onChange={onChange}
            placeholder="Please select"
          />
        </Form.Item>
        <Form.Item
          name="taskExecution"
          label="任务执行"
          rules={[{ required: true, message: '请选择任务执行' }]}
        >
          <SelectList options={TASK_EXECUTION} placeholder="请选择任务执行" />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreateTrigger;
