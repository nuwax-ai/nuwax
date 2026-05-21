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
import type { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, InputNumber, Radio, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

interface SkillPricingFormModalProps {
  spaceId: number;
  open: boolean;
  editItem: ResourcePricingConfigInfo | null;
  /** 当前技能定价列表已占用的技能，传给 Created 做已添加状态 */
  pricedSkillAddComponents: AgentAddComponentStatusInfo[];
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
  pricedSkillAddComponents,
  onCancel,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const watchedSkillName = Form.useWatch('skillName', form);
  const [saving, setSaving] = useState<boolean>(false);

  // 添加技能弹窗是否打开
  const [createdOpen, setCreatedOpen] = useState<boolean>(false);
  // 选中的技能
  const [selectedSkill, setSelectedSkill] = useState<CreatedNodeItem | null>(
    null,
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }
    setSelectedSkill(null);

    if (editItem) {
      form.setFieldsValue({
        skillName: editItem.targetObjectInfo?.name,
        skillId: editItem.targetId,
        pricingType: editItem.pricingType || ResourcePricingType.BUYOUT,
        description: editItem.targetObjectInfo?.description,
        price: editItem.price || 0,
        status: editItem.status === ResourcePricingStatus.ENABLED,
      });
    } else {
      form.setFieldsValue({
        pricingType: ResourcePricingType.BUYOUT,
        status: true,
      });
    }
  }, [open, editItem, form]);

  // 创建技能后回填名称与描述
  const handleCreatedAdded = (skill: CreatedNodeItem) => {
    setCreatedOpen(false);
    setSelectedSkill(skill);
    form.setFieldsValue({
      skillName: skill.name,
      skillId: skill.targetId,
      description: skill.description,
    });
  };

  // 提交表单
  const handleSubmit = async () => {
    const values = await form.validateFields();
    const { skillId, price, status, pricingType } = values;
    if (!skillId) {
      message.warning('请选择技能');
      return;
    }

    setSaving(true);
    try {
      const statusValue = status
        ? ResourcePricingStatus.ENABLED
        : ResourcePricingStatus.DISABLED;
      await apiUpdateToolPricing({
        targetType: ToolPricingTargetType.SKILL,
        targetId: skillId,
        pricingType,
        price,
        status: statusValue,
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
      classNames={{ body: styles['skill-pricing-modal-body'] }}
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
        <Form.Item
          name="skillName"
          label={dict('PC.Pages.SpaceResourcePricing.skillName')}
          required
        >
          {editItem ? (
            <Input disabled />
          ) : (
            <div
              onClick={() => setCreatedOpen(true)}
              className={`${styles['skill-selector']} ${
                selectedSkill || watchedSkillName
                  ? ''
                  : styles['skill-selector-placeholder']
              }`}
            >
              {selectedSkill?.name ||
                watchedSkillName ||
                dict('PC.Pages.SpaceResourcePricing.selectPlaceholder')}
            </div>
          )}
        </Form.Item>

        {/* 定价对象ID, 隐藏 */}
        <Form.Item name="skillId" hidden rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        {/* 描述 */}
        <Form.Item
          name="description"
          label={dict('PC.Pages.SpaceResourcePricing.description')}
        >
          <Input.TextArea
            className="scroll-container"
            disabled
            autoSize={{ minRows: 4, maxRows: 6 }}
          />
        </Form.Item>

        {/* 定价模式 */}
        <Form.Item
          name="pricingType"
          label={dict('PC.Pages.SpaceResourcePricing.pricingMode')}
          tooltip={
            <>
              <div>{dict('PC.Pages.SpaceResourcePricing.buyoutHint')}</div>
              <div>{dict('PC.Pages.SpaceResourcePricing.monthlyHint')}</div>
            </>
          }
        >
          <Radio.Group
            className={styles['pricing-model-radio']}
            options={SKILL_PRICING_MODE_OPTIONS}
          />
        </Form.Item>

        <div className={styles['form-two-columns']}>
          {/* 价格 */}
          <Form.Item
            name="price"
            label={dict('PC.Pages.SpaceResourcePricing.price')}
            rules={[{ required: true }]}
          >
            <InputNumber
              min={0}
              max={100000000}
              step={0.01}
              precision={2}
              className="w-full"
              prefix="¥"
              placeholder={dict(
                'PC.Pages.SpaceResourcePricing.pricePlaceholder',
              )}
            />
          </Form.Item>
          {/* 开启收费 */}
          <Form.Item
            name="status"
            label={dict('PC.Pages.SpaceResourcePricing.billingSwitch')}
            valuePropName="checked"
          >
            <Switch
              checkedChildren={dict('PC.Common.Global.enable')}
              unCheckedChildren={dict('PC.Common.Global.disable')}
            />
          </Form.Item>
        </div>
      </Form>

      {/* 添加技能弹窗 */}
      {!editItem && (
        <Created
          showMoreMenus={false}
          open={createdOpen}
          // 只展示当前空间
          isSpaceOnly={true}
          onCancel={() => setCreatedOpen(false)}
          checkTag={AgentComponentTypeEnum.Skill}
          onAdded={handleCreatedAdded}
          addComponents={pricedSkillAddComponents}
          tabs={[{ label: '技能', key: AgentComponentTypeEnum.Skill }]}
        />
      )}
    </CustomFormModal>
  );
};

export default SkillPricingFormModal;
