import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { formatDateTime } from '@/utils/dateUtils';
import type { ParamsType, ProColumns } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import { apiGetCreditFlowList } from '../services/credit';
import {
  CreditFlowOperationTypeEnum,
  CreditFlowTypeEnum,
  type UserCreditFlowInfo,
  type UserCreditFlowSearchParams,
} from '../types/credit';

/** ProTable 传入的分页与表单字段；请求接口仅使用 UserCreditFlowSearchParams */
type CreditFlowListTableParams = ParamsType &
  Pick<UserCreditFlowSearchParams, 'creditType' | 'userId'> & {
    userName?: string;
    current?: number;
    pageSize?: number;
  };

const DEFAULT_CURSOR_PAGE_SIZE = 15;

/** 积分类型筛选下拉：枚举值 → i18n key（不含 LOAN） */
const CREDIT_FLOW_TYPE_SEARCH_KEYS: Partial<
  Record<CreditFlowTypeEnum, string>
> = {
  [CreditFlowTypeEnum.SUBSCRIPTION]:
    'PC.Pages.SystemCreditRecords.creditTypeSubscription',
  [CreditFlowTypeEnum.PURCHASE]:
    'PC.Pages.SystemCreditRecords.creditTypePurchase',
  [CreditFlowTypeEnum.ACTIVITY]:
    'PC.Pages.SystemCreditRecords.creditTypeActivity',
  [CreditFlowTypeEnum.MANUAL]: 'PC.Pages.SystemCreditRecords.creditTypeManual',
  [CreditFlowTypeEnum.MODEL_CALL]:
    'PC.Pages.SystemCreditRecords.creditTypeModelCall',
  [CreditFlowTypeEnum.AGENT_CALL]:
    'PC.Pages.SystemCreditRecords.creditTypeAgentCall',
  [CreditFlowTypeEnum.TOOL_CALL]:
    'PC.Pages.SystemCreditRecords.creditTypeToolCall',
  [CreditFlowTypeEnum.MANUAL_DEDUCT]:
    'PC.Pages.SystemCreditRecords.creditTypeManualDeduct',
};

/**
 * 积分明细查询
 */
const CreditRecords: React.FC = () => {
  /** 当前表格是否有数据：无数据时不展示底部分页 */
  const [showPagination, setShowPagination] = useState<boolean>(false);
  /**
   * 与通用表格对齐的每页条数；单独受控可避免 ProTable 内部默认 pageSize（如 20）
   * 与 defaultPageSize 不一致，从而导致首请求与下拉展示错位。
   */
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_CURSOR_PAGE_SIZE);

  // 游标分页映射
  const lastIdMapRef = useRef<Record<number, number | undefined>>({
    1: undefined,
  });
  const queryKeyRef = useRef<string>('');

  const typeConfig = useMemo(
    () => ({
      [CreditFlowOperationTypeEnum.INCREASE]: {
        color: 'success',
        label: dict('PC.Pages.SystemCreditRecords.typeIncrease'),
      },
      [CreditFlowOperationTypeEnum.DECREASE]: {
        color: 'error',
        label: dict('PC.Pages.SystemCreditRecords.typeDecrease'),
      },
    }),
    [],
  );

  const creditTypeSearchEnum = useMemo(
    () =>
      Object.fromEntries(
        (
          Object.entries(CREDIT_FLOW_TYPE_SEARCH_KEYS) as [
            CreditFlowTypeEnum,
            string,
          ][]
        )
          .filter(([, dictKey]) => Boolean(dictKey))
          .map(([enumVal, dictKey]) => [enumVal, { text: dict(dictKey) }]),
      ),
    [],
  );

  /**
   * 积分流水查询列配置
   */
  const columns: ProColumns<UserCreditFlowInfo>[] = [
    {
      title: dict('PC.Pages.SystemCreditRecords.userId'),
      dataIndex: 'userId',
      key: 'userId',
      ellipsis: true,
      width: 100,
      fixed: 'left',
      fieldProps: {
        placeholder: `${dict('PC.Common.Global.pleaseInput')}${dict(
          'PC.Pages.SystemCreditRecords.userId',
        )}`,
      },
      render: (_, record) => record.userId || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.userName'),
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
      ellipsis: true,
      render: (_, record) => record.user?.username || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.phone'),
      dataIndex: 'phone',
      key: 'phone',
      width: 100,
      ellipsis: true,
      search: false,
      render: (_, record) => record.user?.phone || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.email'),
      dataIndex: 'email',
      key: 'email',
      width: 100,
      ellipsis: true,
      search: false,
      render: (_, record) => record.user?.email || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.recordId'),
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      search: false,
      width: 120,
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.bizNo'),
      dataIndex: 'bizNo',
      key: 'bizNo',
      ellipsis: true,
      search: false,
      width: 130,
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.batchNo'),
      dataIndex: 'batchNo',
      key: 'batchNo',
      ellipsis: true,
      search: false,
      width: 120,
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.amount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      width: 150,
      render: (_, record) => record.amount || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.creditType'),
      dataIndex: 'creditType',
      key: 'creditType',
      width: 140,
      valueType: 'select',
      valueEnum: creditTypeSearchEnum,
      fieldProps: {
        allowClear: true,
        placeholder: dict('PC.Common.Global.pleaseSelect'),
      },
      render: (_, record) => record.creditTypeName || record.creditType || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.operationType'),
      dataIndex: 'operationType',
      key: 'operationType',
      search: false,
      width: 100,
      render: (_, record) => {
        const cfg = typeConfig[record.operationType];
        return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
      },
      valueEnum: {
        [CreditFlowOperationTypeEnum.INCREASE]: {
          text: dict('PC.Pages.SystemCreditRecords.operationTypeIncrease'),
        },
        [CreditFlowOperationTypeEnum.DECREASE]: {
          text: dict('PC.Pages.SystemCreditRecords.operationTypeDecrease'),
        },
      },
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.beforeAmount'),
      dataIndex: 'beforeAmount',
      key: 'beforeAmount',
      search: false,
      render: (_, record) => record.beforeAmount || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.afterAmount'),
      dataIndex: 'afterAmount',
      key: 'afterAmount',
      search: false,
      render: (_, record) => record.afterAmount || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.created'),
      dataIndex: 'created',
      key: 'created',
      search: false,
      render: (_, record) => formatDateTime(record.created),
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.remark'),
      dataIndex: 'remark',
      key: 'remark',
      search: false,
      ellipsis: true,
    },
  ];

  const requestCreditFlowList = async (params: CreditFlowListTableParams) => {
    const current = Number(params.current ?? 1);
    const pageSize = Number(params.pageSize ?? DEFAULT_CURSOR_PAGE_SIZE);
    const usernamePhoneOrEmail = params.userName?.trim() || undefined;

    const queryKey = JSON.stringify({
      userId: params.userId ?? '',
      usernamePhoneOrEmail: usernamePhoneOrEmail ?? '',
      creditType: params.creditType,
      pageSize,
    });

    // 查询条件改变时，重置游标分页映射。
    if (queryKeyRef.current !== queryKey) {
      queryKeyRef.current = queryKey;
      lastIdMapRef.current = { 1: undefined };
    }

    try {
      const lastId = lastIdMapRef.current[current];
      const payload: UserCreditFlowSearchParams = {
        userId: params.userId,
        usernamePhoneOrEmail,
        creditType: params.creditType,
        lastId,
        pageSize,
      };
      const res = await apiGetCreditFlowList(payload);
      if (res?.code === SUCCESS_CODE) {
        const list = res.data || [];
        setShowPagination(list.length > 0);
        const nextPageLastId = list.length
          ? list[list.length - 1]?.id
          : undefined;
        lastIdMapRef.current[current + 1] = nextPageLastId;

        return {
          data: list,
          // 游标分页接口无 total，给 ProTable 一个可翻页总量。
          total: current * pageSize + (list.length === pageSize ? 1 : 0),
          success: true,
        };
      }
    } catch {}
    setShowPagination(false);
    return {
      data: [],
      total: 0,
      success: false,
    };
  };

  /** 游标分页配置（与通用表格一致：15 / 30 / 50 / 100 条每页） */
  const cursorPagination = useMemo(
    () => ({
      showSizeChanger: true,
      pageSizeOptions: [15, 30, 50, 100],
      defaultPageSize: DEFAULT_CURSOR_PAGE_SIZE,
      pageSize: tablePageSize,
      onShowSizeChange: (_current: number, size: number) => {
        setTablePageSize(size);
      },
      showQuickJumper: false,
      /** 游标分页无真实 total，避免误导性的「共 X 条」 */
      showTotal: () => null,
      /** 仅保留上一页 / 下一页，隐藏页码与跳转（接口按 lastId 翻页） */
      itemRender: (
        _page: number,
        type: 'page' | 'prev' | 'next' | 'jump-prev' | 'jump-next',
        originalElement: React.ReactNode,
      ) => {
        if (type === 'page' || type === 'jump-prev' || type === 'jump-next') {
          return null;
        }
        return originalElement;
      },
    }),
    [tablePageSize],
  );

  return (
    <WorkspaceLayout title={dict('PC.Routes.creditsRecordsQuery')}>
      <XProTable<UserCreditFlowInfo, CreditFlowListTableParams>
        rowKey="id"
        columns={columns}
        request={requestCreditFlowList}
        pagination={showPagination ? cursorPagination : false}
        scroll={{ x: 'max-content' }}
      />
    </WorkspaceLayout>
  );
};

export default CreditRecords;
