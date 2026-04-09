import { XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import type { UserMetricUsageInfo } from '@/services/account';
import { apiGetUserMetricUsage } from '@/services/account';
import { dict } from '@/services/i18nRuntime';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useRef } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 用量统计表格行数据
 */
interface UsageTableItem {
  /** 行唯一标识 */
  key: string;
  /** 类型名称（如：使用TOKEN上限） */
  type: string;
  /** 每日用量展示 */
  daily: string;
  /** 其他数量展示（如总额度 / 存储上限等） */
  other: string;
}

/**
 * 用量统计
 */
const UsageStatistics: React.FC = () => {
  // 表格操作引用，用于手动触发刷新
  const actionRef = useRef<ActionType>();
  /**
   * 将接口返回的 UsageInfo 转换为展示文案
   * 优先使用 description，其次使用 usage/limit 组合
   */
  const formatUsageInfo = (
    info?: { usage: string; limit: string; description: string } | null,
  ) => {
    if (!info) return '--';
    if (info.description) return info.description;
    if (info.usage && info.limit) return `${info.usage}/${info.limit}`;
    if (info.usage) return info.usage;
    if (info.limit) return info.limit;
    return '--';
  };

  /**
   * XProTable 请求数据方法
   * 这里不需要分页和查询，仅将接口返回的数据转换为静态行
   */
  const request = useCallback(async () => {
    try {
      const res = await apiGetUserMetricUsage();
      if (!res || res.code !== SUCCESS_CODE || !res.data) {
        return {
          data: [] as UsageTableItem[],
          success: false,
        };
      }

      const usage: UserMetricUsageInfo = res.data;

      const rows: UsageTableItem[] = [
        {
          key: 'token',
          type: dict('PC.Layouts.Setting.UsageStatistics.tokenLimit'),
          daily: formatUsageInfo(usage.todayTokenUsage),
          other: '--',
        },
        {
          key: 'agentPrompt',
          type: dict('PC.Layouts.Setting.UsageStatistics.agentPrompt'),
          daily: formatUsageInfo(usage.todayAgentPromptUsage),
          other: '--',
        },
        {
          key: 'pagePrompt',
          type: dict('PC.Layouts.Setting.UsageStatistics.pagePrompt'),
          daily: formatUsageInfo(usage.todayPageAppPromptUsage),
          other: '--',
        },
        {
          key: 'workspace',
          type: dict('PC.Layouts.Setting.UsageStatistics.workspace'),
          daily: '--',
          other: formatUsageInfo(usage.newWorkspaceUsage),
        },
        {
          key: 'agent',
          type: dict('PC.Layouts.Setting.UsageStatistics.agent'),
          daily: '--',
          other: formatUsageInfo(usage.newAgentUsage),
        },
        {
          key: 'pageApp',
          type: dict('PC.Layouts.Setting.UsageStatistics.pageApp'),
          daily: '--',
          other: formatUsageInfo(usage.newPageAppUsage),
        },
        {
          key: 'knowledgeBase',
          type: dict('PC.Layouts.Setting.UsageStatistics.knowledgeBase'),
          daily: '--',
          other: formatUsageInfo(usage.newKnowledgeBaseUsage),
        },
        {
          key: 'kbStorage',
          type: dict('PC.Layouts.Setting.UsageStatistics.kbStorage'),
          daily: '--',
          other: formatUsageInfo(usage.knowledgeBaseStorageUsage),
        },
        {
          key: 'table',
          type: dict('PC.Layouts.Setting.UsageStatistics.table'),
          daily: '--',
          other: formatUsageInfo(usage.newTableUsage),
        },
        {
          key: 'task',
          type: dict('PC.Layouts.Setting.UsageStatistics.task'),
          daily: '--',
          other: formatUsageInfo(usage.newTaskUsage),
        },
        {
          key: 'sandboxMemory',
          type: dict('PC.Layouts.Setting.UsageStatistics.sandboxMemory'),
          daily: '--',
          other: formatUsageInfo(usage.sandboxMemoryLimit),
        },
      ];

      return {
        data: rows,
        success: true,
      };
    } catch (error) {
      console.error('Failed to get usage statistics:', error);
      return {
        data: [] as UsageTableItem[],
        success: false,
      };
    }
  }, []);

  const columns: ProColumns<UsageTableItem>[] = [
    {
      title: dict('PC.Layouts.Setting.UsageStatistics.columnType'),
      dataIndex: 'type',
      key: 'type',
      width: 220,
    },
    {
      title: dict('PC.Layouts.Setting.UsageStatistics.columnDaily'),
      dataIndex: 'daily',
      key: 'daily',
      width: 200,
    },
    {
      title: dict('PC.Layouts.Setting.UsageStatistics.columnOther'),
      dataIndex: 'other',
      key: 'other',
      width: 200,
    },
  ];

  return (
    <div className={cx(styles.container)}>
      <h3>{dict('PC.Layouts.Setting.UsageStatistics.title')}</h3>
      <div className={cx('text-right')}>
        <Button
          type="primary"
          className={cx(styles.btn)}
          onClick={() => {
            actionRef.current?.reload?.();
          }}
        >
          {dict('PC.Layouts.Setting.UsageStatistics.query')}
        </Button>
      </div>
      <XProTable<UsageTableItem>
        actionRef={actionRef}
        rowKey="key"
        columns={columns}
        request={request}
        search={false}
        pagination={false}
        showQueryButtons={false}
      />
    </div>
  );
};

export default UsageStatistics;
