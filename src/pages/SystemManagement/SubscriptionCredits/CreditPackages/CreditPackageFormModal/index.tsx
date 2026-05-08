import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { customizeRequiredMark } from '@/utils/form';
import { Col, Form, Input, InputNumber, Row, Switch, message } from 'antd';
import type { FormInstance } from 'antd/es/form';
import React, { useEffect, useState } from 'react';
import {
  apiCreateCreditPackage,
  apiUpdateCreditPackage,
} from '../../services/credit';
import { CreditPackageInfo, CreditPackageStatusEnum } from '../../types/credit';
import styles from './index.less';

interface CreditPackageFormModalProps {
  form: FormInstance;
  open: boolean;
  creditPackageInfo: CreditPackageInfo | null;
  onSuccess?: () => void;
  onCancel: () => void;
}

/**
 * 新建、编辑积分套餐表单弹窗
 */
const CreditPackageFormModal: React.FC<CreditPackageFormModalProps> = ({
  form,
  open,
  creditPackageInfo,
  onSuccess,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);

  const isEditMode = !!creditPackageInfo?.id;

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        packageName: creditPackageInfo?.packageName,
        creditAmount: creditPackageInfo?.creditAmount,
        period: creditPackageInfo?.period,
        price: creditPackageInfo?.price,
        status: creditPackageInfo?.status === CreditPackageStatusEnum.Enabled,
        sort: creditPackageInfo?.sort,
        remark: creditPackageInfo?.remark,
      });
    } else {
      form.resetFields();
    }
  }, [open, creditPackageInfo, form]);

  // 确认提交
  const handleConfirm = () => {
    form.submit();
  };

  // 提交表单
  const handleSubmit = async (values: CreditPackageInfo) => {
    const payload: CreditPackageInfo = {
      ...(isEditMode ? { id: creditPackageInfo?.id } : {}),
      ...values,
      status: values.status
        ? CreditPackageStatusEnum.Enabled
        : CreditPackageStatusEnum.Disabled,
    };

    setSaving(true);
    try {
      if (isEditMode) {
        await apiUpdateCreditPackage(payload);
        message.success(dict('PC.Common.Global.saveSuccess'));
      } else {
        await apiCreateCreditPackage(payload);
        message.success(dict('PC.Common.Global.createSuccess'));
      }
      onSuccess?.();
    } catch {
      message.error(dict('PC.Common.Toast.operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={
        creditPackageInfo
          ? dict('PC.Pages.SystemCreditPackages.editPackage')
          : dict('PC.Pages.SystemCreditPackages.createPackage')
      }
      open={open}
      classNames={{ body: styles['credit-package-form-modal-body'] }}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      loading={saving}
      width={560}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={customizeRequiredMark}
        onFinish={handleSubmit}
      >
        <Form.Item
          name="packageName"
          label={dict('PC.Pages.SystemCreditPackages.fieldName')}
          rules={[{ required: true }]}
        >
          <Input maxLength={30} showCount />
        </Form.Item>
        <Form.Item
          name="creditAmount"
          label={dict('PC.Pages.SystemCreditPackages.fieldCredits')}
          rules={[{ required: true }]}
        >
          <InputNumber
            min={1}
            max={100000000}
            precision={0}
            className="w-full"
          />
        </Form.Item>
        <Form.Item
          name="period"
          label={dict('PC.Pages.SystemCreditPackages.fieldValidityPeriod')}
          rules={[{ required: true }]}
        >
          <InputNumber
            min={1}
            max={100000000}
            precision={0}
            className="w-full"
            placeholder={dict(
              'PC.Pages.SystemCreditPackages.fieldValidityPeriodPlaceholder',
            )}
          />
        </Form.Item>
        <Form.Item
          name="price"
          label={dict('PC.Pages.SystemCreditPackages.fieldPrice')}
          rules={[{ required: true }]}
        >
          <InputNumber
            min={0}
            max={100000000}
            precision={1}
            step={0.1}
            prefix="¥"
            className="w-full"
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="sort"
              label={dict('PC.Pages.SystemCreditPackages.fieldSort')}
            >
              <InputNumber min={1} precision={0} className="w-full" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="status"
              label={dict('PC.Pages.SystemCreditPackages.fieldEnabled')}
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="remark"
          label={dict('PC.Pages.SystemCreditPackages.fieldRemark')}
        >
          <Input.TextArea
            maxLength={200}
            showCount
            className="dispose-textarea-count"
            autoSize={{ minRows: 3, maxRows: 5 }}
            placeholder={dict(
              'PC.Pages.SystemCreditPackages.fieldRemarkPlaceholder',
            )}
          />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreditPackageFormModal;
