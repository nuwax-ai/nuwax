import { TableActions, XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';

import {
  apiSystemTaskCancel,
  apiSystemTaskDelete,
  apiSystemTaskEnable,
  apiSystemTaskExecute,
  apiSystemTaskList,
} from '@/services/systemManage';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import type { TaskInfo } from '@/types/interfaces/library';
import type {
  ActionType,
  FormInstance,
  ProColumns,
} from '@ant-design/pro-components';
import { message, Tag } from 'antd';
import qs from 'qs';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { history, useLocation, useModel } from 'umi';
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
    const { hasPermission } = useModel('menuModel');
    const actionRef = useRef<ActionType>();
    // 中间变量用于判断是否是点击重置按钮
    const isReset = useRef(false);

    // 表单引用
    const formRef = useRef<FormInstance>();
    const location = useLocation();

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
            text: t('PC.Pages.SystemTaskCenterProTable.statusExecuting'),
            isEnded: false,
          };
        case 'CREATE':
          return {
            color: 'warning' as const,
            text: t('PC.Pages.SystemTaskCenterProTable.statusCreatedWaiting'),
            isEnded: false,
          };
        case 'CONTINUE':
          return {
            color: 'success' as const,
            text: t(
              'PC.Pages.SystemTaskCenterProTable.statusSuccessWaitingNext',
            ),
            isEnded: false,
          };
        case 'FAIL':
          return {
            color: 'error' as const,
            text: t(
              'PC.Pages.SystemTaskCenterProTable.statusFailedWaitingNext',
            ),
            isEnded: false,
          };
        case 'CANCEL':
        case 'COMPLETE':
          return {
            color: 'default' as const,
            text: t('PC.Pages.SystemTaskCenterProTable.statusEndedNoMore'),
            isEnded: true,
          };
        case 'OVERFLOW_MAX_EXEC_TIMES':
          return {
            color: 'default' as const,
            text: t('PC.Pages.SystemTaskCenterProTable.statusEndedNoMore'),
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
     * 刷新列表：重新请求接口（菜单切换或操作后触发）
     */
    const refreshList = useCallback(() => {
      formRef.current?.resetFields();
      // 重置表格状态并回到第一页
      actionRef.current?.reloadAndRest?.();
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
     * 已对接后端正式接口：/api/system/task/list
     * 请求参数 spaceId 固定为 0，支持服务端分页与搜索条件透传
     */
    const request = useCallback(async (_tableParams: Record<string, any>) => {
      let tableParams = _tableParams;
      // 判断是否是点击重置按钮
      if (isReset.current) {
        isReset.current = false;
        // 重置表单
        formRef.current?.resetFields();
        // 删除查询参数
        tableParams = {
          current: tableParams.current,
          pageSize: tableParams.pageSize,
        };
      }
      const { current, pageSize, taskName, creatorName, creator } = tableParams;
      // 处理嵌套搜索参数: creator.userName -> creatorName
      const searchCreatorName = creatorName || creator?.userName;

      try {
        const resp = await apiSystemTaskList({
          pageNo: current || 1,
          pageSize: pageSize || 15,
          name: taskName?.trim(),
          creatorName: searchCreatorName?.trim(),
        });

        if (resp?.code === SUCCESS_CODE) {
          return {
            data: resp.data?.records || [],
            total: resp.data?.total || 0,
            success: true,
          };
        }
        return { data: [], total: 0, success: false };
      } catch (e) {
        console.error('Failed to query task list', e);
        return { data: [], total: 0, success: false };
      }
    }, []);

    /**
     * 执行任务
     */
    const handleExecuteTask = useCallback(
      async (id: number) => {
        const resp = await apiSystemTaskExecute(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success(
            t('PC.Pages.SystemTaskCenterProTable.executeTaskSuccess'),
          );
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
        const resp = await apiSystemTaskEnable(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success(
            t('PC.Pages.SystemTaskCenterProTable.enableTaskSuccess'),
          );
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
        const resp = await apiSystemTaskCancel(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success(
            t('PC.Pages.SystemTaskCenterProTable.disableTaskSuccess'),
          );
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
        const resp = await apiSystemTaskDelete(id);
        if (resp?.code === SUCCESS_CODE) {
          message.success(
            t('PC.Pages.SystemTaskCenterProTable.deleteTaskSuccess'),
          );
          refreshList();
        }
      },
      [refreshList],
    );

    const columns: ProColumns<TaskInfo>[] = useMemo(
      () => [
        {
          title: t('PC.Pages.SystemTaskCenterProTable.taskType'),
          dataIndex: 'targetType',
          width: 110,
          hideInSearch: true,
          valueType: 'select',
          valueEnum: {
            [AgentComponentTypeEnum.Agent]: {
              text: t('PC.Pages.SystemTaskCenterProTable.agent'),
            },
            [AgentComponentTypeEnum.Workflow]: {
              text: t('PC.Pages.SystemTaskCenterProTable.workflow'),
            },
          },
          fieldProps: {
            placeholder: t('PC.Pages.SystemTaskCenterProTable.selectTaskType'),
            allowClear: true,
          },
          render: (_: any, record: TaskInfo) => {
            const type = record.targetType;
            const text =
              type === AgentComponentTypeEnum.Agent
                ? t('PC.Pages.SystemTaskCenterProTable.agent')
                : type === AgentComponentTypeEnum.Workflow
                ? t('PC.Pages.SystemTaskCenterProTable.workflow')
                : type || '-';
            return text;
          },
        },
        {
          title: t('PC.Pages.SystemTaskCenterProTable.taskName'),
          dataIndex: 'taskName',
          width: 200,
          ellipsis: true,
          fieldProps: {
            placeholder: t('PC.Pages.SystemTaskCenterProTable.enterTaskName'),
            allowClear: true,
          },
        },
        {
          title: t('PC.Pages.SystemTaskCenterProTable.taskTarget'),
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
          title: t('PC.Pages.SystemTaskCenterProTable.taskStatus'),
          dataIndex: 'status',
          width: 200,
          hideInSearch: true,
          render: (_: any, record: TaskInfo) => {
            const meta = getStatusMeta(record.status);
            return <Tag color={meta.color}>{meta.text}</Tag>;
          },
        },
        {
          title: t('PC.Pages.SystemTaskCenterProTable.executionTimes'),
          dataIndex: 'execTimes',
          width: 90,
          hideInSearch: true,
        },
        {
          title: t('PC.Pages.SystemTaskCenterProTable.latestExecutionTime'),
          dataIndex: 'latestExecTime',
          width: 170,
          hideInSearch: true,
          valueType: 'dateTime',
        },
        {
          title: t('PC.Pages.SystemTaskCenterProTable.nextExecutionTime'),
          dataIndex: 'lockTime',
          width: 170,
          hideInSearch: true,
          valueType: 'dateTime',
        },
        {
          title: t('PC.Pages.SystemTaskCenterProTable.creator'),
          dataIndex: ['creator', 'userName'],
          ellipsis: true,
          width: 170,
          fieldProps: {
            placeholder: t('PC.Pages.SystemTaskCenterProTable.enterCreator'),
            allowClear: true,
          },
        },
        {
          title: t('PC.Pages.SystemTaskCenterProTable.createdTime'),
          dataIndex: 'created',
          width: 170,
          hideInSearch: true,
          valueType: 'dateTime',
        },
        {
          title: t('PC.Pages.SystemTaskCenterProTable.actions'),
          align: 'center',
          valueType: 'option',
          fixed: 'right',
          width: 170,
          render: (_: any, record: TaskInfo) => {
            const meta = getStatusMeta(record.status);
            const isEnded = meta.isEnded;
            return (
              <TableActions
                record={record}
                actions={[
                  {
                    key: 'execute',
                    label: t('PC.Pages.SystemTaskCenterProTable.manualExecute'),
                    disabled: !hasPermission('task_manage_execute_manual'),
                    onClick: () => handleExecuteTask(record.id),
                  },
                  {
                    key: 'enable',
                    label: t('PC.Pages.SystemTaskCenterProTable.enable'),
                    visible: () => isEnded,
                    disabled: !hasPermission('task_manage_enable'),
                    confirm: {
                      title: t(
                        'PC.Pages.SystemTaskCenterProTable.confirmEnableTask',
                      ),
                    },
                    onClick: () => handleEnableTask(record.id),
                  },
                  {
                    key: 'disable',
                    label: t('PC.Pages.SystemTaskCenterProTable.disable'),
                    visible: () => !isEnded,
                    disabled: !hasPermission('task_manage_cancel'),
                    confirm: {
                      title: t(
                        'PC.Pages.SystemTaskCenterProTable.confirmDisableTask',
                      ),
                    },
                    onClick: () => handleDisableTask(record.id),
                  },
                  {
                    key: 'edit',
                    label: t('PC.Pages.SystemTaskCenterProTable.edit'),
                    disabled: !hasPermission('task_manage_modify'),
                    onClick: () => onEdit(record),
                  },
                  {
                    key: 'record',
                    label: t(
                      'PC.Pages.SystemTaskCenterProTable.executionRecord',
                    ),
                    disabled: !hasPermission('task_manage_execute_record'),
                    onClick: () => {
                      const baseUrl = '/system/log-query/running-log';
                      const params = {
                        targetType: record.targetType,
                        targetId: record.targetId,
                      };
                      history.push(`${baseUrl}?${qs.stringify(params)}`);
                    },
                  },
                  {
                    key: 'delete',
                    label: t('PC.Pages.SystemTaskCenterProTable.delete'),
                    disabled: !hasPermission('task_manage_delete'),
                    confirm: {
                      title: t(
                        'PC.Pages.SystemTaskCenterProTable.confirmDeleteTask',
                      ),
                    },
                    onClick: () => handleDeleteTask(record.id),
                  },
                ]}
              />
            );
          },
        },
      ],
      [
        getStatusMeta,
        handleDeleteTask,
        handleDisableTask,
        handleEnableTask,
        handleExecuteTask,
        onEdit,
      ],
    );

    /**
     * 表单提交前的处理
     */
    const beforeSearchSubmit = useCallback((params: Record<string, any>) => {
      return params;
    }, []);

    // 重置表格
    const handleReset = () => {
      isReset.current = true;
      // 重置表格状态
      actionRef.current?.reset?.();
      // 设置分页参数:第1页,每页10条
      actionRef.current?.setPageInfo?.({ current: 1, pageSize: 15 });
      // 延迟一下再重新加载,确保分页参数已设置
      actionRef.current?.reload();
    };

    useEffect(() => {
      // 当通过菜单切换页面时，触发刷新
      const state = location.state as any;
      if (state?._t) {
        refreshList();
      }
    }, [location.state, refreshList]);

    return (
      <XProTable<TaskInfo>
        formRef={formRef}
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        request={request}
        // 表单提交前处理
        beforeSearchSubmit={beforeSearchSubmit}
        // 重置
        onReset={handleReset}
        showQueryButtons={hasPermission('task_manage_query_list')}
      />
    );
  },
);

export default CenterProTable;
