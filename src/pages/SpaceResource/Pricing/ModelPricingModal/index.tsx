import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { apiModelListSpace } from '@/services/modelConfig';
import type { ModelPriceTier } from '@/types/interfaces/subscription';
import { customizeRequiredMark } from '@/utils/form';
import type { FormInstance } from 'antd';
import { Button, Form, Input, InputNumber, Select, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  apiCreateModelPricing,
  apiDeleteModelPricing,
  apiUpdateModelPricing,
} from '../../services/resource';
import type { ResourcePricingConfigInfo } from '../../types/resource';
import styles from '../index.less';

interface ModelOption {
  id: number;
  name: string;
  provider: string;
}

/**
 * 模型定价弹窗属性。
 */
interface ModelPricingModalProps {
  /** 当前空间 ID，用于查询可用模型列表。 */
  spaceId: number;
  /** 弹窗是否显示。 */
  open: boolean;
  /** 是否编辑模式。 */
  isEdit: boolean;
  /** 当前编辑的定价配置，新增时为 null。 */
  editItem: ResourcePricingConfigInfo | null;
  /** 外部透传表单实例，便于父组件和弹窗共享表单状态。 */
  form: FormInstance;
  /** 关闭弹窗回调。 */
  onCancel: () => void;
  /** 保存成功回调，通常用于关闭弹窗并刷新列表。 */
  onSaved: () => void;
}

/**
 * 模型定价弹窗。
 * 负责模型选择、价格档位编辑，以及新增/编辑提交。
 */
const ModelPricingModal: React.FC<ModelPricingModalProps> = ({
  spaceId,
  open,
  isEdit,
  editItem,
  form,
  onCancel,
  onSaved,
}) => {
  /**
   * 档位表单结构。
   * 在基础档位信息上补充接口返回字段，便于编辑场景回填与更新。
   */
  type ModelTierForm = ModelPriceTier & {
    id?: number;
    modelId?: number;
    created?: string;
    modified?: string;
  };

  /** 模型档位编辑数据。 */
  const [tiers, setTiers] = useState<ModelTierForm[]>([]);
  /** 可选模型列表（弹窗内部加载）。 */
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([]);
  /** 保存按钮 loading 状态。 */
  const [saving, setSaving] = useState(false);

  /** 编辑场景下的原始档位 ID 列表，用于识别被删除档位。 */
  const originalTierIds = useMemo(
    () =>
      (editItem?.modelPriceTiers || [])
        .map((tier) => tier.id)
        .filter((id): id is number => !!id),
    [editItem],
  );

  useEffect(() => {
    if (!open || isEdit) {
      return;
    }
    /** 仅在新增模式下加载可选模型。 */
    const fetchModelOptions = async () => {
      try {
        const result = await apiModelListSpace(spaceId);
        const options = (result?.data || []).map((item) => ({
          id: Number(item.id),
          name: item.name,
          provider: item.apiProtocol || '-',
        }));
        setModelOptions(options.filter((item) => Number.isFinite(item.id)));
      } catch (error) {
        setModelOptions([]);
        message.error(dict('PC.Common.Global.operationFailed'));
      }
    };
    fetchModelOptions();
  }, [open, isEdit, spaceId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    // 编辑：回填模型与档位数据。
    if (editItem) {
      form.setFieldsValue({
        modelId: Number(editItem.targetId),
        name: editItem.targetObjectInfo?.name,
        provider: editItem.targetObjectInfo?.name || '-',
      });
      setTiers(
        (editItem.modelPriceTiers || []).map((tier) => ({
          ...tier,
          label: `≤${tier.contextLength}K`,
        })),
      );
      return;
    }

    // 新增：重置表单并初始化默认档位。
    form.resetFields();
    setTiers([
      { label: '≤32K', inputPrice: 0, outputPrice: 0, cachePrice: 0 },
      { label: '≤128K', inputPrice: 0, outputPrice: 0, cachePrice: 0 },
    ]);
  }, [open, editItem, form]);

  /** 从“≤32K”这类标签中提取上下文长度数值。 */
  const parseContextLength = (label: string): number => {
    const match = label.match(/\d+/);
    return Number(match?.[0] || 32);
  };

  /** 选择模型后自动回填模型名称与供应商。 */
  const handleModelChange = (modelId: number) => {
    const model = modelOptions.find((item) => item.id === modelId);
    if (!model) {
      return;
    }
    form.setFieldsValue({
      modelId: model.id,
      name: model.name,
      provider: model.provider,
    });
  };

  // 添加价格阶梯
  /** 新增一个默认档位。 */
  const addTier = () => {
    setTiers([
      ...tiers,
      { label: '≤32K', inputPrice: 0, outputPrice: 0, cachePrice: 0 },
    ]);
  };

  /** 删除指定档位。 */
  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  /** 更新档位字段。 */
  const updateTier = (
    index: number,
    field: keyof ModelTierForm,
    value: string | number,
  ) => {
    const next = [...tiers];
    if (field === 'label') {
      next[index] = { ...next[index], label: value as string };
    } else {
      next[index] = { ...next[index], [field]: value };
    }
    setTiers(next);
  };

  /**
   * 保存弹窗数据。
   * - 编辑模式：先处理删除档位，再按是否存在 ID 区分更新/新增。
   * - 新增模式：逐条创建档位。
   */
  const handleSave = async () => {
    const values = await form.validateFields();
    const modelId = Number(values.modelId);
    if (!modelId) {
      message.error(dict('PC.Common.Global.operationFailed'));
      return;
    }

    setSaving(true);
    try {
      if (editItem) {
        const currentTierIds = tiers
          .map((tier) => tier.id)
          .filter((id): id is number => !!id);
        // 删除档位
        const removedIds = originalTierIds.filter(
          (id) => !currentTierIds.includes(id),
        );
        if (removedIds.length) {
          await Promise.all(removedIds.map((id) => apiDeleteModelPricing(id)));
        }
      }

      for (const tier of tiers) {
        const payload = {
          id: tier.id,
          modelId,
          contextLength: parseContextLength(tier.label),
          inputPrice: tier.inputPrice,
          outputPrice: tier.outputPrice,
          cachePrice: tier.cachePrice,
          created: tier.created || '',
          modified: tier.modified || '',
        };
        // 更新档位
        if (tier.id) {
          await apiUpdateModelPricing(payload);
        } else {
          // 新增档位
          await apiCreateModelPricing(payload);
        }
      }

      message.success(
        isEdit
          ? dict('PC.Pages.SpaceResourcePricing.editSuccess')
          : dict('PC.Pages.SpaceResourcePricing.addSuccess'),
      );
      onSaved();
    } catch (error) {
      message.error(dict('PC.Common.Global.operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomFormModal
      title={
        isEdit
          ? dict('PC.Pages.SpaceResourcePricing.editModelPricing')
          : dict('PC.Pages.SpaceResourcePricing.addModelPricing')
      }
      open={open}
      form={form}
      loading={saving}
      onConfirm={handleSave}
      width={520}
      onCancel={onCancel}
      okText={
        isEdit
          ? dict('PC.Common.Global.save')
          : dict('PC.Common.Global.confirm')
      }
    >
      <Form form={form} layout="vertical" requiredMark={customizeRequiredMark}>
        <Form.Item name="modelId" hidden rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        {/* 模型名称 */}
        <Form.Item
          name="name"
          label={dict('PC.Pages.SpaceResourcePricing.modelName')}
          rules={[{ required: true }]}
        >
          {isEdit ? (
            <Input disabled />
          ) : (
            <Select
              placeholder={dict(
                'PC.Pages.SpaceResourcePricing.selectPlaceholder',
              )}
              onChange={(v) => handleModelChange(Number(v))}
            >
              {modelOptions.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {item.name}
                </Select.Option>
              ))}
            </Select>
          )}
        </Form.Item>
        {/* 供应商 */}
        <Form.Item
          name="provider"
          label={dict('PC.Pages.SpaceResourcePricing.provider')}
          rules={[{ required: true }]}
        >
          <Input disabled />
        </Form.Item>
      </Form>

      {/* 定价档位 */}
      <div className={styles.tierSection}>
        {/* 档位标题 */}
        <div className={styles.tierSectionHeader}>
          <span className={styles.tierSectionTitle}>
            {dict('PC.Pages.SpaceResourcePricing.pricingTier')}
            <span className={styles.tierSectionHint}>
              {dict('PC.Pages.SpaceResourcePricing.tierHint')}
            </span>
          </span>
          <Button size="small" onClick={addTier}>
            {dict('PC.Pages.SpaceResourcePricing.addTier')}
          </Button>
        </div>

        {/* 档位列表 */}
        {tiers.map((tier, index) => (
          <div key={index} className={styles.tierCard}>
            <div className={styles.tierCardHeader}>
              <div className={styles.tierThreshold}>
                <span className={styles.tierThresholdPrefix}>≤</span>
                <InputNumber
                  value={parseInt(tier.label.replace(/[^0-9]/g, ''), 10) || 32}
                  min={1}
                  precision={0}
                  size="small"
                  className={styles.tierThresholdInput}
                  onChange={(v) => updateTier(index, 'label', `≤${v || 32}K`)}
                />
                <span className={styles.tierThresholdSuffix}>K</span>
              </div>
              <Button
                type="text"
                danger
                size="small"
                onClick={() => removeTier(index)}
                title={dict('PC.Pages.SpaceResourcePricing.removeTier')}
              >
                ✕
              </Button>
            </div>
            <div className={styles.tierPrices}>
              <div className={styles.tierPriceItem}>
                <span className={styles.tierPriceLabel}>
                  {dict('PC.Pages.SpaceResourcePricing.inputPriceLabel')}
                </span>
                <InputNumber
                  value={tier.inputPrice}
                  min={0}
                  step={0.001}
                  precision={4}
                  size="small"
                  className={styles.tierPriceInput}
                  onChange={(v) => updateTier(index, 'inputPrice', v || 0)}
                />
              </div>
              <div className={styles.tierPriceItem}>
                <span className={styles.tierPriceLabel}>
                  {dict('PC.Pages.SpaceResourcePricing.outputPriceLabel')}
                </span>
                <InputNumber
                  value={tier.outputPrice}
                  min={0}
                  step={0.001}
                  precision={4}
                  size="small"
                  className={styles.tierPriceInput}
                  onChange={(v) => updateTier(index, 'outputPrice', v || 0)}
                />
              </div>
              <div className={styles.tierPriceItem}>
                <span className={styles.tierPriceLabel}>
                  {dict('PC.Pages.SpaceResourcePricing.cachePriceLabel')}
                </span>
                <InputNumber
                  value={tier.cachePrice}
                  min={0}
                  step={0.001}
                  precision={4}
                  size="small"
                  className={styles.tierPriceInput}
                  onChange={(v) => updateTier(index, 'cachePrice', v || 0)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </CustomFormModal>
  );
};

export default ModelPricingModal;
