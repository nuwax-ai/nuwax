import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { customizeRequiredMark } from '@/utils/form';
import {
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Switch,
  message,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import {
  DEDUCT_CREDIT_TYPE_OPTIONS,
  buildCreditTypeSelectOptions,
} from '../../creditTypeOptions';
import { apiSystemDeductCredit } from '../../services/credit';
import {
  CreditFlowTypeEnum,
  DeductCreditParams,
  UserCreditSummaryInfo,
} from '../../types/credit';
/**
 * 积分扣减弹窗
 * - 提交 apiSystemDeductCredit → POST /api/system/credit/deduct
 * - payload 映射 DeductCreditParams：tenantId（tenantConfigInfo model）、userId、creditType、amount、bizNo、remark、allowNegative
 * - 打开时默认 creditType 为 MANUAL_DEDUCT
 */

/** 扣减表单字段，提交时组装为 DeductCreditParams */
interface DeductCreditFormValues {
  creditType: CreditFlowTypeEnum;
  amount: number;
  bizNo?: string;
  remark?: string;
  /** 是否允许扣减后余额为负 */
  allowNegative?: boolean;
}

export interface DeductCreditModalProps {
  /** 弹窗是否可见 */
  open: boolean;
  /** 列表行用户汇总（含 userId、user 展示信息） */
  userRecord?: UserCreditSummaryInfo | null;
  onClose: () => void;
  /** 扣减成功回调，通常用于刷新 ProTable */
  onSuccess?: () => void;
}

/**
 * 积分扣减弹窗
 */
const DeductCreditModal: React.FC<DeductCreditModalProps> = ({
  open,
  userRecord,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<DeductCreditFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  const creditTypeOptions = useMemo(
    () => buildCreditTypeSelectOptions(DEDUCT_CREDIT_TYPE_OPTIONS),
    [],
  );

  const userName = userRecord?.user?.username ?? '-';

  // 打开时重置表单；默认积分类型为手动扣减 MANUAL_DEDUCT
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        creditType: CreditFlowTypeEnum.MANUAL_DEDUCT,
        amount: undefined,
        bizNo: undefined,
        remark: undefined,
        allowNegative: false,
      });
    } else {
      form.resetFields();
    }
  }, [open, form]);

  const handleConfirm = () => {
    form.submit();
  };

  const handleSubmit = async (values: DeductCreditFormValues) => {
    const userId = userRecord?.userId;
    const tenantId = Number(
      (tenantConfigInfo as { tenantId?: number } | undefined)?.tenantId,
    );
    if (userId === undefined || userId === null) {
      return;
    }

    if (!tenantId) {
      return;
    }

    // 表单字段 → DeductCreditParams；tenantId 来自租户配置 model
    const payload: DeductCreditParams = {
      tenantId,
      userId: Number(userId),
      creditType: values.creditType,
      amount: values.amount,
      bizNo: values.bizNo?.trim() || undefined,
      remark: values.remark?.trim() || undefined,
      allowNegative: values.allowNegative ?? false,
    };

    setSubmitting(true);
    try {
      await apiSystemDeductCredit(payload);
      message.success(dict('PC.Pages.SystemUserCredits.deductSuccess'));
      onSuccess?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={dict('PC.Pages.SystemUserCredits.deductModalTitle')}
      open={open}
      onCancel={onClose}
      onConfirm={handleConfirm}
      loading={submitting}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={handleSubmit}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label={dict('PC.Pages.SystemUserCredits.colUserName')}>
              <Input disabled value={userName} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label={dict('PC.Pages.SystemUserCredits.colUserId')}>
              <Input disabled value={userRecord?.userId ?? ''} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="creditType"
              label={dict('PC.Pages.SystemUserCredits.fieldCreditType')}
              rules={[{ required: true }]}
            >
              <Select options={creditTypeOptions} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="amount"
              label={dict('PC.Pages.SystemUserCredits.fieldAmount')}
              rules={[
                {
                  required: true,
                  message: dict('PC.Common.Global.pleaseInput'),
                },
                {
                  type: 'number',
                  min: 1,
                  message: dict('PC.Pages.SystemUserCredits.fieldAmountMin'),
                },
              ]}
            >
              <InputNumber
                min={1}
                max={10000000000}
                precision={0}
                className="w-full"
                placeholder={dict(
                  'PC.Pages.SystemUserCredits.fieldAmountPlaceholder',
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="bizNo"
              label={dict('PC.Pages.SystemUserCredits.fieldBizNo')}
            >
              <Input
                maxLength={64}
                placeholder={dict(
                  'PC.Pages.SystemUserCredits.fieldBizNoPlaceholder',
                )}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="allowNegative"
              label={dict('PC.Pages.SystemUserCredits.fieldAllowNegative')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="remark"
              label={dict('PC.Pages.SystemUserCredits.fieldRemark')}
            >
              <Input.TextArea
                className="dispose-textarea-count"
                maxLength={200}
                showCount
                autoSize={{ minRows: 3, maxRows: 5 }}
                placeholder={dict(
                  'PC.Pages.SystemUserCredits.fieldRemarkPlaceholder',
                )}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </CustomFormModal>
  );
};

export default DeductCreditModal;
