import Created from '@/components/Created';
import CustomFormModal from '@/components/CustomFormModal';
import { dict } from '@/services/i18nRuntime';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { CreatedNodeItem } from '@/types/interfaces/common';
import { customizeRequiredMark } from '@/utils/form';
import { Form, Input, InputNumber, Select, Switch, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { TARGET_TYPE_LABEL_MAP } from '..';
import { apiUpdateToolPricing } from '../../../services/resource';
import {
  ResourcePricingStatus,
  ResourcePricingType,
  ToolPricingInfo,
  ToolPricingTargetType,
} from '../../../types/resource';
import styles from '../../index.less';

interface ToolPricingFormModalProps {
  spaceId: number;
  open: boolean;
  targetType: ToolPricingTargetType;
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

  // // 获取工具类型标签
  // const getTargetTypeLabel = (type: ToolPricingTargetType | null) => {
  //   if (type === ToolPricingTargetType.PLUGIN) {
  //     return dict('PC.Pages.SpaceResourcePricing.categoryPlugin');
  //   }
  //   if (type === ToolPricingTargetType.WORKFLOW) {
  //     return dict('PC.Pages.SpaceResourcePricing.categoryWorkflow');
  //   }
  //   if (type === ToolPricingTargetType.MCP) {
  //     return dict('PC.Pages.SpaceResourcePricing.categoryMCP');
  //   }
  //   return '-';
  // };

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
    form.setFieldsValue({
      pricingType: ResourcePricingType.ONE_TIME,
      price: 0,
      trialCount: 0,
      status: true,
    });
  }, [open, targetType, form]);

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

  // 添加工具
  const handleSubmit = async () => {
    if (!targetType) {
      return;
    }
    const values = await form.validateFields();
    const payload: ToolPricingInfo = {
      targetType,
      targetId: String(values.targetId || ''),
      pricingType: values.pricingType || ResourcePricingType.ONE_TIME,
      price: Number(values.price || 0),
      trialCount: Number(values.trialCount || 0),
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
      message.success(dict('PC.Pages.SpaceResourcePricing.addSuccess'));
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
        open={open && !!targetType}
        width={520}
        centered
        loading={saving}
        onCancel={onCancel}
        onConfirm={handleSubmit}
        okText={dict('PC.Common.Global.confirm')}
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
              className={`${styles.toolSelector} ${
                selectedTool ? '' : styles.toolSelectorPlaceholder
              }`}
            >
              {selectedTool?.name ||
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

          <div className={styles.toolFormTwoColumns}>
            <Form.Item
              name="price"
              label={dict('PC.Pages.SpaceResourcePricing.price')}
              rules={[{ required: true }]}
            >
              <InputNumber
                min={0}
                precision={2}
                max={100000000}
                className="w-full"
              />
            </Form.Item>
            <Form.Item
              name="pricingType"
              label={dict('PC.Pages.SpaceResourcePricing.period')}
            >
              <Select
                options={[
                  {
                    label: dict('PC.Pages.SpaceResourcePricing.periodOnce'),
                    value: ResourcePricingType.ONE_TIME,
                  },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="trialCount"
            label={dict('PC.Pages.SpaceResourcePricing.trialCount')}
          >
            <InputNumber
              min={0}
              precision={0}
              max={100000000}
              className="w-full"
            />
          </Form.Item>

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

      {targetType && (
        <Created
          open={createdOpen}
          onCancel={() => setCreatedOpen(false)}
          checkTag={getCreatedTagByTargetType(targetType)}
          onAdded={handleCreatedAdded}
          tabs={[
            {
              label: TARGET_TYPE_LABEL_MAP[targetType] || '',
              key: getCreatedTagByTargetType(targetType),
            },
          ]}
        />
      )}
    </>
  );
};

export default ToolPricingFormModal;
