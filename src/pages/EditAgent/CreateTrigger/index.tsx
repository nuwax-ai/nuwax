import CustomFormModal from '@/components/CustomFormModal';
import SelectList from '@/components/SelectList';
import TooltipIcon from '@/components/TooltipIcon';
import { VARIABLE_TYPE_LIST } from '@/constants/common.constants';
import { TASK_EXECUTION } from '@/constants/space.contants';
import { TriggerTypeEnum } from '@/types/enums/space';
import { customizeRequiredMark } from '@/utils/form';
import {
  CopyOutlined,
  DownOutlined,
  InfoCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { CascaderProps } from 'antd';
import { Cascader, Form, Input, Select, Space, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

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
  const [triggerType, setTriggerType] = useState<TriggerTypeEnum>();

  const handlerChangeTriggerType = (value) => {
    setTriggerType(value);
  };

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
          triggerType: triggerType,
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
          <SelectList
            options={TRIGGER_TYPE_LIST}
            onChange={(value) => setTriggerType(value as TriggerTypeEnum)}
          />
        </Form.Item>
        {triggerType === TriggerTypeEnum.Timing_Trigger ? (
          <Form.Item
            label={
              <span>
                触发器时间{' '}
                <span className={cx(styles['trigger-time-require'])}>*</span>
              </span>
            }
          >
            <Space.Compact block>
              <Form.Item
                className={cx(styles['form-item'])}
                name="triggerTime"
                rules={[{ required: true }]}
              >
                <Cascader
                  options={options}
                  onChange={onChange}
                  placeholder="Please select"
                />
              </Form.Item>
              <Form.Item
                className={cx(styles['form-item'])}
                name="triggerTime"
                rules={[{ required: true }]}
              >
                <Cascader
                  options={options}
                  onChange={onChange}
                  placeholder="Please select"
                />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        ) : (
          <>
            <Form.Item label="模式">
              <Form.Item className={cx(styles['mode-input'])}>
                <Input
                  disabled
                  suffix={
                    <DownOutlined className={cx(styles['dropdown-icon'])} />
                  }
                  placeholder="Webhook (Catch hook)"
                />
              </Form.Item>
              <Form.Item className={cx('mb-0')}>
                <div
                  className={cx(
                    'px-16',
                    'py-12',
                    'radius-6',
                    styles['mode-box'],
                  )}
                >
                  <div
                    className={cx('flex', 'items-center', styles['mode-title'])}
                  >
                    <h3>复制url到你的应用</h3>
                    <TooltipIcon
                      title="复制"
                      icon={
                        <CopyOutlined
                          className={cx(styles['copy-icon'])}
                          onClick={() => {}}
                        />
                      }
                    />
                  </div>
                  <Tooltip
                    title={
                      'https://api.coze.cn/api/trigger/v1/webhook/biz_id/bot_platform/hook/1000000000201990658'
                    }
                  >
                    <p className={cx('text-ellipsis')}>
                      https://api.coze.cn/api/trigger/v1/webhook/biz_id/bot_platform/hook/1000000000201990658
                    </p>
                  </Tooltip>
                </div>
              </Form.Item>
            </Form.Item>
            <Form.Item
              label="Bearer Token"
              rules={[{ required: true, message: '请输入Bearer Token' }]}
            >
              <Input.Password />
            </Form.Item>
            {/*请求参数*/}
            <Form.Item>
              <div className={cx(styles['require-params'], 'radius-6')}>
                <div className={cx('flex', styles['r-header'])}>
                  <DownOutlined className={cx(styles['dropdown-icon'])} />
                  <span>请求参数</span>
                  <TooltipIcon
                    title="用于其他系统对Webhook URL发出的POST请求中RequestBody需遵循的JSON格式，触发任务将基于该消息格式执行后续动作"
                    icon={<InfoCircleOutlined />}
                  />
                  <span
                    className={cx(
                      'hover-box',
                      'cursor-pointer',
                      'flex',
                      'items-center',
                      'content-center',
                      styles['plus-icon'],
                    )}
                  >
                    <PlusOutlined />
                  </span>
                </div>
                <ul>
                  <li
                    className={cx(
                      'flex',
                      'items-center',
                      styles['r-table-row'],
                    )}
                  >
                    <div className={cx(styles['var-name'])}>变量名</div>
                    <div className={cx(styles['var-type'])}>变量类型</div>
                    <div className={cx(styles.desc)}>描述</div>
                  </li>
                  <li
                    className={cx(
                      'flex',
                      'items-center',
                      styles['r-table-row'],
                    )}
                  >
                    <div className={cx(styles['var-name'])}>
                      <Input placeholder="输入变量名" />
                    </div>
                    <div className={cx(styles['var-type'])}>
                      <Select options={VARIABLE_TYPE_LIST} />
                    </div>
                    <div className={cx(styles.desc)}>描述</div>
                  </li>
                </ul>
              </div>
            </Form.Item>
          </>
        )}
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
