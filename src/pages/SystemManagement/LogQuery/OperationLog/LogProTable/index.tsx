import LimitedTooltip from '@/components/base/LimitedTooltip';
import { XProTable } from '@/components/ProComponents';
import {
  apiOperationLogActionTypeOptions,
  apiOperationLogList,
  apiOperationLogSystemCodeOptions,
} from '@/services/agentDev';
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
        title: '类型',
        dataIndex: 'systemCode',
        width: 140,
        valueType: 'select',
        request: createOptionsRequest(apiOperationLogSystemCodeOptions),
        hideInTable: false,
        fieldProps: {
          placeholder: '请选择类型',
          allowClear: true,
        },
      },
      {
        title: '操作方式',
        dataIndex: 'action',
        width: 140,
        valueType: 'select',
        request: createOptionsRequest(apiOperationLogActionTypeOptions, (d) =>
          d.map((i) => ({ label: i.label, value: i.label })),
        ),
        fieldProps: {
          placeholder: '请选择操作方式',
          allowClear: true,
        },
      },
      {
        title: '对象名称',
        dataIndex: 'object',
        width: 140,
        ellipsis: true,
        fieldProps: {
          placeholder: '请输入对象名称',
        },
      },
      {
        title: '对象子类',
        dataIndex: 'operateContent',
        width: 140,
        ellipsis: true,
        fieldProps: { placeholder: '请输入对象名称' },
      },
      {
        title: '请求参数',
        dataIndex: 'extraContent',
        minWidth: 150,
        width: 220,
        // 关闭默认 title 提示（无法限制高度），改用自定义 Tooltip
        ellipsis: { showTitle: false },
        render: (_: any, record: OperationLogInfo) => (
          <LimitedTooltip formatJson>{record?.extraContent}</LimitedTooltip>
        ),
        fieldProps: { placeholder: '多个关键字以空格分隔，请输入内容' },
      },
      {
        title: '创建人',
        dataIndex: 'creator',
        width: 180,
        ellipsis: true,
        fieldProps: { placeholder: '请输入用户名' },
      },
      {
        title: '时间范围',
        dataIndex: 'createTimeRange',
        valueType: 'dateTimeRange',
        hideInTable: true,
      },
      {
        title: '创建时间',
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
    const pageSize = Number(tableParams.pageSize || 10);

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
        message.error(resp.message || '查询失败');
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
      console.error('查询日志失败', e);
      message.error('查询日志失败');
      return { data: [], total: 0, success: false };
    }
  }, []);

  /**
   * 打开详情抽屉（由“操作-详情”按钮触发）
   * 直接使用当前行的数据，不调用接口
   */
  const handleOpenDetails = useCallback((record: OperationLogInfo) => {
    if (!record?.id) {
      message.warning('该条记录缺少 requestId，无法查看详情');
      return;
    }

    setDetailsVisible(true);
    setCurrentId(record.id.toString());
  }, []);

  const columnsWithActions: ProColumns<OperationLogInfo>[] = useMemo(() => {
    return [
      ...columns,
      {
        title: '操作',
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
              详情
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
    // 设置分页参数:第1页,每页10条
    actionRef.current?.setPageInfo?.({ current: 1, pageSize: 10 });
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
