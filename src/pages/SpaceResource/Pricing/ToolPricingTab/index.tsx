import CustomPopover from '@/components/CustomPopover';
import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Input, Switch, message } from 'antd';
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
  ToolPricingTargetType,
} from '../../types/resource';
import pricingStyles from '../index.less';
import styles from './index.less';
import ToolPricingFormModal from './ToolPricingFormModal';

// 表中 MCP/插件/工作流 targetType → 列展示文案
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

// 「添加工具」Popover 条目，CustomPopover.onClick 会带上 value 作为新建类型
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

/**
 * 组件入参：`spaceId` 用于列表与表单保存绑定工作空间。
 */
interface ToolPricingTabProps {
  spaceId: number;
}

/**
 * 工具定价 Tab：列出 MCP / 插件 / 工作流定价，支持新建、编辑与删除。
 * 列表：`apiListPricingConfig`；删除：`apiDeleteToolPricing`；表单：`ToolPricingFormModal`。
 * @returns 定价 Tab 的布局与表格
 */
const ToolPricingTab: React.FC<ToolPricingTabProps> = ({ spaceId }) => {
  /** 表格请求 loading */
  const [loading, setLoading] = useState<boolean>(false);
  /** 工具名称关键词（可与列表过滤串联） */
  const [keyword, setKeyword] = useState('');
  /** 插件 / 工作流 / MCP 筛选 */
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  /** 定价表单 Modal 开关 */
  const [toolModalOpen, setToolModalOpen] = useState<boolean>(false);

  /** 新建：Popover 选中的类型；编辑：当前行的 targetType，供 Modal / Created */
  const [selectedTargetType, setSelectedTargetType] =
    useState<ToolPricingTargetType | null>(null);

  /** 非空时为编辑模式，弹窗内回显并可提交带上 id */
  const [editItem, setEditItem] = useState<ResourcePricingConfigInfo | null>(
    null,
  );
  /** 供 XProTable 调用 reload（删除后、表单保存成功后刷新列表） */
  const actionRef = useRef<ActionType>();

  /** 删除定价：`handleDelete` 内二次确认后执行 */
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

  /** 表格内切换「开启收费」，成功后刷新列表 */
  const { run: runUpdateToolPricing } = useRequest(apiUpdateToolPricing, {
    manual: true,
    onSuccess: () => {
      message.success(dict('PC.Pages.SpaceResourcePricing.toggleSuccess'));
      actionRef.current?.reload();
    },
    onError: () => {
      message.error(dict('PC.Common.Global.operationFailed'));
    },
  });

  /** 关闭定价表单并重置新建/编辑状态 */
  const closeToolModal = () => {
    setToolModalOpen(false);
    setEditItem(null);
    setSelectedTargetType(null);
  };

  /** 从 Popover 选择类型后打开新建表单 */
  const handleClickAddToolType = (item: CustomPopoverItem) => {
    const targetType = item.value as ToolPricingTargetType;
    setSelectedTargetType(targetType);
    setEditItem(null);
    setToolModalOpen(true);
  };

  /** 编辑行：写入 editItem 后打开表单弹窗（回显在子组件） */
  const handleOpenEdit = (record: ResourcePricingConfigInfo) => {
    setEditItem(record);
    setSelectedTargetType(record.targetType);
    setToolModalOpen(true);
  };

  /** 删除行：二次确认通过后调用 `removePricingConfig` */
  const handleDelete = (item: ResourcePricingConfigInfo) => {
    modalConfirm(
      dict('PC.Common.Global.confirmDelete'),
      item.targetObjectInfo?.name || item.targetId || '',
      () => removePricingConfig(item.id),
    );
  };

  /** Switch：更新本条配置的 status（启用/禁用对用户计费） */
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

  /** ProTable 列配置：详情见各列 render */
  const columns: ProColumns<ResourcePricingConfigInfo>[] = [
    // 名称 + 简述 + 图标/首字母
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
    // 工具大类：插件 / 工作流 / MCP
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
    // ¥单价 + 「/次」单位 + 试用次数徽标
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
    // 开启/关闭对用户计费（立即调保存接口）
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
    // 编辑打开表单；删除二次确认后调接口
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
              onClick: (row) => handleOpenEdit(row),
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
      {/* 标题 + 「添加工具」Popover */}
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
      {/* 预留：关键词 + 类型筛选（可与 request 过滤串联） */}
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
      {/* 工具定价列表 */}
      <XProTable<ResourcePricingConfigInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        loading={loading}
        pagination={false}
      />
      {/* 关闭收费说明 */}
      <div className={pricingStyles.billingNotice}>
        <span className={pricingStyles.noticeIcon}>ⓘ</span>
        <span>{dict('PC.Pages.SpaceResourcePricing.billingNotice')}</span>
      </div>

      {/* 新建 / 编辑工具定价（含选工具 Created） */}
      <ToolPricingFormModal
        spaceId={spaceId}
        open={toolModalOpen}
        targetType={selectedTargetType as ToolPricingTargetType}
        editItem={editItem}
        onCancel={closeToolModal}
        onSaved={() => {
          closeToolModal();
          actionRef.current?.reload();
        }}
      />
    </div>
  );
};

export default ToolPricingTab;
