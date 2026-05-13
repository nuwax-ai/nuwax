import Created from '@/components/Created';
import CustomFormModal from '@/components/CustomFormModal';
import { apiUpdateToolPricing } from '@/pages/SpaceResource/services/resource';
import {
  ResourcePricingConfigInfo,
  ResourcePricingStatus,
  ResourcePricingType,
  ToolPricingTargetType,
} from '@/pages/SpaceResource/types/resource';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, InputNumber, Radio, message } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

interface SkillPricingFormModalProps {
  spaceId: number;
  open: boolean;
  editItem: ResourcePricingConfigInfo | null;
  onCancel: () => void;
  onSaved: () => void;
}

// 技能定价模式选项
const SKILL_PRICING_MODE_OPTIONS = [
  {
    value: ResourcePricingType.BUYOUT,
    label: dict('PC.Pages.SpaceResourcePricing.pricingModeBuyout'),
  },
  {
    value: ResourcePricingType.MONTHLY,
    label: dict('PC.Pages.SpaceResourcePricing.pricingModeMonthly'),
  },
];

/**
 * 添加或更新技能定价弹窗
 */
const SkillPricingFormModal: React.FC<SkillPricingFormModalProps> = ({
  spaceId,
  open,
  editItem,
  onCancel,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState<boolean>(false);
  const [pricingType, setPricingType] = useState<ResourcePricingType>(
    ResourcePricingType.BUYOUT,
  );

  // 添加技能弹窗是否打开
  const [createdOpen, setCreatedOpen] = useState<boolean>(false);
  // 选中的技能
  const [selectedSkill, setSelectedSkill] = useState<CreatedNodeItem | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    if (editItem) {
      setSelectedSkill(null);
      setPricingType(
        editItem.pricingType === ResourcePricingType.MONTHLY
          ? ResourcePricingType.MONTHLY
          : ResourcePricingType.BUYOUT,
      );
      form.setFieldsValue({
        skillName: editItem.targetObjectInfo?.name || '',
        // category: editItem.targetObjectInfo?.category || 'text',
        description: editItem.targetObjectInfo?.description || '',
        price: editItem.price || 0,
      });
      return;
    }
    setPricingType(ResourcePricingType.BUYOUT);
    setSelectedSkill(null);
    form.resetFields();
  }, [open, editItem, form]);

  // 创建技能后回填名称、分类与描述
  const handleCreatedAdded = (skill: CreatedNodeItem) => {
    setCreatedOpen(false);
    setSelectedSkill(skill);
    form.setFieldsValue({
      skillId: skill.targetId,
      category: skill.category,
      description: skill.description,
    });
  };

  // 提交表单
  const handleSubmit = async () => {
    const values = await form.validateFields();
    const targetId = editItem?.targetId || String(values.skillId || '');
    if (!targetId) {
      message.error('请选择技能');
      return;
    }

    setSaving(true);
    try {
      await apiUpdateToolPricing({
        targetType: ToolPricingTargetType.SKILL,
        targetId: String(targetId),
        pricingType,
        price: Number(values.price || 0),
        trialCount: editItem?.trialCount || 0,
        status: editItem?.status ?? ResourcePricingStatus.ENABLED,
        spaceId,
      });
      message.success(
        editItem
          ? dict('PC.Pages.SpaceResourcePricing.editSuccess')
          : dict('PC.Pages.SpaceResourcePricing.addSuccess'),
      );
      onSaved();
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomFormModal
      form={form}
      title={
        editItem
          ? dict('PC.Pages.SpaceResourcePricing.editSkill')
          : dict('PC.Pages.SpaceResourcePricing.addSkill')
      }
      open={open}
      width={520}
      centered
      loading={saving}
      onCancel={onCancel}
      onConfirm={handleSubmit}
      okText={
        editItem
          ? dict('PC.Common.Global.save')
          : dict('PC.Common.Global.confirm')
      }
    >
      <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
        {editItem ? (
          <Form.Item
            label={dict('PC.Pages.SpaceResourcePricing.skillName')}
            name="skillName"
            rules={[{ required: true }]}
          >
            <Input disabled />
          </Form.Item>
        ) : (
          <>
            <Form.Item
              label={dict('PC.Pages.SpaceResourcePricing.skillName')}
              required
            >
              <div
                onClick={() => setCreatedOpen(true)}
                style={{
                  height: 36,
                  border: '1px solid #d9d9d9',
                  borderRadius: 8,
                  padding: '0 11px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: selectedSkill ? 'rgba(0,0,0,0.88)' : 'rgba(0,0,0,0.4)',
                }}
              >
                {selectedSkill?.name ||
                  dict('PC.Pages.SpaceResourcePricing.selectPlaceholder')}
              </div>
            </Form.Item>
            <Form.Item name="skillId" hidden rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </>
        )}

        {/* 分类 */}
        <Form.Item
          name="category"
          label={dict('PC.Pages.SpaceResourcePricing.category')}
        >
          <Input disabled />
        </Form.Item>

        {/* 描述 */}
        <Form.Item
          name="description"
          label={dict('PC.Pages.SpaceResourcePricing.description')}
        >
          <Input.TextArea disabled autoSize={{ minRows: 4, maxRows: 6 }} />
        </Form.Item>

        {/* 定价模式 */}
        <Form.Item
          label={dict('PC.Pages.SpaceResourcePricing.pricingMode')}
          required
        >
          <Radio.Group
            value={pricingType}
            onChange={(e) => setPricingType(e.target.value)}
            className={styles.pricingModelRadio}
            options={SKILL_PRICING_MODE_OPTIONS}
          />
          <div className={styles.pricingModeHint}>
            {pricingType === ResourcePricingType.BUYOUT
              ? dict('PC.Pages.SpaceResourcePricing.buyoutHint')
              : dict('PC.Pages.SpaceResourcePricing.monthlyHint')}
          </div>
        </Form.Item>

        {/* 价格 */}
        <Form.Item
          name="price"
          label={dict('PC.Pages.SpaceResourcePricing.price')}
          rules={[{ required: true }]}
        >
          <InputNumber
            min={0}
            max={1000000}
            precision={2}
            className="w-full"
            prefix="¥"
            placeholder={dict('PC.Pages.SpaceResourcePricing.pricePlaceholder')}
          />
        </Form.Item>
      </Form>

      {/* 添加技能弹窗 */}
      {!editItem && (
        <Created
          open={createdOpen}
          onCancel={() => setCreatedOpen(false)}
          checkTag={AgentComponentTypeEnum.Skill}
          onAdded={handleCreatedAdded}
          tabs={[{ label: '技能', key: AgentComponentTypeEnum.Skill }]}
        />
      )}
    </CustomFormModal>
  );
};

export default SkillPricingFormModal;
