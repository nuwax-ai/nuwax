import CustomFormModal from '@/components/CustomFormModal';
import {
  apiCreateAgentSubscriptionPlan,
  apiUpdateAgentSubscriptionPlan,
} from '@/pages/EditAgent/services/agent-subscription-plan';
import {
  SubscriptionPlanBizTypeEnum,
  SubscriptionPlanInfo,
  SubscriptionPlanPeriodEnum,
  SubscriptionPlanStatusEnum,
} from '@/pages/SystemManagement/SubscriptionCredits/types/subscription';
import { customizeRequiredMark } from '@/utils/form';
import {
  Button,
  Form,
  Input,
  InputNumber,
  InputRef,
  Segmented,
  Switch,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import styles from './index.less';

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
  editPlan?: SubscriptionPlanInfo | null;
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
  editPlan,
  onCancel,
  onCreated,
}) => {
  const [form] = Form.useForm();
  const functionOnly = Form.useWatch('functionOnly', form);
  const nameInputRef = useRef<InputRef>(null);
  const [limitType, setLimitType] = useState<'unlimited' | 'limited'>(
    'unlimited',
  );

  // 创建中
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    form.resetFields();

    if (editPlan) {
      const isUnlimited = editPlan.callLimitCount === -1;
      setLimitType(isUnlimited ? 'unlimited' : 'limited');
      form.setFieldsValue({
        name: editPlan.name,
        description: editPlan.description,
        period: editPlan.period || SubscriptionPlanPeriodEnum.MONTH,
        price: editPlan.price,
        functionOnly: editPlan.functionOnly ?? false,
        callLimitCount: isUnlimited ? undefined : editPlan.callLimitCount,
      });
      return;
    }
    setLimitType('unlimited');
    form.setFieldsValue({
      period: SubscriptionPlanPeriodEnum.MONTH,
      functionOnly: false,
      callLimitCount: undefined,
    });
  }, [open, editPlan, form]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [open]);

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
      const payload: SubscriptionPlanInfo = {
        ...(editPlan || {}),
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
        isHot: editPlan?.isHot ?? false,
        status: editPlan?.status ?? SubscriptionPlanStatusEnum.Online,
        bizType: editPlan?.bizType || SubscriptionPlanBizTypeEnum.AGENT,
        bizId: editPlan?.bizId || String(agentId),
        sort: editPlan?.sort ?? 0,
      };

      if (editPlan?.id) {
        await apiUpdateAgentSubscriptionPlan(payload);
        message.success('更新成功');
      } else {
        await apiCreateAgentSubscriptionPlan(payload);
        message.success('添加成功');
      }
      onCreated?.();
      onCancel();
    } finally {
      setCreating(false);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={editPlan ? '编辑套餐' : '添加套餐'}
      open={open}
      width={600}
      centered
      loading={creating}
      onCancel={onCancel}
      onConfirm={handleSubmit}
    >
      <Form
        form={form}
        preserve={false}
        layout="vertical"
        requiredMark={customizeRequiredMark}
      >
        <Form.Item
          name="name"
          label="套餐名称"
          rules={[{ required: true, message: '请输入套餐名称' }]}
        >
          <Input
            ref={nameInputRef}
            placeholder="例如：专业版"
            maxLength={30}
            showCount
          />
        </Form.Item>

        <Form.Item name="description" label="套餐描述">
          <Input.TextArea
            placeholder="请输入套餐描述"
            showCount
            maxLength={200}
            autoSize={{ minRows: 3, maxRows: 6 }}
            className="dispose-textarea-count"
          />
        </Form.Item>

        <Form.Item label="价格" required>
          <div className={styles['price-row']}>
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
                max={100000000}
                step={0.01}
                precision={2}
                className="w-full"
                placeholder="请输入价格"
              />
            </Form.Item>
          </div>
        </Form.Item>

        <Form.Item label="可调用次数（每月）">
          <div className={styles['limit-switch-row']}>
            <Button
              type={limitType === 'unlimited' ? 'primary' : 'default'}
              className={styles['limit-btn']}
              onClick={() => setLimitType('unlimited')}
            >
              不限
            </Button>
            <Button
              type={limitType === 'limited' ? 'primary' : 'default'}
              className={styles['limit-btn']}
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
                max={10000000000}
                precision={0}
                className="w-full"
                placeholder="请输入可调用次数"
              />
            </Form.Item>
          )}
        </Form.Item>

        <div className={styles['function-only-row']}>
          <Form.Item name="functionOnly" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
          <div className={styles['function-only-text']}>
            <div className={styles['function-only-title']}>仅为功能订阅</div>
            <div className={styles['function-only-desc']}>
              {functionOnly ? (
                <>
                  <span className={styles['function-only-highlight']}>
                    仅为功能订阅：
                  </span>
                  模型/工具等资源调用需
                  <span className={styles['function-only-highlight-pay']}>
                    额外付费
                  </span>
                </>
              ) : (
                <>
                  <span className={styles['function-only-highlight']}>
                    包干价订阅：
                  </span>
                  资源调用费用由开发者承担
                </>
              )}
            </div>
          </div>
        </div>
      </Form>
    </CustomFormModal>
  );
};

export default CreatePlanModal;
