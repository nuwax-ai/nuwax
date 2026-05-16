import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Form, Switch, Tag, message } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import {
  apiDeleteToolPricing,
  apiListPricingConfig,
  apiUpdateToolPricing,
} from '../../services/resource';
import {
  ResourcePricingConfigInfo,
  ResourcePricingStatus,
  ResourcePricingType,
  ToolPricingTargetType,
} from '../../types/resource';
import ModelPricingModal from './ModelPricingModal';
import styles from './index.less';

// 定价类型标签映射
const PRICING_TYPE_LABEL_MAP: Record<ResourcePricingType, string> = {
  [ResourcePricingType.ONE_TIME]: '单次',
  [ResourcePricingType.BUYOUT]: '买断',
  [ResourcePricingType.MONTHLY]: '包月',
  [ResourcePricingType.TIERED]: '阶梯计费',
};

interface ModelPricingTabProps {
  spaceId: number;
  /** 将「添加模型」注册到上级页面工具栏右侧 */
  registerToolbarRight?: (node: React.ReactNode | null) => void;
}

/**
 * 模型定价模块
 */
const ModelPricingTab: React.FC<ModelPricingTabProps> = ({
  spaceId,
  registerToolbarRight,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<ResourcePricingConfigInfo | null>(
    null,
  );
  /** 列表中已配置定价的模型 ID，供新增弹窗下拉排除 */
  const [existingModelIds, setExistingModelIds] = useState<number[]>([]);
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();

  // 删除定价配置
  const { run: removePricingConfig } = useRequest(apiDeleteToolPricing, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Pages.SpaceResourcePricing.deleteSuccess'));
      actionRef.current?.reload();
    },
    onError: () => {
      message.error(dict('PC.Common.Global.operationFailed'));
    },
  });

  // 更新定价配置（切换收费状态）
  const { run: runUpdateToolPricing } = useRequest(apiUpdateToolPricing, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Common.Global.operationSuccess'));
      actionRef.current?.reload();
    },
    onError: () => {
      message.error(dict('PC.Common.Global.operationFailed'));
    },
  });

  /** 顶部「添加模型」触发（通过 ref 供工具栏挂载，避免过时闭包） */
  const openAddRef = useRef<() => void>(() => {});
  openAddRef.current = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!registerToolbarRight) return;
    registerToolbarRight(
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => openAddRef.current()}
      >
        {dict('PC.Pages.SpaceResourcePricing.addModel')}
      </Button>,
    );
    return () => registerToolbarRight(null);
  }, [registerToolbarRight]);

  // 编辑模型定价
  const openEdit = (item: ResourcePricingConfigInfo) => {
    setEditItem(item);
    setModalOpen(true);
  };

  // 获取模型定价列表；search 中「计费开关」对应 `status` 走 `/api/pricing/config/list` 过滤
  const request = async (params: {
    status?: ResourcePricingStatus | string | number;
    pageSize?: number;
    current?: number;
  }) => {
    const statusRaw = params.status;
    // 转换为数字类型
    let status: ResourcePricingStatus | undefined;
    if (statusRaw !== undefined && statusRaw !== null) {
      status = Number(statusRaw);
    }

    setLoading(true);
    const res = await apiListPricingConfig({
      targetType: ToolPricingTargetType.MODEL,
      spaceId,
      ...(status !== undefined ? { status } : {}),
    });
    setLoading(false);

    if (res.code !== SUCCESS_CODE) {
      message.error(
        res.message || dict('PC.Pages.SpaceResourcePricing.fetchDataFailed'),
      );
      return { data: [], total: 0, success: false };
    }

    const data = res.data || [];
    setExistingModelIds(
      data
        .map((item) => Number(item.targetId))
        .filter((id) => Number.isFinite(id)),
    );
    return {
      data,
      total: data.length,
      success: true,
    };
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
    runUpdateToolPricing({
      ...item,
      status: checked
        ? ResourcePricingStatus.ENABLED
        : ResourcePricingStatus.DISABLED,
    });
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
          ? PRICING_TYPE_LABEL_MAP[record.pricingType as ResourcePricingType] ||
            record.pricingType
          : '',
    },
    // 定价档位
    {
      title: dict('PC.Pages.SpaceResourcePricing.pricingTier'),
      key: 'tiers',
      search: false,
      render: (_, record) => (
        <div className={styles['model-tier-list']}>
          {/* 模型阶梯价格配置 */}
          {(record.modelPriceTiers || []).map((tier, index) => (
            <Tag key={index} className={styles['model-tier-item']}>
              {/* 上下文长度 */}
              <span className={styles['model-tier-context']}>
                {`≤${tier.contextLength}K`}
              </span>
              <span className={styles['model-tier-separator']}>|</span>
              {/* 输入价格 */}
              <span className={styles['model-tier-price']}>
                {dict('PC.Pages.SpaceResourcePricing.inputPriceLabel')}¥
                {tier.inputPrice}
              </span>
              <span className={styles['model-tier-separator']}>|</span>
              {/* 输出价格 */}
              <span className={styles['model-tier-price']}>
                {dict('PC.Pages.SpaceResourcePricing.outputPriceLabel')}¥
                {tier.outputPrice}
              </span>
              {/* 缓存价格 */}
              {tier.cachePrice > 0 && (
                <>
                  <span className={styles['model-tier-separator']}>|</span>
                  <span className={styles['model-tier-cache-price']}>
                    {dict('PC.Pages.SpaceResourcePricing.cachePriceLabel')}¥
                    {tier.cachePrice}
                  </span>
                </>
              )}
            </Tag>
          ))}
        </div>
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
              onClick: (row) => openEdit(row),
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
    <>
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

      {/* 模型定价弹窗 */}
      <ModelPricingModal
        spaceId={spaceId}
        existingModelIds={existingModelIds}
        open={modalOpen}
        isEdit={!!editItem}
        editItem={editItem}
        form={form}
        onCancel={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          actionRef.current?.reload();
        }}
      />
    </>
  );
};

export default ModelPricingTab;
