import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, InputNumber, Switch, message } from 'antd';
import type { FormInstance } from 'antd/es/form';
import React, { useEffect, useState } from 'react';
import {
  apiCreateCreditPackage,
  apiUpdateCreditPackage,
} from '../../services/credit';
import { CreditPackageInfo, CreditPackageStatusEnum } from '../../types/credit';

interface CreditPackageFormModalProps {
  form: FormInstance;
  open: boolean;
  editItem: CreditPackageInfo | null;
  onSuccess?: () => void;
  onCancel: () => void;
}

/**
 * 新建、编辑积分套餐表单弹窗
 */
const CreditPackageFormModal: React.FC<CreditPackageFormModalProps> = ({
  form,
  open,
  editItem,
  onSuccess,
  onCancel,
}) => {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        name: editItem?.packageName,
        credits: editItem?.creditAmount,
        validityPeriod: editItem?.period,
        price: editItem?.price,
        enabled: editItem?.status === 1,
      });
    }
  }, [open, editItem, form]);

  // 确认保存
  const handleConfirm = async () => {
    const values = await form.validateFields();
    const payload: CreditPackageInfo = {
      ...(editItem?.id ? { id: editItem.id } : {}),
      packageName: values.name,
      creditAmount: values.credits,
      period: Number(values.validityPeriod),
      price: values.price,
      status: values.enabled
        ? CreditPackageStatusEnum.Enabled
        : CreditPackageStatusEnum.Disabled,
      sort: editItem?.sort,
      remark: editItem?.remark,
    };

    setSaving(true);
    try {
      if (editItem?.id) {
        await apiUpdateCreditPackage(payload);
        message.success(dict('PC.Common.Global.saveSuccess'));
      } else {
        await apiCreateCreditPackage(payload);
        message.success(dict('PC.Common.Global.createSuccess'));
      }
      onSuccess?.();
      onCancel();
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
        editItem
          ? dict('PC.Pages.SystemCreditPackages.editPackage')
          : dict('PC.Pages.SystemCreditPackages.createPackage')
      }
      open={open}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      loading={saving}
      width={560}
    >
      <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
        <Form.Item
          name="name"
          label={dict('PC.Pages.SystemCreditPackages.fieldName')}
          rules={[{ required: true }]}
        >
          <Input maxLength={30} showCount />
        </Form.Item>
        <Form.Item
          name="credits"
          label={dict('PC.Pages.SystemCreditPackages.fieldCredits')}
          rules={[{ required: true }]}
        >
          <InputNumber min={1} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="validityPeriod"
          label={dict('PC.Pages.SystemCreditPackages.fieldValidityPeriod')}
          rules={[{ required: true }]}
        >
          <Input
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
          <InputNumber min={0} precision={2} prefix="¥" className="w-full" />
        </Form.Item>
        <Form.Item
          name="enabled"
          label={dict('PC.Pages.SystemCreditPackages.fieldEnabled')}
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
        <Form.Item
          name="sort"
          label={dict('PC.Pages.SystemCreditPackages.fieldSort')}
        >
          <InputNumber min={1} precision={0} className="w-full" />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreditPackageFormModal;
