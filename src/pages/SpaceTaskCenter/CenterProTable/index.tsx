import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiTaskDelete,
  apiTaskDisable,
  apiTaskEnable,
  apiTaskExecute,
  apiTaskList,
} from '@/services/library';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { TaskInfo } from '@/types/interfaces/library';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { Tag, message } from 'antd';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { history, useParams } from 'umi';
import EllipsisWithAvatar from './components/EllipsisWithAvatar';

export interface CenterProTableRef {
  /**
   * 重新拉取任务列表（会清空本地缓存，然后触发表格 reload）
   */
  reload: () => void;
}

export interface CenterProTableProps {
  // 编辑
  onEdit?: (info: TaskInfo) => void;
}

/**
 * 任务中心表格（ProTable）
 *
 * 优化后的查询逻辑：
 * - 初始化加载时请求接口获取任务列表
 * - 点击查询按钮时始终调用后端接口（实时获取最新数据）
 * - 分页切换时使用本地缓存（提升性能）
 * - 筛选条件：
 *   - 任务对象：智能体 / 工作流（targetType）
 *   - 任务名称：模糊搜索（taskName）
 */
const CenterProTable = forwardRef<CenterProTableRef, CenterProTableProps>(
  ({ onEdit = () => {} }, ref) => {
    const params = useParams();
    const spaceId = Number(params.spaceId);
    const actionRef = useRef<ActionType>();

    // 数据缓存：存储最近一次请求的完整列表
    const cacheRef = useRef<{
      spaceId: number;
      list: TaskInfo[];
    } | null>(null);

    // 防止并发请求
    const fetchingRef = useRef<{
      spaceId: number;
      promise: Promise<TaskInfo[]>;
    } | null>(null);

    // 标记是否需要强制刷新（点击查询按钮时为 true）
    const forceRefreshRef = useRef<boolean>(false);
    // 标记是否是菜单切换触发的刷新
    const isMenuRefreshRef = useRef<boolean>(false);
    // 表单引用
    const formRef = useRef<FormInstance>();

    /**
     * 状态展示（后端枚举映射）
     * 可用值: CREATE,EXECUTING,CONTINUE,OVERFLOW_MAX_EXEC_TIMES,COMPLETE,FAIL,CANCEL
     */
    const getStatusMeta = useCallback((status?: string) => {
      const s = (status || '').toUpperCase();
      switch (s) {
        case 'EXECUTING':
          return {
            color: 'processing' as const,
            text: '执行中',
            isEnded: false,
          };
        case 'CREATE':
          return {
            color: 'warning' as const,
            text: '任务创建，等待执行',
            isEnded: false,
          };
        case 'CONTINUE':
          return {
            color: 'success' as const,
            text: '执行成功，待下次执行',
            isEnded: false,
          };
        case 'FAIL':
          return {
            color: 'error' as const,
            text: '执行失败，待下次执行',
            isEnded: false,
          };
        case 'CANCEL':
        case 'COMPLETE':
          return {
            color: 'default' as const,
            text: '已结束，不再执行',
            isEnded: true,
          };
        case 'OVERFLOW_MAX_EXEC_TIMES':
          return {
            color: 'default' as const,
            text: '已结束，不再执行',
            isEnded: false,
          };
        default:
          return {
            color: 'default' as const,
            text: status || '-',
            isEnded: false,
          };
      }
    }, []);

    /**
     * 获取任务列表（支持强制刷新）
     * @param sid - 空间 ID
     * @param forceRefresh - 是否强制刷新（忽略缓存）
     */
    const fetchTaskList = useCallback(
      async (sid: number, forceRefresh = false) => {
        if (!Number.isFinite(sid) || sid <= 0) {
          return [];
        }

        // 强制刷新时清空缓存
        if (forceRefresh) {
          cacheRef.current = null;
          fetchingRef.current = null;
        }

        // 已缓存且同空间：直接使用
        if (cacheRef.current?.spaceId === sid && !forceRefresh) {
          return cacheRef.current.list;
        }

        // 正在请求且同空间：复用 promise（避免重复请求）
        if (fetchingRef.current?.spaceId === sid && !forceRefresh) {
          return fetchingRef.current.promise;
        }

        const promise = (async () => {
          try {
            const resp = (await apiTaskList(sid)) as any;
            const list: TaskInfo[] = Array.isArray(resp)
              ? resp
              : Array.isArray(resp?.data)
              ? resp.data
              : [];
            cacheRef.current = { spaceId: sid, list };
            return list;
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('查询任务列表失败', e);
            cacheRef.current = { spaceId: sid, list: [] };
            return [];
          } finally {
            if (fetchingRef.current?.spaceId === sid) {
              fetchingRef.current = null;
            }
          }
        })();

        fetchingRef.current = { spaceId: sid, promise };
        return promise;
      },
      [],
    );

    /**
     * 刷新列表：清空缓存并重新请求接口（菜单切换触发）
     */
    const refreshList = useCallback(() => {
      cacheRef.current = null;
      fetchingRef.current = null;
      forceRefreshRef.current = true;
      isMenuRefreshRef.current = true; // 标记为菜单刷新
      formRef.current?.resetFields();
      // 重置表格状态
      actionRef.current?.reset?.();
      // 设置分页参数:第1页,每页10条
      actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
      actionRef.current?.reload();
    }, []);

    /**
     * 暴露给父组件的方法：刷新表格（清缓存并重新请求接口）
     */
    useImperativeHandle(
      ref,
      () => ({
        reload: refreshList,
      }),
      [refreshList],
    );

    /**
     * ProTable request 函数
     * - 点击查询按钮时：强制刷新，调用后端接口
     * - 分页切换时：使用本地缓存数据
     * - 筛选逻辑：在客户端完成（支持任务对象类型、任务名称搜索）
     */
    const request = useCallback(
      async (tableParams: Record<string, any>) => {
        const sid = Number(tableParams.spaceId ?? spaceId);
        const current = Number(tableParams.current || 1);
        const pageSize = Number(tableParams.pageSize || 15);

        // 先保存是否需要强制刷新的标志（点击查询按钮时为 true）
        const shouldForceRefresh = forceRefreshRef.current;
        const isMenuRefresh = isMenuRefreshRef.current;

        if (shouldForceRefresh) {
          forceRefreshRef.current = false; // 重置标志
        }
        if (isMenuRefresh) {
          isMenuRefreshRef.current = false; // 重置菜单刷新标志
        }

        // 搜索表单字段
        // 如果是菜单切换触发的刷新，忽略 tableParams 中的搜索条件，使用空条件
        // 如果是用户点击查询按钮，使用 tableParams 中的搜索条件
        const targetType = isMenuRefresh
          ? undefined
          : (tableParams.targetType as string | undefined);
        const taskName = isMenuRefresh
          ? undefined
          : (tableParams.taskName as string | undefined)?.trim();

        // 获取任务列表（根据标志决定是否使用缓存）
        const all = await fetchTaskList(sid, shouldForceRefresh);

        // 本地筛选
        let filtered = all;
        if (targetType) {
          filtered = filtered.filter((item) => item.targetType === targetType);
        }
        if (taskName) {
          const keyword = taskName.toLowerCase();
          filtered = filtered.filter((item) =>
            (item.taskName || '').toLowerCase().includes(keyword),
          );
        }

        // 本地分页（提升性能，避免每次分页都请求接口）
        const total = filtered.length;
        const start = (current - 1) * pageSize;
        const end = start + pageSize;
        const pageData = filtered.slice(start, end);

        return { data: pageData, total, success: true };
      },
      [fetchTaskList, spaceId],
    );

    /**
     * 执行任务
     */
    const handleExecuteTask = useCallback(
      async (id: number) => {
        const resp = await apiTaskExecute(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success('执行任务成功');
          refreshList();
        }
      },
      [refreshList],
    );

    /**
     * 启用定时任务
     */
    const handleEnableTask = useCallback(
      async (id: number) => {
        const resp = await apiTaskEnable(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success('启用任务成功');
          refreshList();
        }
      },
      [refreshList],
    );

    /**
     * 停用定时任务
     */
    const handleDisableTask = useCallback(
      async (id: number) => {
        const resp = await apiTaskDisable(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success('停用任务成功');
          refreshList();
        }
      },
      [refreshList],
    );

    /**
     * 删除任务
     */
    const handleDeleteTask = useCallback(
      async (id: number) => {
        const resp = await apiTaskDelete(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success('删除任务成功');
          refreshList();
        }
      },
      [refreshList],
    );

    const columns: ProColumns<TaskInfo>[] = useMemo(
      () => [
        {
          title: '任务类型',
          dataIndex: 'targetType',
          width: 110,
          valueType: 'select',
          valueEnum: {
            [AgentComponentTypeEnum.Agent]: { text: '智能体' },
            [AgentComponentTypeEnum.Workflow]: { text: '工作流' },
          },
          fieldProps: {
            placeholder: '请选择任务类型',
            allowClear: true,
          },
          render: (_: any, record: TaskInfo) => {
            const type = record.targetType;
            const text =
              type === AgentComponentTypeEnum.Agent
                ? '智能体'
                : type === AgentComponentTypeEnum.Workflow
                ? '工作流'
                : type || '-';
            return text;
          },
        },
        {
          title: '任务名称',
          dataIndex: 'taskName',
          width: 200,
          ellipsis: true,
          fieldProps: {
            placeholder: '请输入任务名称',
            allowClear: true,
          },
        },
        {
          title: '任务对象',
          dataIndex: 'targetName',
          hideInSearch: true,
          ellipsis: true,
          width: 200,
          render: (_: any, record: TaskInfo) => {
            return (
              <EllipsisWithAvatar
                avatarSrc={record.targetIcon}
                text={record.targetName}
              />
            );
          },
        },
        {
          title: '任务状态',
          dataIndex: 'status',
          width: 200,
          hideInSearch: true,
          render: (_: any, record: TaskInfo) => {
            const meta = getStatusMeta(record.status);
            return <Tag color={meta.color}>{meta.text}</Tag>;
          },
        },
        {
          title: '执行次数',
          dataIndex: 'execTimes',
          width: 90,
          hideInSearch: true,
        },
        {
          title: '最近执行时间',
          dataIndex: 'latestExecTime',
          width: 170,
          hideInSearch: true,
          valueType: 'dateTime',
        },
        {
          title: '下次执行时间',
          dataIndex: 'lockTime',
          width: 170,
          hideInSearch: true,
          valueType: 'dateTime',
        },
        {
          title: '创建人',
          dataIndex: ['creator', 'userName'],
          ellipsis: true,
          width: 170,
          hideInSearch: true,
        },
        {
          title: '创建时间',
          dataIndex: 'created',
          width: 170,
          hideInSearch: true,
          valueType: 'dateTime',
        },
        {
          title: '操作',
          align: 'center',
          valueType: 'option',
          fixed: 'right',
          width: 170,
          render: (_: any, record: TaskInfo) => {
            const meta = getStatusMeta(record.status);
            const isEnded = meta.isEnded;

            const actions = [
              {
                key: 'execute',
                label: '手动执行',
                onClick: (r: TaskInfo) => handleExecuteTask(r.id),
              },
              {
                key: 'enable',
                label: '启用',
                visible: () => isEnded,
                confirm: { title: '确认启用该任务？' },
                onClick: (r: TaskInfo) => handleEnableTask(r.id),
              },
              {
                key: 'disable',
                label: '停用',
                visible: () => !isEnded,
                confirm: { title: '确认停用该任务？' },
                onClick: (r: TaskInfo) => handleDisableTask(r.id),
              },
              {
                key: 'record',
                label: '执行记录',
                onClick: (r: TaskInfo) =>
                  history.push(
                    `/space/${r.spaceId}/library-log?targetType=${
                      r.targetType
                    }&targetId=${r.targetId ?? ''}&from=task_center`,
                  ),
              },
              {
                key: 'edit',
                label: '编辑',
                onClick: (r: TaskInfo) => onEdit(r),
              },
              {
                key: 'delete',
                label: '删除',
                confirm: { title: '确认删除该任务？' },
                onClick: (r: TaskInfo) => handleDeleteTask(r.id),
              },
            ];

            return <TableActions record={record} actions={actions} />;
          },
        },
      ],
      [getStatusMeta],
    );

    /**
     * 表单提交前的处理：设置强制刷新标志
     * 这样点击查询按钮时会调用后端接口
     */
    const beforeSearchSubmit = useCallback((params: Record<string, any>) => {
      forceRefreshRef.current = true;
      return params;
    }, []);

    // 重置后也需要强制刷新
    const handleReset = () => {
      // isReset.current = true;
      forceRefreshRef.current = true;
      // 重置表格状态
      actionRef.current?.reset?.();
      actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
      // 重新加载数据
      actionRef.current?.reload();
    };

    useEffect(() => {
      // 当通过菜单切换页面时（history.location.state 变化），触发刷新
      if (history.location.state) {
        refreshList();
      }
    }, [history.location.state, refreshList]);

    return (
      <XProTable<TaskInfo>
        formRef={formRef}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        params={{ spaceId }}
        // 表单提交前处理：点击查询按钮时设置强制刷新标志
        beforeSearchSubmit={beforeSearchSubmit}
        // 重置后也需要强制刷新
        onReset={handleReset}
      />
    );
  },
);

export default CenterProTable;
