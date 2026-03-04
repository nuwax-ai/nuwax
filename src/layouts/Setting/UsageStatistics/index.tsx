import { XProTable } from '@/components/ProComponents';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import type { UserMetricUsageInfo } from '@/services/account';
import { apiGetUserMetricUsage } from '@/services/account';
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
   * 从 UsageInfo 数组中取第一个元素并格式化
   */
  const formatFirstUsage = (
    list?: { usage: string; limit: string; description: string }[] | null,
  ) => {
    if (!list || list.length === 0) return '--';
    return formatUsageInfo(list[0]);
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
          type: '使用TOKEN上限',
          daily: formatUsageInfo(usage.todayTokenUsage),
          other: '--',
        },
        {
          key: 'agentPrompt',
          type: '通用智能体对话次数',
          daily: formatUsageInfo(usage.todayAgentPromptUsage),
          other: '--',
        },
        {
          key: 'pagePrompt',
          type: '网页应用开发对话次数',
          daily: formatFirstUsage(usage.todayPageAppPromptUsage),
          other: '--',
        },
        {
          key: 'workspace',
          type: '可创建工作空间数量',
          daily: '--',
          other: formatFirstUsage(usage.newWorkspaceUsage),
        },
        {
          key: 'agent',
          type: '可创建智能体数量',
          daily: '--',
          other: formatFirstUsage(usage.newAgentUsage),
        },
        {
          key: 'pageApp',
          type: '可创建网页应用数量',
          daily: '--',
          other: formatFirstUsage(usage.newPageAppUsage),
        },
        {
          key: 'knowledgeBase',
          type: '可创建知识库数量',
          daily: '--',
          other: formatFirstUsage(usage.newKnowledgeBaseUsage),
        },
        {
          key: 'kbStorage',
          type: '知识库存储上限',
          daily: '--',
          other: formatFirstUsage(usage.knowledgeBaseStorageUsage),
        },
        {
          key: 'table',
          type: '可创建数据表数量',
          daily: '--',
          other: formatFirstUsage(usage.newTableUsage),
        },
        {
          key: 'task',
          type: '可创建定时任务数量',
          daily: '--',
          other: formatFirstUsage(usage.newTaskUsage),
        },
        {
          key: 'sandboxMemory',
          type: '智能体电脑最大内存',
          daily: '--',
          other: formatFirstUsage(usage.sandboxMemoryLimit),
        },
      ];

      return {
        data: rows,
        success: true,
      };
    } catch (error) {
      console.error('获取用量统计失败:', error);
      return {
        data: [] as UsageTableItem[],
        success: false,
      };
    }
  }, []);

  const columns: ProColumns<UsageTableItem>[] = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 220,
    },
    {
      title: '每日',
      dataIndex: 'daily',
      key: 'daily',
      width: 200,
    },
    {
      title: '其他数量',
      dataIndex: 'other',
      key: 'other',
      width: 200,
    },
  ];

  return (
    <div className={cx(styles.container)}>
      <h3>用量统计</h3>
      <div className={cx('text-right')}>
        <Button
          type="primary"
          className={cx(styles.btn)}
          onClick={() => {
            actionRef.current?.reload?.();
          }}
        >
          查询
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
