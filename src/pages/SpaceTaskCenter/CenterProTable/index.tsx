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
import { Avatar, Button, Popconfirm, Space, Tag, message } from 'antd';
import dayjs from 'dayjs';
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { history, useParams } from 'umi';

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
 * 需求：
 * - 初始化只请求一次任务列表（apiTaskList）
 * - 本地分页：分页切换不再请求接口（只在内存中做 slice）
 * - 筛选：
 *   - 任务对象：智能体 / 工作流（targetType）
 *   - 任务名称：模糊搜索（taskName）
 */
const CenterProTable = forwardRef<CenterProTableRef, CenterProTableProps>(
  ({ onEdit = () => {} }, ref) => {
    const params = useParams();
    const spaceId = Number(params.spaceId);
    const actionRef = useRef<ActionType>();

    // 缓存：确保仅在首次加载时请求一次接口
    const cacheRef = useRef<{
      spaceId: number;
      list: TaskInfo[];
    } | null>(null);

    // 防止首屏时 request 被多次触发导致并发请求
    const fetchingRef = useRef<{
      spaceId: number;
      promise: Promise<TaskInfo[]>;
    } | null>(null);

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
     * 仅在首次加载时请求一次任务列表
     */
    const ensureTaskList = useCallback(async (sid: number) => {
      if (!Number.isFinite(sid) || sid <= 0) {
        return [];
      }

      // 已缓存且同空间：直接使用
      if (cacheRef.current?.spaceId === sid) {
        return cacheRef.current.list;
      }

      // 正在请求且同空间：复用 promise
      if (fetchingRef.current?.spaceId === sid) {
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
    }, []);

    // 暴露给父组件：刷新表格（清缓存 + reload）
    useImperativeHandle(
      ref,
      () => ({
        reload: () => {
          cacheRef.current = null;
          fetchingRef.current = null;
          actionRef.current?.reload();
        },
      }),
      [],
    );

    /**
     * ProTable request：只做一次接口获取；分页/筛选在本地完成
     */
    const request = useCallback(
      async (tableParams: Record<string, any>) => {
        const sid = Number(tableParams.spaceId ?? spaceId);
        const current = Number(tableParams.current || 1);
        const pageSize = Number(tableParams.pageSize || 10);

        // 搜索表单字段
        const targetType = tableParams.targetType as string | undefined;
        const taskName = (tableParams.taskName as string | undefined)?.trim();

        const all = await ensureTaskList(sid);

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

        // 本地分页（不请求接口）
        const total = filtered.length;
        const start = (current - 1) * pageSize;
        const end = start + pageSize;
        const pageData = filtered.slice(start, end);

        return { data: pageData, total, success: true };
      },
      [ensureTaskList, spaceId],
    );

    // 执行任务
    const handleExecuteTask = useCallback(
      async (id: number) => {
        const resp = await apiTaskExecute(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success('执行任务成功');
          // 执行成功后需要重新请求接口刷新列表：清空缓存并触发表格 reload
          cacheRef.current = null;
          fetchingRef.current = null;
          actionRef.current?.reload();
        }
      },
      [actionRef, cacheRef, fetchingRef],
    );

    // 启用定时任务
    const handleEnableTask = useCallback(
      async (id: number) => {
        const resp = await apiTaskEnable(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success('启用任务成功');
          // 执行成功后需要重新请求接口刷新列表：清空缓存并触发表格 reload
          cacheRef.current = null;
          fetchingRef.current = null;
          actionRef.current?.reload();
        }
      },
      [actionRef],
    );

    // 停用定时任务
    const handleDisableTask = useCallback(
      async (id: number) => {
        const resp = await apiTaskDisable(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success('停用任务成功');
          // 执行成功后需要重新请求接口刷新列表：清空缓存并触发表格 reload
          cacheRef.current = null;
          fetchingRef.current = null;
          actionRef.current?.reload();
        }
      },
      [actionRef],
    );

    // 删除任务
    const handleDeleteTask = useCallback(
      async (id: number) => {
        modalConfirm('提示', '确认删除该任务？', async () => {
          const resp = await apiTaskDelete(id);
          if (resp?.code === SUCCESS_CODE) {
            message.success('删除任务成功');
            // 执行成功后需要重新请求接口刷新列表：清空缓存并触发表格 reload
            cacheRef.current = null;
            fetchingRef.current = null;
            actionRef.current?.reload();
          }
        });
      },
      [actionRef, cacheRef, fetchingRef],
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
          render: (_: any, record: TaskInfo) => {
            return (
              <Space size={8}>
                <Avatar size={24} src={record.targetIcon} />
                <span>{record.targetName || record.targetId || '-'}</span>
              </Space>
            );
          },
        },
        {
          title: '任务状态',
          dataIndex: 'status',
          width: 110,
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
          width: 110,
          hideInSearch: true,
          render: (_: any, record: TaskInfo) => record.creator?.userName || '-',
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
          width: 220,
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

    return (
      <ProTable<TaskInfo>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        params={{ spaceId }}
        // 开启表格自身横向滚动，fixed 列才会固定不跟随滚动
        scroll={{ x: 'max-content' }}
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
      />
    );
  },
);

export default CenterProTable;
