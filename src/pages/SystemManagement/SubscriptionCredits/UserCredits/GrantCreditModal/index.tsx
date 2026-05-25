import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { customizeRequiredMark } from '@/utils/form';
import {
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { useModel } from 'umi';
import {
  GRANT_CREDIT_TYPE_OPTIONS,
  buildCreditTypeSelectOptions,
} from '../../creditTypeOptions';
import { apiSystemAddCredit } from '../../services/credit';
import {
  AddCreditParams,
  CreditFlowTypeEnum,
  UserCreditSummaryInfo,
} from '../../types/credit';
/**
 * 积分发放弹窗
 * - 提交 apiSystemAddCredit → POST /api/system/credit/add
 * - payload 映射 AddCreditParams：tenantId（tenantConfigInfo model）、userId、creditType、amount、bizNo、remark、expireTime
 * - 打开时默认 creditType 为 MANUAL
 */

/** 发放表单字段，提交时组装为 AddCreditParams */
interface GrantCreditFormValues {
  creditType: CreditFlowTypeEnum;
  amount: number;
  bizNo?: string;
  remark?: string;
  expireTime?: Dayjs;
}

export interface GrantCreditModalProps {
  /** 弹窗是否可见 */
  open: boolean;
  /** 列表行用户汇总（含 userId、user 展示信息） */
  userRecord?: UserCreditSummaryInfo | null;
  onClose: () => void;
  /** 发放成功回调，通常用于刷新 ProTable */
  onSuccess?: () => void;
}

const GrantCreditModal: React.FC<GrantCreditModalProps> = ({
  open,
  userRecord,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm<GrantCreditFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  const creditTypeOptions = useMemo(
    () => buildCreditTypeSelectOptions(GRANT_CREDIT_TYPE_OPTIONS),
    [],
  );

  const userName = userRecord?.user?.username ?? '-';

  // 打开时重置表单；默认积分类型为手动发放 MANUAL
  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        creditType: CreditFlowTypeEnum.MANUAL,
        amount: undefined,
        bizNo: undefined,
        remark: undefined,
        expireTime: undefined,
      });
    } else {
      form.resetFields();
    }
  }, [open, form]);

  const handleConfirm = () => {
    form.submit();
  };

  const handleSubmit = async (values: GrantCreditFormValues) => {
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

    // 表单字段 → AddCreditParams；tenantId 来自租户配置 model
    const payload: AddCreditParams = {
      tenantId,
      userId: Number(userId),
      creditType: values.creditType,
      amount: values.amount,
      bizNo: values.bizNo?.trim() || undefined,
      remark: values.remark?.trim() || undefined,
      expireTime: values.expireTime ? values.expireTime.valueOf() : undefined,
    };

    setSubmitting(true);
    try {
      await apiSystemAddCredit(payload);
      message.success(dict('PC.Pages.SystemUserCredits.grantSuccess'));
      onSuccess?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={dict('PC.Pages.SystemUserCredits.grantModalTitle')}
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
              name="expireTime"
              label={dict('PC.Pages.SystemUserCredits.fieldExpireTime')}
            >
              <DatePicker
                showTime
                className="w-full"
                disabledDate={(current) =>
                  current ? current < dayjs().startOf('day') : false
                }
                placeholder={dict(
                  'PC.Pages.SystemUserCredits.fieldExpireTimePlaceholder',
                )}
              />
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

export default GrantCreditModal;
