import pluginImage from '@/assets/images/plugin_image.png';
import workflowImage from '@/assets/images/workflow_image.png';
import CustomPopover from '@/components/CustomPopover';
import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import type { CustomPopoverItem } from '@/types/interfaces/common';
import { modalConfirm } from '@/utils/ant-custom';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Switch, message } from 'antd';
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
  ToolPricingTargetType,
} from '../../types/resource';
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
};

// 工具定价列表中显示的 targetType
const TOOL_PRICING_TAB_TARGET_TYPES = [
  ToolPricingTargetType.PLUGIN,
  ToolPricingTargetType.WORKFLOW,
];

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
];

/**
 * 组件入参：`spaceId` 用于列表与表单保存绑定工作空间。
 */
interface ToolPricingTabProps {
  spaceId: number;
  /** 将「添加工具」注册到上级页面工具栏右侧 */
  registerToolbarRight?: (node: React.ReactNode | null) => void;
}

/**
 * 工具定价 Tab：列出 MCP / 插件 / 工作流定价，支持新建、编辑与删除。
 * 列表：`apiListPricingConfig`；删除：`apiDeleteToolPricing`；表单：`ToolPricingFormModal`。
 * @returns 定价 Tab 的布局与表格
 */
const ToolPricingTab: React.FC<ToolPricingTabProps> = ({
  spaceId,
  registerToolbarRight,
}) => {
  /** 表格请求 loading */
  const [loading, setLoading] = useState<boolean>(false);
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

  /** 从 Popover 选择类型后打开新建表单（供顶部工具栏注册，避免过时闭包） */
  const handleClickAddToolTypeRef = useRef<(item: CustomPopoverItem) => void>(
    () => {},
  );
  handleClickAddToolTypeRef.current = (item: CustomPopoverItem) => {
    const targetType = item.value as ToolPricingTargetType;
    setSelectedTargetType(targetType);
    setEditItem(null);
    setToolModalOpen(true);
  };

  useEffect(() => {
    if (!registerToolbarRight) return;
    registerToolbarRight(
      <CustomPopover
        list={ADD_TOOL_LIST}
        onClick={(item) => handleClickAddToolTypeRef.current(item)}
      >
        <Button type="primary" icon={<PlusOutlined />}>
          {dict('PC.Pages.SpaceResourcePricing.addTool')}
        </Button>
      </CustomPopover>,
    );
    return () => registerToolbarRight(null);
  }, [registerToolbarRight]);

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
    // 名称 + 简述 + 图标（无自定义图时按 targetType 用默认插画）
    {
      title: dict('PC.Pages.SpaceResourcePricing.toolName'),
      dataIndex: ['targetObjectInfo', 'name'],
      key: 'name',
      width: 220,
      ellipsis: false,
      search: false,
      render: (_, record) => {
        const targetObjectInfo = record.targetObjectInfo;
        const { name, description, icon } = targetObjectInfo || {};
        // 无自定义图时按 targetType 用默认图标
        const defaultImage =
          record.targetType === ToolPricingTargetType.WORKFLOW
            ? workflowImage
            : pluginImage;

        return (
          <div className={styles['tool-name-cell']}>
            <div className={styles['tool-name-avatar-wrap']}>
              <img
                className={styles['tool-name-avatar-img']}
                src={icon || defaultImage}
                alt=""
              />
            </div>
            <div className={styles['tool-name-text']}>
              <div className={styles['tool-name-title']}>{name}</div>
              {description && (
                <div
                  className={styles['tool-name-subtitle']}
                  title={description}
                >
                  {description}
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    // 工具大类：插件 / 工作流 / MCP；在 ProTable search（LightFilter）中用下拉筛选
    {
      title: dict('PC.Pages.SpaceResourcePricing.toolTargetType'),
      dataIndex: 'targetType',
      key: 'targetType',
      width: 100,
      valueType: 'select',
      valueEnum: {
        [ToolPricingTargetType.PLUGIN]: {
          text: TARGET_TYPE_LABEL_MAP[ToolPricingTargetType.PLUGIN],
        },
        [ToolPricingTargetType.WORKFLOW]: {
          text: TARGET_TYPE_LABEL_MAP[ToolPricingTargetType.WORKFLOW],
        },
      },
      fieldProps: {
        allowClear: true,
        placeholder: dict('PC.Pages.SpaceResourcePricing.selectPlaceholder'),
      },
      render: (_, record) => {
        const tt = record.targetType;
        if (typeof tt !== 'string') return '-';
        return TARGET_TYPE_LABEL_MAP[tt as ToolPricingTargetType] ?? '-';
      },
    },
    // ¥单价 + 「/次」单位
    {
      title: dict('PC.Pages.SpaceResourcePricing.price'),
      dataIndex: 'price',
      key: 'price',
      width: 220,
      search: false,
      render: (_, record) => {
        const unitSuffix = ` / ${dict(
          'PC.Pages.SpaceResourcePricing.periodOnce',
        )}`;

        return (
          <div className={styles['tool-price-cell']}>
            <span className={styles['tool-price-currency']}>¥</span>
            <span className={styles['tool-price-amount']}>
              {record.price || 0}
            </span>
            <span className={styles['tool-price-unit']}>{unitSuffix}</span>
          </div>
        );
      },
    },
    // 开启/关闭对用户计费（立即调保存接口）；search 中可按状态筛选
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

  // 获取工具定价列表：`status` 由接口 `/api/pricing/config/list` 过滤；`targetType` 仍本地筛选
  const request = async (params: {
    targetType?: ToolPricingTargetType;
    status?: ResourcePricingStatus | string | number;
    pageSize?: number;
    current?: number;
  }) => {
    setLoading(true);
    // 状态：0-禁用，1-启用
    const statusRaw = params.status;
    const status =
      statusRaw !== undefined && statusRaw !== null
        ? Number(statusRaw)
        : undefined;

    const res = await apiListPricingConfig({
      targetTypes: [...TOOL_PRICING_TAB_TARGET_TYPES],
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

    let data = res.data || [];

    const typeFilter = params.targetType;
    if (
      typeFilter === ToolPricingTargetType.PLUGIN ||
      typeFilter === ToolPricingTargetType.WORKFLOW
    ) {
      data = data.filter((row) => row.targetType === typeFilter);
    }

    return {
      data,
      total: data.length,
      success: true,
    };
  };

  return (
    <div>
      {/* 工具定价列表 */}
      <XProTable<ResourcePricingConfigInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        params={{ spaceId }}
        request={request}
        loading={loading}
        pagination={false}
      />
      <footer className={styles['tool-billing-notice']}>
        <span className={styles['tool-billing-notice-icon']} aria-hidden>
          ⓘ
        </span>
        <span>{dict('PC.Pages.SpaceResourcePricing.billingNotice')}</span>
      </footer>

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
