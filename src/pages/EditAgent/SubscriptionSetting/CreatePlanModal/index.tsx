import { apiCreateAgentSubscriptionPlan } from '@/pages/EditAgent/services/agent-subscription-plan';
import {
  SubscriptionPlanBizTypeEnum,
  SubscriptionPlanPeriodEnum,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Switch,
  message,
} from 'antd';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface CreatePlanFormValues {
  name: string;
  description?: string;
  period: SubscriptionPlanPeriodEnum;
  price: number;
  callLimitCount?: number;
  functionOnly?: boolean;
  limitType: 'unlimited' | 'limited';
}

interface CreatePlanModalProps {
  agentId: number;
  open: boolean;
  onCancel: () => void;
  onCreated?: () => void;
}

/**
 * 周期选项
 */
const periodOptions = [
  { label: '月', value: SubscriptionPlanPeriodEnum.MONTH },
  { label: '季', value: SubscriptionPlanPeriodEnum.QUARTER },
  { label: '年', value: SubscriptionPlanPeriodEnum.YEAR },
];

/**
 * 创建订阅计划模态框
 */
const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  agentId,
  open,
  onCancel,
  onCreated,
}) => {
  const [form] = Form.useForm();
  const [limitType, setLimitType] = useState<'unlimited' | 'limited'>(
    'unlimited',
  );
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setLimitType('unlimited');
    form.setFieldsValue({
      period: SubscriptionPlanPeriodEnum.MONTH,
      functionOnly: false,
      callLimitCount: undefined,
    });
  }, [open, form]);

  /**
   * 提交创建订阅计划
   */
  const handleSubmit = async () => {
    const values = await form.validateFields();
    const submitValues: CreatePlanFormValues = {
      ...values,
      limitType,
    };
    setCreating(true);
    try {
      await apiCreateAgentSubscriptionPlan({
        name: submitValues.name,
        description: submitValues.description || '',
        price: submitValues.price,
        firstPrice: submitValues.price,
        period: submitValues.period,
        callLimitCount:
          submitValues.limitType === 'unlimited'
            ? -1
            : Number(submitValues.callLimitCount || 0),
        functionOnly: Boolean(submitValues.functionOnly),
        isHot: false,
        status: SubscriptionPlanStatusEnum.Online,
        bizType: SubscriptionPlanBizTypeEnum.AGENT,
        bizId: String(agentId),
        groupIds: [],
        sort: 0,
      });
      message.success('添加成功');
      onCreated?.();
      onCancel();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      width={600}
      centered
      destroyOnHidden
      onCancel={onCancel}
      footer={null}
      className={cx(styles.createPlanModal)}
      title={<span className={cx(styles.modalTitle)}>添加套餐</span>}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="套餐名称"
          rules={[{ required: true, message: '请输入套餐名称' }]}
        >
          <Input placeholder="例如：专业版" maxLength={30} showCount />
        </Form.Item>

        <Form.Item name="description" label="套餐描述">
          <Input.TextArea
            placeholder="简短的套餐描述文案"
            showCount
            maxLength={200}
            autoSize={{ minRows: 3, maxRows: 6 }}
            className="dispose-textarea-count"
          />
        </Form.Item>

        <Form.Item label="价格">
          <div className={cx(styles.priceRow)}>
            <Form.Item name="period" noStyle>
              <Segmented options={periodOptions} />
            </Form.Item>
            <Form.Item
              name="price"
              noStyle
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber
                min={0}
                max={1000000}
                precision={2}
                className="w-full"
                placeholder="输入价格"
              />
            </Form.Item>
          </div>
        </Form.Item>

        <Form.Item label="可调用次数">
          <div className={cx(styles.limitSwitchRow)}>
            <Button
              type={limitType === 'unlimited' ? 'primary' : 'default'}
              className={cx(styles.limitBtn)}
              onClick={() => setLimitType('unlimited')}
            >
              不限
            </Button>
            <Button
              type={limitType === 'limited' ? 'primary' : 'default'}
              className={cx(styles.limitBtn)}
              onClick={() => setLimitType('limited')}
            >
              限制
            </Button>
          </div>
          {limitType === 'limited' && (
            <Form.Item
              name="callLimitCount"
              rules={[{ required: true, message: '请输入可调用次数' }]}
              style={{ marginTop: 12, marginBottom: 0 }}
            >
              <InputNumber
                min={1}
                precision={0}
                style={{ width: '100%' }}
                placeholder="请输入可调用次数"
              />
            </Form.Item>
          )}
        </Form.Item>

        <div className={cx(styles.functionOnlyRow)}>
          <Form.Item name="functionOnly" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
          <div className={cx(styles.functionOnlyText)}>
            <div className={cx(styles.functionOnlyTitle)}>仅为功能订阅</div>
            <div className={cx(styles.functionOnlyDesc)}>
              开启后：模型/工具等资源调用需额外付费
            </div>
          </div>
        </div>

        <div className={cx(styles.modalFooter)}>
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" loading={creating} onClick={handleSubmit}>
            确认
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default CreatePlanModal;
