import CustomPopover from '@/components/CustomPopover';
import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Input, Switch, message } from 'antd';
import React, { useRef, useState } from 'react';
import { apiListPricingConfig } from '../../services/resource';
import {
  ResourcePricingConfigInfo,
  ResourcePricingStatus,
  ToolPricingTargetType,
} from '../../types/resource';
import pricingStyles from '../index.less';
import styles from './index.less';
import ToolPricingFormModal from './ToolPricingFormModal';

// 工具类型标签映射
export const TARGET_TYPE_LABEL_MAP: Partial<
  Record<ToolPricingTargetType, string>
> = {
  [ToolPricingTargetType.PLUGIN]: dict(
    'PC.Pages.SpaceResourcePricing.categoryPlugin',
  ),
  [ToolPricingTargetType.WORKFLOW]: dict(
    'PC.Pages.SpaceResourcePricing.categoryWorkflow',
  ),
  [ToolPricingTargetType.MCP]: dict(
    'PC.Pages.SpaceResourcePricing.categoryMCP',
  ),
};

// 添加工具列表
const ADD_TOOL_LIST: CustomPopoverItem[] = [
  {
    value: ToolPricingTargetType.PLUGIN,
    label: dict('PC.Pages.SpaceResourcePricing.categoryPlugin'),
  },
  {
    value: ToolPricingTargetType.WORKFLOW,
    label: dict('PC.Pages.SpaceResourcePricing.categoryWorkflow'),
  },
  {
    value: ToolPricingTargetType.MCP,
    label: dict('PC.Pages.SpaceResourcePricing.categoryMCP'),
  },
];

interface ToolPricingTabProps {
  spaceId: number;
}

/**
 * 工具定价模块
 */
const ToolPricingTab: React.FC<ToolPricingTabProps> = ({ spaceId }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [toolModalOpen, setToolModalOpen] = useState<boolean>(false);
  const [creatingTargetType, setCreatingTargetType] =
    useState<ToolPricingTargetType | null>(null);
  const actionRef = useRef<ActionType>();

  const handleClickAddToolType = (item: CustomPopoverItem) => {
    const targetType = item.value as ToolPricingTargetType;
    setCreatingTargetType(targetType);
    setToolModalOpen(true);
  };

  const columns: ProColumns<ResourcePricingConfigInfo>[] = [
    {
      title: dict('PC.Pages.SpaceResourcePricing.name'),
      dataIndex: ['targetObjectInfo', 'name'],
      key: 'name',
      width: 280,
      ellipsis: false,
      search: false,
      render: (_, record) => {
        const info = record.targetObjectInfo;
        const name = info?.name?.trim() || '-';
        const desc = info?.description?.trim();
        const icon = info?.icon?.trim();
        const initial = name !== '-' ? name.charAt(0).toLocaleUpperCase() : '?';

        return (
          <div className={styles.toolNameCell}>
            <div className={styles.toolNameAvatarWrap}>
              {icon ? (
                <img className={styles.toolNameAvatarImg} src={icon} alt="" />
              ) : (
                <span className={styles.toolNameAvatarLetter}>{initial}</span>
              )}
            </div>
            <div className={styles.toolNameText}>
              <div className={styles.toolNameTitle}>{name}</div>
              {desc ? (
                <div className={styles.toolNameSubtitle} title={desc}>
                  {desc}
                </div>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.toolTargetType'),
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      search: false,
      render: (_, record) => {
        const tt = record.targetType;
        if (typeof tt !== 'string') return '-';
        return TARGET_TYPE_LABEL_MAP[tt as ToolPricingTargetType] ?? '-';
      },
    },
    {
      title: dict('PC.Pages.SpaceResourcePricing.price'),
      dataIndex: 'price',
      key: 'price',
      width: 220,
      search: false,
      render: (_, record) => {
        const trials = record.trialCount ?? 0;
        const unitSuffix = ` / ${dict(
          'PC.Pages.SpaceResourcePricing.periodOnce',
        )}`;

        return (
          <div className={styles.priceCell}>
            <span className={styles.priceCellMain}>
              <span className={styles.priceCellCurrency}>¥</span>
              <span className={styles.priceCellAmount}>
                {record.price || 0}
              </span>
              <span className={styles.priceCellUnit}>{unitSuffix}</span>
            </span>
            {trials > 0 ? (
              <span className={styles.priceTrialBadge}>
                {dict('PC.Pages.SpaceResourcePricing.priceTrialBadge', trials)}
              </span>
            ) : null}
          </div>
        );
      },
    },
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
          // onChange={(checked) => handleToggleStatus(record, checked)}
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
              // onClick: (row) => openEdit(row),
            },
            {
              key: 'delete',
              label: dict('PC.Common.Global.delete'),
              danger: true,
              // onClick: (row) => handleDelete(row),
            },
          ]}
        />
      ),
    },
  ];

  // 获取工具定价列表（MCP / PLUGIN / WORKFLOW）
  const request = async () => {
    setLoading(true);
    const res = await apiListPricingConfig({
      targetTypes: [
        ToolPricingTargetType.MCP,
        ToolPricingTargetType.PLUGIN,
        ToolPricingTargetType.WORKFLOW,
      ],
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

  return (
    <div>
      <div className={pricingStyles.tabHeader}>
        <h4 className={pricingStyles.tabTitle}>
          {dict('PC.Pages.SpaceResourcePricing.toolTitle')}
        </h4>
        <CustomPopover list={ADD_TOOL_LIST} onClick={handleClickAddToolType}>
          <Button type="primary" icon={<PlusOutlined />}>
            {dict('PC.Pages.SpaceResourcePricing.addTool')}
          </Button>
        </CustomPopover>
      </div>
      <div className={pricingStyles.searchBar}>
        <Input
          placeholder={dict(
            'PC.Pages.SpaceResourcePricing.searchToolPlaceholder',
          )}
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          allowClear
          style={{ width: 260 }}
        />
        <Button
          type={categoryFilter === '' ? 'primary' : 'default'}
          size="small"
          onClick={() => setCategoryFilter('')}
          className={pricingStyles.filterBtn}
        >
          {dict('PC.Pages.SpaceResourcePricing.filterAll')}
        </Button>
        <Button
          type={categoryFilter === 'plugin' ? 'primary' : 'default'}
          size="small"
          onClick={() => setCategoryFilter('plugin')}
          className={pricingStyles.filterBtn}
        >
          {dict('PC.Pages.SpaceResourcePricing.categoryPlugin')}
        </Button>
        <Button
          type={categoryFilter === 'workflow' ? 'primary' : 'default'}
          size="small"
          onClick={() => setCategoryFilter('workflow')}
          className={pricingStyles.filterBtn}
        >
          {dict('PC.Pages.SpaceResourcePricing.categoryWorkflow')}
        </Button>
        <Button
          type={categoryFilter === 'mcp' ? 'primary' : 'default'}
          size="small"
          onClick={() => setCategoryFilter('mcp')}
          className={pricingStyles.filterBtn}
        >
          {dict('PC.Pages.SpaceResourcePricing.categoryMCP')}
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
      <div className={pricingStyles.billingNotice}>
        <span className={pricingStyles.noticeIcon}>ⓘ</span>
        <span>{dict('PC.Pages.SpaceResourcePricing.billingNotice')}</span>
      </div>

      {/* 工具添加弹窗 */}
      <ToolPricingFormModal
        spaceId={spaceId}
        open={toolModalOpen}
        targetType={creatingTargetType}
        onCancel={() => {
          setToolModalOpen(false);
          setCreatingTargetType(null);
        }}
        onSaved={() => {
          setToolModalOpen(false);
          setCreatingTargetType(null);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
};

export default ToolPricingTab;
