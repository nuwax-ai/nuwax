import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import {
  apiCreatePricingPlan,
  apiUpdatePricingPlan,
} from '@/services/subscriptionService';
import type { PricingPlanInfo } from '@/types/interfaces/subscription';
import { PricingCycleEnum } from '@/types/interfaces/subscription';
import { Form, Input, InputNumber, Select } from 'antd';
import React, { useEffect, useMemo } from 'react';

interface Props {
  open: boolean;
  spaceId: number;
  editData?: PricingPlanInfo | null;
  onCancel: () => void;
  onConfirm: () => void;
}

const CreatePricingPlanModal: React.FC<Props> = ({
  open,
  spaceId,
  editData,
  onCancel,
  onConfirm,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!editData;

  const cycleOptions = useMemo(
    () => [
      {
        value: PricingCycleEnum.Monthly,
        label: dict('PC.Pages.SpaceResourcePricing.cycleMonthly'),
      },
      {
        value: PricingCycleEnum.Quarterly,
        label: dict('PC.Pages.SpaceResourcePricing.cycleQuarterly'),
      },
      {
        value: PricingCycleEnum.Yearly,
        label: dict('PC.Pages.SpaceResourcePricing.cycleYearly'),
      },
    ],
    [],
  );

  useEffect(() => {
    if (open) {
      if (editData) {
        form.setFieldsValue({
          name: editData.name,
          description: editData.description,
          price: editData.price,
          cycle: editData.cycle,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, editData]);

  const handleConfirm = async () => {
    await form.validateFields();
    const values = form.getFieldsValue();
    if (isEdit && editData) {
      await apiUpdatePricingPlan(editData.id, { ...values, spaceId });
    } else {
      await apiCreatePricingPlan({ ...values, spaceId, enabled: true });
    }
    onConfirm();
  };

  return (
    <CustomFormModal
      form={form}
      title={
        isEdit
          ? dict('PC.Pages.SpaceResourcePricing.editPlan')
          : dict('PC.Pages.SpaceResourcePricing.createPlan')
      }
      open={open}
      centered
      width={480}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label={dict('PC.Pages.SpaceResourcePricing.planName')}
          rules={[{ required: true }]}
        >
          <Input maxLength={50} />
        </Form.Item>
        <Form.Item
          name="description"
          label={dict('PC.Pages.SpaceResourcePricing.planDesc')}
        >
          <Input.TextArea rows={3} maxLength={200} showCount />
        </Form.Item>
        <Form.Item
          name="price"
          label={dict('PC.Pages.SpaceResourcePricing.planPrice')}
          rules={[{ required: true }]}
        >
          <InputNumber
            min={0}
            precision={2}
            prefix={dict('PC.Common.Global.currencySymbol')}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item
          name="cycle"
          label={dict('PC.Pages.SpaceResourcePricing.planCycle')}
          rules={[{ required: true }]}
          initialValue={PricingCycleEnum.Monthly}
        >
          <Select options={cycleOptions} />
        </Form.Item>
      </Form>
    </CustomFormModal>
  );
};

export default CreatePricingPlanModal;
