import { TableActions, XProTable } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Switch, Tag, message } from 'antd';
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
import styles from './index.less';
import SkillPricingFormModal from './SkillPricingFormModal';

interface SkillPricingTabProps {
  spaceId: number;
  /** 将「添加技能」注册到上级页面工具栏右侧 */
  registerToolbarRight?: (node: React.ReactNode | null) => void;
}

/**
 * 技能定价模块
 */
const SkillPricingTab: React.FC<SkillPricingTabProps> = ({
  spaceId,
  registerToolbarRight,
}) => {
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
  });

  /** 顶部「添加技能」 */
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
        {dict('PC.Pages.SpaceResourcePricing.addSkill')}
      </Button>,
    );
    return () => registerToolbarRight(null);
  }, [registerToolbarRight]);

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

  // 切换本条配置的计费开关（启用/禁用）
  const handleToggleStatus = (
    row: ResourcePricingConfigInfo,
    checked: boolean,
  ) => {
    runUpdateToolPricing({
      ...row,
      spaceId: row.spaceId ?? spaceId,
      status: checked
        ? ResourcePricingStatus.ENABLED
        : ResourcePricingStatus.DISABLED,
    });
  };

  // 请求定价配置列表；search：`status`、`pricingType`（仅包月 / 买断）传入列表接口
  const request = async (params: {
    status?: ResourcePricingStatus | string | number;
    pricingType?: ResourcePricingType | string;
    pageSize?: number;
    current?: number;
  }) => {
    try {
      const statusRaw = params.status;
      // 状态
      let status: ResourcePricingStatus | undefined;
      if (statusRaw !== undefined && statusRaw !== null) {
        status = Number(statusRaw);
      }

      // 定价类型
      const ptRaw = params.pricingType;
      const pricingType = ptRaw ? (ptRaw as ResourcePricingType) : undefined;

      setLoading(true);
      const res = await apiListPricingConfig({
        targetType: ToolPricingTargetType.SKILL,
        spaceId,
        ...(status !== undefined ? { status } : {}),
        ...(pricingType ? { pricingType } : {}),
      });
      setLoading(false);

      const data = res.data || [];
      return {
        data,
        total: data.length,
        success: true,
      };
    } catch {
      setLoading(false);
      return { data: [], total: 0, success: false };
    }
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
      valueType: 'select',
      valueEnum: {
        [ResourcePricingType.MONTHLY]: {
          text: dict('PC.Pages.SpaceResourcePricing.pricingModeMonthly'),
        },
        [ResourcePricingType.BUYOUT]: {
          text: dict('PC.Pages.SpaceResourcePricing.pricingModeBuyout'),
        },
      },
      fieldProps: {
        allowClear: true,
        placeholder: dict('PC.Pages.SpaceResourcePricing.selectPlaceholder'),
      },
      width: 100,
      render: (_, record) => {
        const pt = record.pricingType;
        if (pt === ResourcePricingType.MONTHLY) {
          return dict('PC.Pages.SpaceResourcePricing.pricingModeMonthly');
        }
        if (pt === ResourcePricingType.BUYOUT) {
          return dict('PC.Pages.SpaceResourcePricing.pricingModeBuyout');
        }
        return pt || '-';
      },
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.price'),
      dataIndex: 'price',
      key: 'price',
      width: 160,
      search: false,
      render: (_, record) => (
        <span>
          <span className={styles['skill-pricing-bold-value']}>
            ¥{record.price || 0}
          </span>
          {record.pricingType === ResourcePricingType.MONTHLY && (
            <span className={styles['skill-pricing-muted']}>
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
      width: 100,
      align: 'center',
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
