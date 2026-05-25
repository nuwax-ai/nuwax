import ModelPriceTierList from '@/components/business-component/ModelPriceTierList';
import { TableActions, XProTable } from '@/components/ProComponents';
import {
  ResourcePricingConfigInfo,
  ResourcePricingStatus,
  ResourcePricingType,
} from '@/pages/SpaceResource/types/resource';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { getPricingTypeLabel } from '@/utils/resourcePricing';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Switch, message } from 'antd';
import React, { useState } from 'react';
import { useRequest } from 'umi';
import {
  apiSystemDeleteModelPricingConfig,
  apiSystemListPricingConfig,
  apiSystemModelPricingConfigSave,
} from '../services/resource';

interface ModelPricingTabProps {
  /** 表格操作 ref，供父组件在弹窗保存后刷新列表 */
  actionRef: React.MutableRefObject<ActionType | undefined>;
  /** 编辑定价配置 */
  onEdit: (item: ResourcePricingConfigInfo) => void;
  /** 列表加载后回传已配置定价的模型 ID，供新增弹窗排除 */
  onExistingModelIdsChange?: (ids: number[]) => void;
}

/**
 * 模型定价模块
 */
const ModelPricingTab: React.FC<ModelPricingTabProps> = ({
  actionRef,
  onEdit,
  onExistingModelIdsChange,
}) => {
  const [loading, setLoading] = useState<boolean>(false);

  // 删除定价配置
  const { run: removePricingConfig } = useRequest(
    apiSystemDeleteModelPricingConfig,
    {
      manual: true,
      onSuccess: () => {
        message.success(dict('PC.Pages.SpaceResourcePricing.deleteSuccess'));
        actionRef.current?.reload();
      },
    },
  );

  // 更新定价配置（切换收费状态）
  const { run: runUpdateToolPricing } = useRequest(
    apiSystemModelPricingConfigSave,
    {
      manual: true,
      onSuccess: () => {
        message.success(dict('PC.Common.Global.operationSuccess'));
        actionRef.current?.reload();
      },
    },
  );

  // 获取模型定价列表；search 中「计费开关」对应 `status` 走 `/api/pricing/config/list` 过滤
  const request = async (params: {
    status?: ResourcePricingStatus | string | number;
    pageSize?: number;
    current?: number;
  }) => {
    try {
      const statusRaw = params.status;
      // 转换为数字类型
      let status: ResourcePricingStatus | undefined;
      if (statusRaw !== undefined && statusRaw !== null) {
        status = Number(statusRaw);
      }

      setLoading(true);
      const res = await apiSystemListPricingConfig();
      setLoading(false);

      const data = (res.data || []).filter(
        (item) => status === undefined || item.status === status,
      );
      const modelIds = data
        .map((item) => Number(item.targetId))
        .filter((id) => Number.isFinite(id));
      onExistingModelIdsChange?.(modelIds);
      return {
        data,
        total: data.length,
        success: true,
      };
    } catch {
      setLoading(false);
      onExistingModelIdsChange?.([]);
      return { data: [], total: 0, success: false };
    }
  };

  // 删除模型定价
  const handleDelete = (item: ResourcePricingConfigInfo) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.targetObjectInfo?.name || '',
      () => removePricingConfig(item.id),
    );
  };

  /**
   * 切换模型定价状态（开启/关闭收费）
   */
  const handleToggleStatus = (
    item: ResourcePricingConfigInfo,
    checked: boolean,
  ) => {
    const data = {
      targetType: item.targetType,
      targetId: item.targetId,
      pricingType: item.pricingType,
      price: item.price,
      trialCount: item.trialCount,
      status: checked
        ? ResourcePricingStatus.ENABLED
        : ResourcePricingStatus.DISABLED,
    };
    runUpdateToolPricing(data);
  };

  // 模型定价列表列配置
  const columns: ProColumns<ResourcePricingConfigInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.modelName'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      search: false,
      render: (_, record) => record.targetObjectInfo?.name || '',
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.modelId'),
      dataIndex: 'targetId',
      key: 'targetId',
      width: 120,
      search: false,
      render: (_, record) => record.targetId || '',
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.pricingType'),
      dataIndex: 'pricingType',
      key: 'pricingType',
      width: 120,
      search: false,
      render: (_, record) =>
        record.pricingType
          ? getPricingTypeLabel(record.pricingType as ResourcePricingType)
          : '',
    },
    // 定价档位
    {
      title: dict('PC.Pages.SpaceResourcePricing.pricingTier'),
      key: 'tiers',
      search: false,
      render: (_, record) => (
        <ModelPriceTierList tiers={record.modelPriceTiers} />
      ),
    },
    // 计费开关
    {
      title: dict('PC.Pages.SpaceResourcePricing.billingSwitch'),
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      valueEnum: {
        [ResourcePricingStatus.ENABLED]: {
          text: dict('PC.Common.Global.enable'),
        },
        [ResourcePricingStatus.DISABLED]: {
          text: dict('PC.Common.Global.disable'),
        },
      },
      fieldProps: {
        allowClear: true,
      },
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Switch
          checked={record.status === ResourcePricingStatus.ENABLED}
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              onClick: (row) => onEdit(row),
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              onClick: (row) => handleDelete(row),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <XProTable<ResourcePricingConfigInfo>
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      loading={loading}
      pagination={false}
      request={request}
      toolBarRender={false}
      scroll={{ x: 'max-content' }}
    />
  );
};

export default ModelPricingTab;
