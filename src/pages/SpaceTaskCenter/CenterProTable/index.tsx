import CustomPopover from '@/components/CustomPopover';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { ICON_MORE } from '@/constants/images.constants';
import { TASK_CENTER_MORE_ACTION } from '@/constants/library.constants';
import {
  apiTaskDelete,
  apiTaskDisable,
  apiTaskEnable,
  apiTaskExecute,
  apiTaskList,
} from '@/services/library';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { TaskCenterMoreActionEnum } from '@/types/enums/pageDev';
import { CustomPopoverItem } from '@/types/interfaces/common';
import type { TaskInfo } from '@/types/interfaces/library';
import { modalConfirm } from '@/utils/ant-custom';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, Space, Tag, message } from 'antd';
import dayjs from 'dayjs';
import {
  forwardRef,
  useCallback,
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

    /**
     * 安全格式化时间：兼容 number/字符串/空值
     */
    const formatDateTime = useCallback((value?: string | number) => {
      if (value === undefined || value === null || value === '') {
        return '-';
      }
      const d = dayjs(value);
      return d.isValid() ? d.format('YYYY-MM-DD HH:mm:ss') : String(value);
    }, []);

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
            message.error('查询任务列表失败');
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
     * 刷新列表：清空缓存并重新请求接口
     */
    const refreshList = useCallback(() => {
      cacheRef.current = null;
      fetchingRef.current = null;
      forceRefreshRef.current = true;
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
        const pageSize = Number(tableParams.pageSize || 10);

        // 搜索表单字段
        const targetType = tableParams.targetType as string | undefined;
        const taskName = (tableParams.taskName as string | undefined)?.trim();

        // 检查是否需要强制刷新（点击查询按钮）
        const shouldForceRefresh = forceRefreshRef.current;
        forceRefreshRef.current = false; // 重置标志

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
        modalConfirm('提示', '确认删除该任务？', async () => {
          const resp = await apiTaskDelete(id);
          if (resp?.code === SUCCESS_CODE) {
            message.success('删除任务成功');
            refreshList();
          }
        });
      },
      [refreshList],
    );

    // 点击更多操作
    const onClickMore = (item: CustomPopoverItem, info: TaskInfo) => {
      const { action } = item as unknown as {
        action: TaskCenterMoreActionEnum;
      };
      switch (action) {
        case TaskCenterMoreActionEnum.Edit:
          onEdit(info);
          break;
        case TaskCenterMoreActionEnum.Record:
          history.push(
            `/space/${spaceId}/library-log?targetType=${
              info.targetType
            }&targetId=${info.targetId ?? ''}&from=task_center`,
          );
          break;
        case TaskCenterMoreActionEnum.Delete:
          handleDeleteTask(info.id);
          break;
        case TaskCenterMoreActionEnum.Enable:
          handleEnableTask(info.id);
          break;
        case TaskCenterMoreActionEnum.Disable:
          handleDisableTask(info.id);
          break;
        case TaskCenterMoreActionEnum.Execute:
          handleExecuteTask(info.id);
          break;
        default:
          break;
      }
    };

    const getMoreActionList = () => {
      return TASK_CENTER_MORE_ACTION.filter((item) => {
        return ![
          TaskCenterMoreActionEnum.Enable,
          TaskCenterMoreActionEnum.Disable,
          TaskCenterMoreActionEnum.Execute,
        ].includes(item.action as TaskCenterMoreActionEnum);
      });
    };

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
          ellipsis: true,
          fieldProps: {
            placeholder: '请输入任务名称（模糊搜索）',
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
          render: (dom: any) => formatDateTime(dom),
        },
        {
          title: '下次执行时间',
          dataIndex: 'lockTime',
          width: 170,
          hideInSearch: true,
          render: (dom: any) => formatDateTime(dom),
        },
        {
          title: '创建人',
          dataIndex: ['creator', 'userName'],
          ellipsis: true,
          width: 170,
          hideInSearch: true,
          // render: (_: any, record: TaskInfo) => record.creator?.userName || '-',
        },
        {
          title: '创建时间',
          dataIndex: 'created',
          width: 170,
          hideInSearch: true,
          render: (dom: any) => formatDateTime(dom),
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
            return (
              <Space size={0}>
                <Button
                  type="link"
                  size="small"
                  onClick={() => {
                    handleExecuteTask(record.id);
                  }}
                >
                  手动执行
                </Button>
                {isEnded ? (
                  <Popconfirm
                    title="确认启用该任务？"
                    okText="确认"
                    cancelText="取消"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleEnableTask(record.id);
                    }}
                  >
                    <Button type="link" size="small">
                      启用
                    </Button>
                  </Popconfirm>
                ) : (
                  <Popconfirm
                    title="确认停用该任务？"
                    okText="确认"
                    cancelText="取消"
                    onConfirm={(e) => {
                      e?.stopPropagation();
                      handleDisableTask(record.id);
                    }}
                  >
                    <Button type="link" size="small">
                      停用
                    </Button>
                  </Popconfirm>
                )}

                {/*更多操作*/}
                <CustomPopover
                  list={getMoreActionList()}
                  onClick={(item) => {
                    onClickMore(item, record);
                  }}
                >
                  <Button
                    size="small"
                    type="link"
                    icon={<ICON_MORE />}
                  ></Button>
                </CustomPopover>
              </Space>
            );
          },
        },
      ],
      [formatDateTime, getStatusMeta],
    );

    /**
     * 表单提交前的处理：设置强制刷新标志
     * 这样点击查询按钮时会调用后端接口
     */
    const beforeSearchSubmit = useCallback((params: Record<string, any>) => {
      forceRefreshRef.current = true;
      return params;
    }, []);

    return (
      <ProTable<TaskInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        params={{ spaceId }}
        debounceTime={300}
        toolBarRender={false}
        options={false}
        cardProps={{ bodyStyle: { padding: 0 } }}
        pagination={{
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) => `共 ${total} 条`,
          defaultPageSize: 10,
        }}
        search={{
          span: 6,
          labelWidth: 70,
          defaultCollapsed: true,
          style: {
            paddingTop: 0,
            paddingBottom: 0,
            paddingLeft: 0,
            paddingRight: 0,
          },
        }}
        // 表单提交前处理：点击查询按钮时设置强制刷新标志
        beforeSearchSubmit={beforeSearchSubmit}
        // 重置后也需要强制刷新
        onReset={() => {
          forceRefreshRef.current = true;
        }}
      />
    );
  },
);

export default CenterProTable;
