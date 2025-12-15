import LimitedTooltip from '@/components/base/LimitedTooltip';
import { apiSpaceLogList } from '@/services/agentDev';
import type {
  SpaceLogInfo,
  SpaceLogQueryFilter,
} from '@/types/interfaces/agent';
import type { RequestResponse } from '@/types/interfaces/request';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'umi';
import LogDetailDrawer from '../LogDetailDrawer';

/**
 * 工作空间日志查询（ProTable 版本）
 * - 支持：筛选查询、分页、点击行查看详情
 * - 数据源：apiSpaceLogList / apiSpaceLogDetail
 */
const LogProTable: React.FC = () => {
  const params = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const spaceId = Number(params.spaceId);
  const actionRef = useRef<ActionType>();

  const [detailsVisible, setDetailsVisible] = useState<boolean>(false);
  const [currentRequestId, setCurrentRequestId] = useState<string>();
  const [currentExecuteResult, setCurrentExecuteResult] =
    useState<SpaceLogInfo>();

  // 从 URL 查询参数中获取 targetType，用于初始化查询表单
  const targetTypeFromUrl = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('targetType') || undefined;
  }, [location.search]);

  // 当 targetType 变化时，更新 URL 参数
  const handleTargetTypeChange = useCallback(
    (value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value) {
        newParams.set('targetType', value);
      } else {
        newParams.delete('targetType');
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  const handleCloseDetails = useCallback(() => {
    setDetailsVisible(false);
    setCurrentRequestId(undefined);
    setCurrentExecuteResult(undefined);
  }, []);

  const columns: ProColumns<SpaceLogInfo>[] = useMemo(
    () => [
      {
        title: '类型',
        dataIndex: 'targetType',
        valueType: 'select',
        valueEnum: {
          Agent: { text: '智能体' },
          Plugin: { text: '插件' },
          Workflow: { text: '工作流' },
          Mcp: { text: 'Mcp' },
        },
        hideInTable: true,
        initialValue: targetTypeFromUrl,
        fieldProps: {
          placeholder: '请选择类型',
          allowClear: true,
          onChange: handleTargetTypeChange,
        },
      },
      {
        title: '请求ID',
        dataIndex: 'requestId',
        width: 160,
        ellipsis: true,
        fieldProps: { placeholder: '请输入请求ID' },
      },
      {
        title: '用户ID',
        dataIndex: 'userId',
        width: 100,
        ellipsis: true,
        fieldProps: { placeholder: '请输入用户ID' },
      },
      {
        title: '用户名',
        dataIndex: 'userName',
        width: 180,
        ellipsis: true,
        fieldProps: { placeholder: '请输入用户名' },
      },
      {
        title: '会话ID',
        dataIndex: 'conversationId',
        width: 140,
        ellipsis: true,
        fieldProps: { placeholder: '请输入会话ID' },
      },
      {
        title: '输入内容',
        dataIndex: 'input',
        minWidth: 150,
        width: 220,
        // 关闭默认 title 提示（无法限制高度），改用自定义 Tooltip
        ellipsis: { showTitle: false },
        render: (_: any, record: SpaceLogInfo) => (
          <LimitedTooltip formatJson>{record?.input}</LimitedTooltip>
        ),
        fieldProps: { placeholder: '多个关键字以空格分隔，请输入内容' },
      },
      {
        title: '输出内容',
        dataIndex: 'output',
        minWidth: 150,
        width: 220,
        // 关闭默认 title 提示（无法限制高度），改用自定义 Tooltip
        ellipsis: { showTitle: false },
        render: (_: any, record: SpaceLogInfo) => (
          <LimitedTooltip formatJson>{record?.output}</LimitedTooltip>
        ),
        fieldProps: { placeholder: '多个关键字以空格分隔，请输入内容' },
      },
      {
        title: '对象名称',
        dataIndex: 'targetName',
        width: 140,
        ellipsis: true,
        fieldProps: { placeholder: '请输入对象名称' },
      },
      {
        title: '时间范围',
        dataIndex: 'createTimeRange',
        valueType: 'dateTimeRange',
        hideInTable: true,
      },
      {
        title: '输入token',
        dataIndex: 'inputToken',
        width: 100,
        align: 'center',
        search: false,
      },
      {
        title: '输出token',
        dataIndex: 'outputToken',
        width: 100,
        align: 'center',
        search: false,
      },
      {
        title: '请求时间',
        dataIndex: 'requestStartTime',
        width: 170,
        valueType: 'dateTime',
        search: false,
        renderText: (text: any) => {
          if (!text) return '-';
          return dayjs(text).format('YYYY-MM-DD HH:mm:ss');
        },
      },
      {
        title: '整体耗时',
        key: 'elapsedTimeMs',
        width: 110,
        align: 'center',
        search: false,
        render: (_: any, record: SpaceLogInfo) => {
          const endTime = record.requestEndTime;
          const startTime = record.requestStartTime;
          if (!endTime || !startTime) {
            return <span>0 ms</span>;
          }
          const elapsedTime = dayjs(endTime).diff(
            dayjs(startTime),
            'millisecond',
          );
          return <span>{elapsedTime} ms</span>;
        },
      },
    ],
    [handleTargetTypeChange, targetTypeFromUrl],
  );

  const request = useCallback(
    async (tableParams: Record<string, any>) => {
      const current = Number(tableParams.current || 1);
      const pageSize = Number(tableParams.pageSize || 10);

      const timeRange = tableParams.createTimeRange as
        | [number, number]
        | [string, string]
        | undefined;
      const createTimeGt = timeRange?.[0] ? Number(timeRange[0]) : undefined;
      const createTimeLt = timeRange?.[1] ? Number(timeRange[1]) : undefined;

      const userIdNum =
        tableParams.userId !== undefined && tableParams.userId !== ''
          ? Number(tableParams.userId)
          : undefined;

      const queryFilter: SpaceLogQueryFilter = {
        spaceId: Number.isFinite(spaceId) ? spaceId : undefined,
        targetType: tableParams.targetType || undefined,
        requestId: tableParams.requestId || undefined,
        userId: Number.isFinite(userIdNum as number)
          ? (userIdNum as number)
          : undefined,
        userName: tableParams.userName || undefined,
        conversationId: tableParams.conversationId || undefined,
        input: tableParams.input || undefined,
        output: tableParams.output || undefined,
        targetName: tableParams.targetName || undefined,
        createTimeGt,
        createTimeLt,
      };

      try {
        const resp = (await apiSpaceLogList({
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
        const records: SpaceLogInfo[] = page?.records ?? [];
        const total: number = page?.total ?? 0;

        return { data: records, total, success: true };
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('查询日志失败', e);
        message.error('查询日志失败');
        return { data: [], total: 0, success: false };
      }
    },
    [spaceId],
  );

  /**
   * 打开详情抽屉（由“操作-详情”按钮触发）
   * 直接使用当前行的数据，不调用接口
   */
  const handleOpenDetails = useCallback((record: SpaceLogInfo) => {
    if (!record?.requestId) {
      message.warning('该条记录缺少 requestId，无法查看详情');
      return;
    }

    setDetailsVisible(true);
    setCurrentRequestId(record.requestId);
    // 直接使用当前行的 processData，不调用接口
    setCurrentExecuteResult(record);
  }, []);

  const columnsWithActions: ProColumns<SpaceLogInfo>[] = useMemo(() => {
    return [
      ...columns,
      {
        title: '操作',
        valueType: 'option',
        width: 90,
        fixed: 'right',
        align: 'center',
        render: (_: any, record: SpaceLogInfo) => {
          const disabled = !record?.requestId || !(record?.spaceId ?? spaceId);
          return (
            <Button
              type="link"
              disabled={disabled}
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
  }, [columns, handleOpenDetails, spaceId]);

  return (
    <>
      <ProTable<SpaceLogInfo>
        actionRef={actionRef}
        rowKey={(record) => record.id}
        columns={columnsWithActions}
        request={request}
        debounceTime={300}
        toolBarRender={false}
        cardProps={{ bodyStyle: { padding: 0 } }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) => `共 ${total} 条`,
          defaultPageSize: 10,
        }}
        search={{
          span: 6, // 24 栅格 => 3 列表单
          labelWidth: 70,
          defaultCollapsed: false,
        }}
        dateFormatter="number"
        onSubmit={() => handleCloseDetails()}
        onReset={() => handleCloseDetails()}
      />

      <LogDetailDrawer
        loading={false}
        open={detailsVisible}
        requestId={currentRequestId}
        executeResult={currentExecuteResult}
        onClose={handleCloseDetails}
      />
    </>
  );
};

export default LogProTable;
