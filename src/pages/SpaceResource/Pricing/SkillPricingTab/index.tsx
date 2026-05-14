import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { formatPrice } from '@/utils/format';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Switch, Tag, message } from 'antd';
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
import SkillPricingFormModal from './SkillPricingFormModal';

interface SkillPricingTabProps {
  spaceId: number;
}

/**
 * 技能定价模块
 */
const SkillPricingTab: React.FC<SkillPricingTabProps> = ({ spaceId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editItem, setEditItem] = useState<ResourcePricingConfigInfo | null>(
    null,
  );
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

  // 创建或更新定价配置
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

  // 添加技能
  const openAdd = () => {
    setEditItem(null);
    setModalOpen(true);
  };

  // 编辑技能
  const openEdit = (item: ResourcePricingConfigInfo) => {
    setEditItem(item);
    setModalOpen(true);
  };

  // 删除技能
  const handleDelete = (item: ResourcePricingConfigInfo) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.targetObjectInfo?.name || '',
      () => removePricingConfig(item.id),
    );
  };

  // 切换定价配置状态
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

  // 请求定价配置列表
  const request = async () => {
    setLoading(true);
    const res = await apiListPricingConfig({
      targetType: ToolPricingTargetType.SKILL,
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

  // 表格列配置
  const columns: ProColumns<ResourcePricingConfigInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.skillName'),
      dataIndex: 'name',
      key: 'name',
      width: 180,
      search: false,
      render: (_, record) => record.targetObjectInfo?.name || '-',
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.pricingType'),
      dataIndex: 'pricingType',
      key: 'pricingType',
      width: 90,
      render: (_, record) => record.pricingType || '-',
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.trialCount'),
      dataIndex: 'trialCount',
      key: 'trialCount',
      width: 100,
      align: 'center',
      search: false,
      render: (v) => (
        <span className={styles.boldValue}>{(v as number) || 0}</span>
      ),
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.price'),
      dataIndex: 'price',
      key: 'price',
      width: 160,
      search: false,
      render: (_, record) => (
        <span>
          <span className={styles.boldValue}>
            ¥{formatPrice(record.price || 0)}
          </span>
          {record.pricingType === ResourcePricingType.MONTHLY && (
            <span className={styles.muted}>
              /{dict('PC.Pages.SpaceAgentSubscriptions.cycleMonthly')}
            </span>
          )}
          <Tag
            color={
              record.pricingType === ResourcePricingType.MONTHLY
                ? 'cyan'
                : 'orange'
            }
            style={{ marginLeft: 6 }}
          >
            {record.pricingType === ResourcePricingType.MONTHLY
              ? dict('PC.Pages.SpaceResourcePricing.pricingModeMonthly')
              : dict('PC.Pages.SpaceResourcePricing.pricingModeBuyout')}
          </Tag>
        </span>
      ),
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.billingSwitch'),
      key: 'enabled',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Switch
          checked={record.status === ResourcePricingStatus.ENABLED}
          onChange={(v) => handleToggleStatus(record, v)}
        />
      ),
    },
    {
      title: dict('PC.Common.Global.action'),
      key: 'action',
      width: 120,
      align: 'center',
      search: false,
      fixed: 'right',
      render: (_, record) => (
        <TableActions
          record={record}
          actions={[
            {
              key: 'edit',
              label: dict('PC.Common.Global.edit'),
              onClick: (r) => openEdit(r),
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              onClick: (r) => handleDelete(r),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <div className={styles.tabHeader}>
        <h4 className={styles.tabTitle}>
          {dict('PC.Pages.SpaceResourcePricing.skillTitle')}
        </h4>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          {dict('PC.Pages.SpaceResourcePricing.addSkill')}
        </Button>
      </div>
      <XProTable<ResourcePricingConfigInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        loading={loading}
        pagination={false}
      />

      {/* 技能定价弹窗 */}
      <SkillPricingFormModal
        spaceId={spaceId}
        open={modalOpen}
        editItem={editItem}
        onCancel={() => setModalOpen(false)}
        onSaved={() => actionRef.current?.reload()}
      />
    </div>
  );
};

export default SkillPricingTab;
