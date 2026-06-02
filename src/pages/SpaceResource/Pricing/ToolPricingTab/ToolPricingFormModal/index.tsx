import Created from '@/components/Created';
import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { AgentAddComponentStatusInfo } from '@/types/interfaces/agentConfig';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { TOOL_PRICING_TYPE_OPTIONS } from '@/utils/resourcePricing';
import { Form, Input, InputNumber, Select, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { TARGET_TYPE_LABEL_MAP } from '..';
import { apiUpdateToolPricing } from '../../../services/resource';
import {
  ResourcePricingConfigInfo,
  ResourcePricingStatus,
  ResourcePricingType,
  ToolPricingInfo,
  ToolPricingTargetType,
} from '../../../types/resource';
import styles from './index.less';

/** 表单弹窗 z-index（嵌套的 Created 需高于此值，否则列表弹层会被压住） */
const TOOL_PRICING_FORM_MODAL_Z = 1000;
const TOOL_CREATED_PICK_MODAL_Z = 1120;

interface ToolPricingFormModalProps {
  spaceId: number;
  open: boolean;
  /** 新建时必传插件/工作流/MCP；编辑时用 editItem.targetType */
  targetType: ToolPricingTargetType;
  editItem: ResourcePricingConfigInfo | null;
  /** 当前工具定价列表已占用的目标，传给 Created 做已添加状态 */
  pricedToolAddComponents: AgentAddComponentStatusInfo[];
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * 工具添加/编辑表单弹窗
 */
const ToolPricingFormModal: React.FC<ToolPricingFormModalProps> = ({
  spaceId,
  open,
  targetType,
  editItem,
  pricedToolAddComponents,
  onCancel,
  onSaved,
}) => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState<boolean>(false);
  const [createdOpen, setCreatedOpen] = useState<boolean>(false);
  const [selectedTool, setSelectedTool] = useState<CreatedNodeItem | null>(
    null,
  );

  // 获取添加工具的标签
  const getCreatedTagByTargetType = (
    type: ToolPricingTargetType,
  ): AgentComponentTypeEnum => {
    if (type === ToolPricingTargetType.PLUGIN) {
      return AgentComponentTypeEnum.Plugin;
    }
    if (type === ToolPricingTargetType.WORKFLOW) {
      return AgentComponentTypeEnum.Workflow;
    }
    return AgentComponentTypeEnum.MCP;
  };

  // 获取弹窗标题
  const getModalTitle = (type: ToolPricingTargetType | null) => {
    if (type === ToolPricingTargetType.PLUGIN) {
      return dict('PC.Pages.AgentArrangeConfig.addPlugin');
    }
    if (type === ToolPricingTargetType.WORKFLOW) {
      return dict('PC.Pages.AgentArrangeConfig.addWorkflow');
    }
    if (type === ToolPricingTargetType.MCP) {
      return dict('PC.Pages.AgentArrangeConfig.addMcp');
    }
    return dict('PC.Pages.SpaceResourcePricing.addTool');
  };

  useEffect(() => {
    if (!open || !targetType) {
      form.resetFields();
      setSelectedTool(null);
      return;
    }

    setSelectedTool(null);
    if (editItem) {
      form.setFieldsValue({
        targetId: String(editItem.targetId),
        description: editItem.targetObjectInfo?.description ?? '',
        price: editItem.price ?? 0,
        pricingType: editItem.pricingType ?? ResourcePricingType.ONE_TIME,
        status: editItem.status === ResourcePricingStatus.ENABLED,
      });
      return;
    }

    form.setFieldsValue({
      pricingType: ResourcePricingType.ONE_TIME,
      price: 0,
      status: true,
    });
  }, [open, editItem, targetType, form]);

  // 添加工具后回填工具名称与描述
  const handleCreatedAdded = (tool: CreatedNodeItem) => {
    setCreatedOpen(false);
    setSelectedTool(tool);
    form.setFieldsValue({
      targetId: String(tool.targetId),
      toolName: tool.name,
      description: tool.description,
    });
  };

  // 新增 / 编辑提交
  const handleSubmit = async () => {
    if (!targetType) {
      return;
    }
    const values = await form.validateFields();
    const payload: ToolPricingInfo = {
      ...(editItem || {}),
      targetType,
      targetId: String(values.targetId || ''),
      pricingType: values.pricingType || ResourcePricingType.ONE_TIME,
      price: Number(values.price || 0),
      status: values.status
        ? ResourcePricingStatus.ENABLED
        : ResourcePricingStatus.DISABLED,
      spaceId,
    };
    if (!payload.targetId) {
      message.warning(dict('PC.Pages.SpaceResourcePricing.selectTool'));
      return;
    }
    setSaving(true);
    try {
      await apiUpdateToolPricing(payload);
      message.success(
        editItem
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
    <>
      <CustomFormModal
        form={form}
        title={getModalTitle(targetType)}
        open={open}
        width={520}
        centered
        zIndex={TOOL_PRICING_FORM_MODAL_Z}
        loading={saving}
        onCancel={onCancel}
        onConfirm={handleSubmit}
        okText={
          editItem
            ? dict('PC.Common.Global.save')
            : dict('PC.Common.Global.confirm')
        }
      >
        <Form
          form={form}
          layout="vertical"
          requiredMark={customizeRequiredMark}
        >
          <Form.Item
            label={targetType ? TARGET_TYPE_LABEL_MAP[targetType] ?? '' : ''}
            required
          >
            <div
              onClick={() => setCreatedOpen(true)}
              className={`${styles['tool-pricing-tool-selector']} ${
                selectedTool || editItem
                  ? ''
                  : styles['tool-pricing-tool-selector-placeholder']
              } ${
                editItem ? styles['tool-pricing-tool-selector-readonly'] : ''
              }`}
            >
              {editItem?.targetObjectInfo?.name ||
                selectedTool?.name ||
                dict('PC.Pages.SpaceResourcePricing.selectTool')}
            </div>
          </Form.Item>

          {/* 工具ID，隐藏 */}
          <Form.Item name="targetId" hidden rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label={dict('PC.Pages.SpaceResourcePricing.description')}
          >
            <Input.TextArea
              disabled
              autoSize={{ minRows: 4, maxRows: 6 }}
              className="scroll-container"
            />
          </Form.Item>

          <div className={styles['tool-pricing-two-columns']}>
            <Form.Item
              name="price"
              label={dict('PC.Pages.SpaceResourcePricing.price')}
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                precision={2}
                step={0.01}
                max={100000000}
                className="w-full"
              />
            </Form.Item>
            <Form.Item
              name="pricingType"
              label={dict('PC.Pages.SpaceResourcePricing.period')}
              rules={[{ required: true }]}
            >
              <Select
                options={TOOL_PRICING_TYPE_OPTIONS.map((item) => ({
                  label: dict(item.labelKey),
                  value: item.value,
                }))}
              />
            </Form.Item>
          </div>

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
        </Form>
      </CustomFormModal>

      <Created
        open={createdOpen}
        // 只展示当前空间
        isSpaceOnly={true}
        modalZIndex={TOOL_CREATED_PICK_MODAL_Z}
        onCancel={() => setCreatedOpen(false)}
        checkTag={getCreatedTagByTargetType(targetType)}
        onAdded={handleCreatedAdded}
        addComponents={pricedToolAddComponents}
        tabs={[
          {
            label: TARGET_TYPE_LABEL_MAP[targetType] || '',
            key: getCreatedTagByTargetType(targetType),
          },
        ]}
      />
    </>
  );
};

export default ToolPricingFormModal;
