import { XProTable } from '@/components/ProComponents';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { dict } from '@/services/i18nRuntime';
import { formatDateTimeYmdHms } from '@/utils/dateUtils';
import type {
  ActionType,
  FormInstance,
  ParamsType,
  ProColumns,
} from '@ant-design/pro-components';
import { Statistic, Tag } from 'antd';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation } from 'umi';
import { CREDIT_FLOW_TYPE_SEARCH_KEYS } from '../creditTypeOptions';
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

const DEFAULT_PAGE_SIZE = 15;

/** 从 URL 查询串解析 userId（与列表页 query 一致） */
function parseUserIdFromSearch(search: string): number | undefined {
  const q = new URLSearchParams(search);
  const raw = q.get('userId');
  if (raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * 积分明细查询
 */
const CreditRecords: React.FC = () => {
  const location = useLocation();
  const userIdFromUrl = useMemo(
    () => parseUserIdFromSearch(location.search ?? ''),
    [location.search],
  );

  const formInitialValues = useMemo(
    () => (userIdFromUrl !== undefined ? { userId: userIdFromUrl } : undefined),
    [userIdFromUrl],
  );

  /** 当前表格是否有数据：无数据时不展示底部分页 */
  const [showPagination, setShowPagination] = useState<boolean>(false);
  /** 游标分页：接口 data 非空表示仍可翻下一页，为空则无下一页 */
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  /**
   * 与通用表格对齐的每页条数；单独受控可避免 ProTable 内部默认 pageSize（如 20）
   * 与 defaultPageSize 不一致，从而导致首请求与下拉展示错位。
   */
  const [tablePageSize, setTablePageSize] = useState(DEFAULT_PAGE_SIZE);

  // 游标分页映射
  const lastIdMapRef = useRef<Record<number, number | undefined>>({
    1: undefined,
  });
  const queryKeyRef = useRef<string>('');
  const formRef = useRef<FormInstance>();
  const actionRef = useRef<ActionType>();

  /** 重置表单与游标分页，恢复到 URL 对应的 formInitialValues */
  const handleReset = useCallback(() => {
    formRef.current?.setFieldsValue({
      userId: formInitialValues?.userId,
      userName: undefined,
      creditType: undefined,
    });
    queryKeyRef.current = '';
    lastIdMapRef.current = { 1: undefined };
    setHasNextPage(false);
    actionRef.current?.setPageInfo?.({
      current: 1,
      pageSize: tablePageSize,
    });
    // submit 会按当前表单值发起请求；reload 仅复用上次提交的筛选条件
    formRef.current?.submit();
  }, [formInitialValues, tablePageSize]);

  const typeConfig = useMemo(
    () => ({
      [CreditFlowOperationTypeEnum.INCREASE]: {
        color: 'success',
        label: dict('PC.Pages.SystemCreditRecords.operationTypeIncrease'),
      },
      [CreditFlowOperationTypeEnum.DECREASE]: {
        color: 'error',
        label: dict('PC.Pages.SystemCreditRecords.operationTypeDecrease'),
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
      title: dict('PC.Pages.SystemCreditRecords.creditType'),
      dataIndex: 'creditType',
      key: 'creditType',
      width: 140,
      valueType: 'select',
      align: 'center',
      valueEnum: creditTypeSearchEnum,
      fieldProps: {
        allowClear: true,
      },
      render: (_, record) => (
        <span>
          {creditTypeSearchEnum[record.creditType]?.text ??
            record.creditTypeName ??
            '-'}
        </span>
      ),
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
      title: dict('PC.Pages.SystemCreditRecords.amount'),
      dataIndex: 'amount',
      key: 'amount',
      search: false,
      width: 150,
      render: (_, record) => {
        const isIncrease =
          record.operationType === CreditFlowOperationTypeEnum.INCREASE;
        return (
          <Statistic
            value={record.amount}
            prefix={isIncrease ? '+' : '-'}
            valueStyle={{
              color: isIncrease ? '#52c41a' : '#ff4d4f',
              fontSize: '14px',
              fontWeight: '600',
            }}
          />
        );
      },
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.beforeAmount'),
      dataIndex: 'beforeAmount',
      key: 'beforeAmount',
      search: false,
      width: 150,
      render: (_, record) => record.beforeAmount || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.afterAmount'),
      dataIndex: 'afterAmount',
      key: 'afterAmount',
      width: 150,
      search: false,
      render: (_, record) => record.afterAmount || '-',
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.created'),
      dataIndex: 'created',
      key: 'created',
      search: false,
      render: (_, record) => formatDateTimeYmdHms(record.created),
    },
    {
      title: dict('PC.Pages.SystemCreditRecords.remark'),
      dataIndex: 'remark',
      key: 'remark',
      width: 200,
      search: false,
      ellipsis: true,
    },
  ];

  const requestCreditFlowList = async (params: CreditFlowListTableParams) => {
    const current = Number(params.current ?? 1);
    const pageSize = Number(params.pageSize ?? DEFAULT_PAGE_SIZE);
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
        const nextPageAvailable = list.length > 0;
        setShowPagination(nextPageAvailable);
        setHasNextPage(nextPageAvailable);
        const nextPageLastId = list.length
          ? list[list.length - 1]?.id
          : undefined;
        lastIdMapRef.current[current + 1] = nextPageLastId;

        return {
          data: list,
          // 游标分页无 total：data 非空表示还有下一页，为空则禁用下一页
          total: current * pageSize + (nextPageAvailable ? 1 : 0),
          success: true,
        };
      }
    } catch {}
    setShowPagination(false);
    setHasNextPage(false);
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
      defaultPageSize: DEFAULT_PAGE_SIZE,
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
        if (
          type === 'next' &&
          React.isValidElement(originalElement) &&
          !hasNextPage
        ) {
          return React.cloneElement(originalElement, { disabled: true });
        }
        return originalElement;
      },
    }),
    [hasNextPage, tablePageSize],
  );

  return (
    <WorkspaceLayout title={dict('PC.Routes.creditsRecordsQuery')} back>
      <XProTable<UserCreditFlowInfo, CreditFlowListTableParams>
        key={location.pathname + (location.search || '')}
        rowKey="id"
        formRef={formRef}
        actionRef={actionRef}
        columns={columns}
        request={requestCreditFlowList}
        pagination={showPagination ? cursorPagination : false}
        scroll={{ x: 'max-content' }}
        onReset={handleReset}
        form={
          formInitialValues ? { initialValues: formInitialValues } : undefined
        }
      />
    </WorkspaceLayout>
  );
};

export default CreditRecords;
