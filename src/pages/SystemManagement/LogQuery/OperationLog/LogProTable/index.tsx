import { LimitedTooltip, XProTable } from '@/components/ProComponents';
import {
  apiOperationLogActionTypeOptions,
  apiOperationLogList,
  apiOperationLogSystemCodeOptions,
} from '@/services/agentDev';
import { t } from '@/services/i18nRuntime';
import type {
  OperationLogInfo,
  OperationLogQueryFilter,
} from '@/types/interfaces/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import { createOptionsRequest } from '@/utils/procomponents';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { Button, message } from 'antd';
import dayjs from 'dayjs';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'umi';
import LogDetailDrawer from '../LogDetailDrawer';

/**
 * 工作空间日志查询（ProTable 版本）
 * - 支持：筛选查询、分页、点击行查看详情
 * - 数据源：apiSpaceLogList / apiSpaceLogDetail
 */
const LogProTable: React.FC = () => {
  const location = useLocation();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance>();

  const [detailsVisible, setDetailsVisible] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string>();

  const handleCloseDetails = useCallback(() => {
    setDetailsVisible(false);
    setCurrentId(undefined);
  }, []);

  const columns: ProColumns<OperationLogInfo>[] = useMemo(
    () => [
      {
        title: t('PC.Pages.SystemOperationLog.columnType'),
        dataIndex: 'systemCode',
        width: 140,
        valueType: 'select',
        request: createOptionsRequest(apiOperationLogSystemCodeOptions),
        hideInTable: false,
        fieldProps: {
          placeholder: t('PC.Pages.SystemOperationLog.placeholderType'),
          allowClear: true,
        },
      },
      {
        title: t('PC.Pages.SystemOperationLog.columnActionType'),
        dataIndex: 'action',
        width: 140,
        valueType: 'select',
        request: createOptionsRequest(apiOperationLogActionTypeOptions, (d) =>
          d.map((i) => ({ label: i.label, value: i.label })),
        ),
        fieldProps: {
          placeholder: t('PC.Pages.SystemOperationLog.placeholderActionType'),
          allowClear: true,
        },
      },
      {
        title: t('PC.Pages.SystemOperationLog.columnObjectName'),
        dataIndex: 'object',
        width: 140,
        ellipsis: true,
        fieldProps: {
          placeholder: t('PC.Pages.SystemOperationLog.placeholderObjectName'),
        },
      },
      {
        title: t('PC.Pages.SystemOperationLog.columnObjectSubtype'),
        dataIndex: 'operateContent',
        width: 140,
        ellipsis: true,
        fieldProps: {
          placeholder: t(
            'PC.Pages.SystemOperationLog.placeholderObjectSubtype',
          ),
        },
      },
      {
        title: t('PC.Pages.SystemOperationLog.columnRequestParams'),
        dataIndex: 'extraContent',
        minWidth: 150,
        width: 220,
        // 关闭默认 title 提示（无法限制高度），改用自定义 Tooltip
        ellipsis: { showTitle: false },
        render: (_: any, record: OperationLogInfo) => (
          <LimitedTooltip formatJson>{record?.extraContent}</LimitedTooltip>
        ),
        fieldProps: {
          placeholder: t(
            'PC.Pages.SystemOperationLog.placeholderRequestParams',
          ),
        },
      },
      {
        title: t('PC.Pages.SystemOperationLog.columnCreator'),
        dataIndex: 'creator',
        width: 180,
        ellipsis: true,
        fieldProps: {
          placeholder: t('PC.Pages.SystemOperationLog.placeholderCreator'),
        },
      },
      {
        title: t('PC.Pages.SystemOperationLog.columnTimeRange'),
        dataIndex: 'createTimeRange',
        valueType: 'dateTimeRange',
        hideInTable: true,
      },
      {
        title: t('PC.Pages.SystemOperationLog.columnCreated'),
        dataIndex: 'created',
        width: 170,
        valueType: 'dateTime',
        search: false,
        renderText: (text: any) => {
          if (!text) return '-';
          return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
        },
      },
    ],
    [],
  );

  // 中间变量用于判断是否是点击重置按钮
  const isReset = useRef(false);

  const request = useCallback(async (_tableParams: Record<string, any>) => {
    let tableParams = _tableParams;
    // 判断是否是点击重置按钮
    if (isReset.current) {
      isReset.current = false;
      // 重置表单
      formRef.current?.resetFields();

      tableParams = {
        current: tableParams.current,
        pageSize: tableParams.pageSize,
      };
    }
    const current = Number(tableParams.current || 1);
    const pageSize = Number(tableParams.pageSize || 15);

    const timeRange = tableParams.createTimeRange as
      | [number, number]
      | [string, string]
      | undefined;
    const createTimeGt = timeRange?.[0] ? Number(timeRange[0]) : undefined;
    const createTimeLt = timeRange?.[1] ? Number(timeRange[1]) : undefined;

    const queryFilter: OperationLogQueryFilter = {
      // 类型
      systemCode: tableParams.systemCode ? [tableParams.systemCode] : undefined,
      // 操作方式
      action: tableParams.action ? [tableParams.action] : undefined,
      // 对象名称
      object: tableParams.object || undefined,
      // 对象子类
      operateContent: tableParams.operateContent || undefined,
      // 请求参数
      extraContent: tableParams.extraContent || undefined,
      // 创建人
      creator: tableParams.creator || undefined,
      // 创建时间（开始时间）
      createTimeGt,
      // 创建时间（结束时间）
      createTimeLt,
    };

    try {
      // 额外查询条件
      const resp = (await apiOperationLogList({
        queryFilter,
        current,
        pageSize,
      })) as unknown as RequestResponse<any>;

      if (
        resp &&
        typeof resp === 'object' &&
        'success' in resp &&
        !resp.success
      ) {
        message.error(
          resp.message || t('PC.Pages.SystemOperationLog.queryFailed'),
        );
        return { data: [], total: 0, success: false };
      }

      const page = (resp as any)?.data?.records
        ? (resp as any).data
        : (resp as any);
      const records: OperationLogInfo[] = page?.records ?? [];
      const total: number = page?.total ?? 0;

      return { data: records, total, success: true };
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[OperationLog] query failed', e);
      return { data: [], total: 0, success: false };
    }
  }, []);

  /**
   * 打开详情抽屉（由“操作-详情”按钮触发）
   * 直接使用当前行的数据，不调用接口
   */
  const handleOpenDetails = useCallback((record: OperationLogInfo) => {
    if (!record?.id) {
      message.warning(
        t('PC.Pages.SystemOperationLog.missingRequestIdForDetail'),
      );
      return;
    }

    setDetailsVisible(true);
    setCurrentId(record.id.toString());
  }, []);

  const columnsWithActions: ProColumns<OperationLogInfo>[] = useMemo(() => {
    return [
      ...columns,
      {
        title: t('PC.Pages.SystemOperationLog.columnAction'),
        valueType: 'option',
        width: 90,
        fixed: 'right',
        align: 'center',
        render: (_: any, record: OperationLogInfo) => {
          return (
            <Button
              type="link"
              // disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetails(record);
              }}
            >
              {t('PC.Pages.SystemOperationLog.detail')}
            </Button>
          );
        },
      },
    ];
  }, [columns, handleOpenDetails]);

  const handleReset = () => {
    isReset.current = true;
    // 重置表格状态
    actionRef.current?.reset?.();
    // 设置分页参数:第1页,每页15条
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
    // 延迟一下再重新加载,确保分页参数已设置
    actionRef.current?.reload();
  };

  // 监听 location.state 变化
  // 当 state 中存在 _t 变量时，说明是通过菜单切换过来的，需要清空 query 参数
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      handleReset();
    }
  }, [location.state]);

  return (
    <>
      <XProTable<OperationLogInfo>
        formRef={formRef}
        actionRef={actionRef}
        rowKey={(record) => record.id}
        columns={columnsWithActions}
        request={request}
        dateFormatter="number"
        onSubmit={handleCloseDetails}
        onReset={handleReset}
      />
      <LogDetailDrawer
        open={detailsVisible}
        id={currentId}
        onClose={handleCloseDetails}
      />
    </>
  );
};

export default LogProTable;
