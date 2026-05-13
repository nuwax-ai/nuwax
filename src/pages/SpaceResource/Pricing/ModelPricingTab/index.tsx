import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { formatPrice } from '@/utils/format';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Form, Switch, Tag, message } from 'antd';
import React, { useRef, useState } from 'react';
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
import styles from '../index.less';
import ModelPricingModal from '../ModelPricingModal';

// 定价类型标签映射
const PRICING_TYPE_LABEL_MAP: Record<ResourcePricingType, string> = {
  [ResourcePricingType.ONE_TIME]: '单次',
  [ResourcePricingType.BUYOUT]: '买断',
  [ResourcePricingType.MONTHLY]: '包月',
  [ResourcePricingType.TIERED]: '阶梯计费',
};

interface ModelPricingTabProps {
  spaceId: number;
}

/**
 * 模型定价模块
 */
const ModelPricingTab: React.FC<ModelPricingTabProps> = ({ spaceId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<ResourcePricingConfigInfo | null>(
    null,
  );
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

  // 新增模型定价
  const openAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  // 编辑模型定价
  const openEdit = (item: ResourcePricingConfigInfo) => {
    setEditItem(item);
    setModalOpen(true);
  };

  // 获取模型定价列表
  const request = async () => {
    setLoading(true);
    const res = await apiListPricingConfig({
      targetType: ToolPricingTargetType.MODEL,
      spaceId,
    });
    setLoading(false);

    if (res.code !== SUCCESS_CODE) {
      message.error(
        res.message || dict('PC.Pages.SpaceResourcePricing.fetchDataFailed'),
      );
      return { data: [], total: 0, success: false };
    }

    const data = res.data || [];
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
      dataIndex: 'targetId',
      key: 'targetId',
      width: 200,
      fixed: 'left',
      search: false,
      render: (_, record) => record.targetId || '',
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.provider'),
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      search: false,
      render: (_, record) => record.targetObjectInfo?.name || '',
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.pricingType'),
      dataIndex: 'pricingType',
      key: 'pricingType',
      width: 120,
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
        <div className={styles.tierTags}>
          {/* 模型阶梯价格配置 */}
          {(record.modelPriceTiers || []).map((tier, index) => (
            <Tag key={index} className={styles.tierTag}>
              <span
                className={styles.tierTagContext}
              >{`≤${tier.contextLength}K`}</span>
              <span className={styles.tierTagSeparator}>|</span>
              <span className={styles.tierTagPriceItem}>
                {dict('PC.Pages.SpaceResourcePricing.inputPriceLabel')}¥
                {formatPrice(tier.inputPrice)}
              </span>
              <span className={styles.tierTagSeparator}>|</span>
              <span className={styles.tierTagPriceItem}>
                {dict('PC.Pages.SpaceResourcePricing.outputPriceLabel')}¥
                {formatPrice(tier.outputPrice)}
              </span>
              {/* 缓存价格 */}
              {tier.cachePrice > 0 ? (
                <>
                  <span className={styles.tierTagSeparator}>|</span>
                  <span className={styles.tierTagCachePrice}>
                    {dict('PC.Pages.SpaceResourcePricing.cachePriceLabel')}¥
                    {formatPrice(tier.cachePrice)}
                  </span>
                </>
              ) : (
                ''
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
      key: 'enabled',
      valueType: 'select',
      valueEnum: {
        [ResourcePricingStatus.ENABLED]: {
          text: '启用',
        },
        [ResourcePricingStatus.DISABLED]: {
          text: '禁用',
        },
      },
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Switch
          size="small"
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
      <div className={styles.tabHeader}>
        <h4 className={styles.tabTitle}>
          {dict('PC.Pages.SpaceResourcePricing.modelTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addModel')}
        </Button>
      </div>
      <XProTable<ResourcePricingConfigInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        loading={loading}
        pagination={false}
        request={request}
      />

      {/* 模型定价弹窗 */}
      <ModelPricingModal
        spaceId={spaceId}
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
