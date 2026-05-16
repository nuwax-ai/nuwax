import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { apiModelListSpace } from '@/services/modelConfig';
import { customizeRequiredMark } from '@/utils/form';
import type { FormInstance } from 'antd';
import { Button, Form, Input, InputNumber, Select, message } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  apiCreateModelPricing,
  apiDeleteModelPricing,
  apiUpdateModelPricing,
} from '../../../services/resource';
import type { ResourcePricingConfigInfo } from '../../../types/resource';
import styles from './index.less';

interface ModelOption {
  id: number;
  name: string;
}

/**
 * 模型定价弹窗属性。
 */
interface ModelPricingModalProps {
  /** 当前空间 ID，用于查询可用模型列表。 */
  spaceId: number;
  /**
   * 当前空间已配置定价的模型 ID（与列表 `targetId` 对应）。
   * 新增模式下下拉中会排除这些模型；编辑模式不受影响。
   */
  existingModelIds?: readonly number[];
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
 * 模型定价弹窗
 * 负责模型选择、价格档位编辑，以及新增/编辑提交
 */
const ModelPricingModal: React.FC<ModelPricingModalProps> = ({
  spaceId,
  existingModelIds = [],
  open,
  isEdit,
  editItem,
  form,
  onCancel,
  onSaved,
}) => {
  /**
   * 档位表单结构（编辑时 `contextLength` 可为 `null`，便于输入框清空后再输入）。
   */
  type ModelTierForm = {
    inputPrice: number;
    outputPrice: number;
    cachePrice: number;
    contextLength: number | null;
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
  const [saving, setSaving] = useState<boolean>(false);

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
    const excludedIds = new Set(existingModelIds);

    /** 仅在新增模式下加载可选模型，并排除已配置定价的模型。 */
    const fetchModelOptions = async () => {
      try {
        const result = await apiModelListSpace(spaceId);
        const options = (result?.data || [])
          .map((item) => ({
            id: Number(item.id),
            name: item.name,
          }))
          .filter(
            (item) => Number.isFinite(item.id) && !excludedIds.has(item.id),
          );
        setModelOptions(options);
      } catch (error) {
        setModelOptions([]);
      }
    };
    fetchModelOptions();
  }, [open, isEdit, spaceId, existingModelIds]);

  useEffect(() => {
    if (!open) {
      return;
    }
    // 编辑：回填模型与档位数据。
    if (editItem) {
      form.setFieldsValue({
        modelId: Number(editItem.targetId),
        name: editItem.targetObjectInfo?.name,
      });
      setTiers(editItem?.modelPriceTiers || []);
      return;
    }

    // 新增：重置表单并初始化默认档位。
    form.resetFields();
    setTiers([
      { contextLength: 32, inputPrice: 0, outputPrice: 0, cachePrice: 0 },
    ]);
  }, [open, editItem, form]);

  /** 选择模型后自动回填模型名称与接口协议。 */
  const handleModelChange = (modelId: number) => {
    const modelInfo = modelOptions.find((item) => item.id === modelId);
    if (!modelInfo) {
      return;
    }
    form.setFieldsValue({
      modelId: modelInfo.id,
      name: modelInfo.name,
    });
  };

  // 添加价格阶梯
  /** 新增一个默认档位。 */
  const addTier = () => {
    setTiers([
      ...tiers,
      { contextLength: 0, inputPrice: 0, outputPrice: 0, cachePrice: 0 },
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
    value: string | number | null,
  ) => {
    const next = [...tiers];
    next[index] = { ...next[index], [field]: value };
    setTiers(next);
  };

  /**
   * 解析档位上下文长度：须为正整数（>0）；否则返回 null。
   */
  const parsePositiveContextLength = (tier: ModelTierForm): number | null => {
    const v = tier.contextLength;
    if (v === null || v === undefined) {
      return null;
    }
    const n = Number(v);
    if (!Number.isFinite(n)) {
      return null;
    }
    const floored = Math.floor(n);
    return floored > 0 ? floored : null;
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

    // 校验上下文长度，必须为正整数（>0）。
    const resolvedContextLengths = tiers.map(parsePositiveContextLength);
    if (resolvedContextLengths.some((len) => len === null)) {
      message.error(
        dict('PC.Pages.SpaceResourcePricing.tierContextLengthInvalid'),
      );
      return;
    }

    // 校验上下文长度是否重复
    const contextLengths = resolvedContextLengths as number[];
    if (new Set(contextLengths).size !== contextLengths.length) {
      message.error(
        dict('PC.Pages.SpaceResourcePricing.tierContextLengthDuplicate'),
      );
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
          contextLength: tier.contextLength || 0,
          inputPrice: tier.inputPrice,
          outputPrice: tier.outputPrice,
          cachePrice: tier.cachePrice,
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
      classNames={{ body: styles['model-pricing-modal-body'] }}
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
      </Form>

      {/* 定价档位 */}
      <div className={styles['model-section']}>
        {/* 档位标题 */}
        <div className={styles['model-section-header']}>
          <span className={styles['model-section-title']}>
            {dict('PC.Pages.SpaceResourcePricing.pricingTier')}
            <span className={styles['model-section-hint']}>
              {dict('PC.Pages.SpaceResourcePricing.tierHint')}
            </span>
          </span>
          <Button size="small" onClick={addTier}>
            {dict('PC.Pages.SpaceResourcePricing.addTier')}
          </Button>
        </div>

        {/* 档位列表 */}
        {tiers.map((tier, index) => (
          <div key={index} className={styles['model-card']}>
            <div className={styles['model-card-header']}>
              <div className={styles['model-threshold']}>
                <span className={styles['model-threshold-prefix']}>≤</span>
                <InputNumber
                  value={tier.contextLength}
                  min={0}
                  max={100000000}
                  precision={0}
                  step={1}
                  size="small"
                  className={styles['model-threshold-input']}
                  onChange={(v) => updateTier(index, 'contextLength', v)}
                />
                <span className={styles['model-threshold-suffix']}>K</span>
              </div>
              {/* 删除档位 */}
              {tiers.length > 1 && (
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={() => removeTier(index)}
                  title={dict('PC.Pages.SpaceResourcePricing.removeTier')}
                >
                  ✕
                </Button>
              )}
            </div>
            <div className={styles['model-prices']}>
              <div className={styles['model-price-item']}>
                <span className={styles['model-price-label']}>
                  {dict('PC.Pages.SpaceResourcePricing.inputPriceLabel')}
                </span>
                <InputNumber
                  value={tier.inputPrice}
                  min={0}
                  max={100000000}
                  step={0.01}
                  precision={2}
                  size="small"
                  className={styles['model-price-input']}
                  onChange={(v) => updateTier(index, 'inputPrice', v || 0)}
                />
              </div>
              <div className={styles['model-price-item']}>
                <span className={styles['model-price-label']}>
                  {dict('PC.Pages.SpaceResourcePricing.outputPriceLabel')}
                </span>
                <InputNumber
                  value={tier.outputPrice}
                  min={0}
                  max={100000000}
                  step={0.01}
                  precision={2}
                  size="small"
                  className={styles['model-price-input']}
                  onChange={(v) => updateTier(index, 'outputPrice', v || 0)}
                />
              </div>
              <div className={styles['model-price-item']}>
                <span className={styles['model-price-label']}>
                  {dict('PC.Pages.SpaceResourcePricing.cachePriceLabel')}
                </span>
                <InputNumber
                  value={tier.cachePrice}
                  min={0}
                  max={100000000}
                  step={0.01}
                  precision={2}
                  size="small"
                  className={styles['model-price-input']}
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
