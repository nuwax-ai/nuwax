import WorkspaceLayout from '@/components/WorkspaceLayout';
import {
  apiGetAccessStats,
  apiGetConversationStats,
  apiGetTotalStats,
  apiGetUserStats,
} from '@/services/systemManage';
import type {
  AccessStatsResult,
  ConversationStatsResult,
  TotalStatsResult,
  UserStatsResult,
} from '@/types/interfaces/systemManage';
import {
  ApiOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  CodeOutlined,
  CommentOutlined,
  DesktopOutlined,
  EyeOutlined,
  FolderOutlined,
  SyncOutlined,
  TableOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import { Col, Row } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'umi';
import { ResourceGrid, SessionStats, StatCard, TrendChart } from './components';
import styles from './index.less';

const cx = classNames.bind(styles);

const Dashboard: React.FC = () => {
  const location = useLocation();
  const [hasAccessLoaded, setHasAccessLoaded] = useState(false);
  const {
    data: accessStats,
    loading: accessLoading,
    refresh: refreshAccess,
  } = useRequest(apiGetAccessStats, {
    onSuccess: () => setHasAccessLoaded(true),
  });
  const [userPeriod, setUserPeriod] = useState<'7d' | '30d' | 'month'>('7d');
  const [hasUserLoaded, setHasUserLoaded] = useState(false);
  const {
    data: userStats,
    loading: userLoading,
    refresh: refreshUser,
  } = useRequest(apiGetUserStats, {
    onSuccess: () => setHasUserLoaded(true),
  });

  const [hasTotalLoaded, setHasTotalLoaded] = useState(false);
  const {
    data: totalStats,
    loading: totalLoading,
    refresh: refreshTotal,
  } = useRequest(apiGetTotalStats, {
    onSuccess: () => setHasTotalLoaded(true),
  });

  const [conversationPeriod, setConversationPeriod] = useState<
    '7d' | '30d' | 'month'
  >('7d');
  const [hasConversationLoaded, setHasConversationLoaded] = useState(false);
  const {
    data: conversationStats,
    loading: conversationLoading,
    refresh: refreshConversation,
  } = useRequest(apiGetConversationStats, {
    onSuccess: () => setHasConversationLoaded(true),
  });

  // 监听 location.state 变化，用于菜单点击刷新
  useEffect(() => {
    const state = location.state as any;
    if (state?._t) {
      // 重置加载标识，使骨架屏显示
      setHasAccessLoaded(false);
      setHasUserLoaded(false);
      setHasTotalLoaded(false);
      setHasConversationLoaded(false);

      // 刷新所有数据
      refreshAccess();
      refreshUser();
      refreshTotal();
      refreshConversation();
      // 重置时间维度
      setUserPeriod('7d');
      setConversationPeriod('7d');
    }
  }, [location.state]);

  // 映射核心统计
  const coreStats = useMemo(() => {
    const result = (accessStats as any)?.data || accessStats;
    const data = result as AccessStatsResult | undefined;
    const userResult = (userStats as any)?.data || userStats;
    const userData = userResult as UserStatsResult | undefined;

    const isCoreStatsLoading =
      (!hasUserLoaded && userLoading) || (!hasAccessLoaded && accessLoading);

    return [
      {
        title: '总用户数',
        value: userData?.totalUserCount || 0,
        icon: <TeamOutlined />,
        iconColor: '#1890ff',
        iconBgColor: '#e6f7ff',
        loading: isCoreStatsLoading,
      },
      {
        title: '今日新增用户',
        value: userData?.todayNewUserCount || 0,
        icon: <UserAddOutlined />,
        iconColor: '#52c41a',
        iconBgColor: '#f6ffed',
        loading: isCoreStatsLoading,
      },
      {
        title: '今日访问量',
        value: data?.todayUserCount || 0,
        icon: <EyeOutlined />,
        iconColor: '#722ed1',
        iconBgColor: '#f9f0ff',
        loading: isCoreStatsLoading,
      },
      {
        title: '30日总访问量',
        value: data?.last30DaysUserCount || 0,
        icon: <BarChartOutlined />,
        iconColor: '#fa8c16',
        iconBgColor: '#fff7e6',
        loading: isCoreStatsLoading,
      },
    ];
  }, [accessStats, accessLoading, userLoading, hasUserLoaded, hasAccessLoaded]);

  // 映射用户新增趋势
  const userTrendData = useMemo(() => {
    const userResult = (userStats as any)?.data || userStats;
    const userData = userResult as UserStatsResult | undefined;
    if (!userData) return [];

    let trendData: any[] = [];
    if (userPeriod === '7d') {
      trendData = userData.last7DaysTrend || [];
    } else if (userPeriod === '30d') {
      trendData = userData.last30DaysTrend || [];
    } else if (userPeriod === 'month') {
      trendData = userData.monthlyTrend || [];
    }

    return trendData.map((item: any) => ({
      date: item.date,
      value: item.userCount,
    }));
  }, [userStats, userPeriod]);

  // 映射访问趋势
  const visitTrendData = useMemo(() => {
    const result = (accessStats as any)?.data || accessStats;
    return (
      (result as AccessStatsResult)?.last7DaysTrend?.map((item) => ({
        date: item.date,
        value: item.userCount,
      })) || []
    );
  }, [accessStats]);

  // 映射资源概览
  const resources = useMemo(() => {
    const result = (totalStats as any)?.data || totalStats;
    const data = result as TotalStatsResult | undefined;

    return [
      {
        name: '工作空间',
        count: data?.spaceCount || 0,
        icon: <FolderOutlined />,
        color: '#597ef7',
        bgColor: '#f0f5ff',
      },
      {
        name: '智能体',
        count: data?.agentCount || 0,
        icon: <TeamOutlined />,
        color: '#1890ff',
        bgColor: '#e6f7ff',
      },
      {
        name: '知识库',
        count: data?.knowledgeCount || 0,
        icon: <BookOutlined />,
        color: '#13c2c2',
        bgColor: '#e6fffb',
      },
      {
        name: '工作流',
        count: data?.workflowCount || 0,
        icon: <SyncOutlined />,
        color: '#52c41a',
        bgColor: '#f6ffed',
      },
      {
        name: '数据表',
        count: data?.tableCount || 0,
        icon: <TableOutlined />,
        color: '#faad14',
        bgColor: '#fffbe6',
      },
      {
        name: 'MCP',
        count: data?.mcpCount || 0,
        icon: <CodeOutlined />,
        color: '#722ed1',
        bgColor: '#f9f0ff',
      },
      {
        name: '网页应用',
        count: data?.pageCount || 0,
        icon: <AppstoreOutlined />,
        color: '#f5222d',
        bgColor: '#fff1f0',
      },
      {
        name: '模型',
        count: data?.modelCount || 0,
        icon: <DesktopOutlined />,
        color: '#2f54eb',
        bgColor: '#f0f5ff',
      },
      {
        name: '插件',
        count: data?.pluginCount || 0,
        icon: <ApiOutlined />,
        color: '#fa541c',
        bgColor: '#fff2e8',
      },
      {
        name: '技能',
        count: data?.skillCount || 0,
        icon: <ThunderboltOutlined />,
        color: '#ffc53d',
        bgColor: '#fffbe6',
      },
    ];
  }, [totalStats]);

  // 映射会话统计
  const mappedSessionStats = useMemo(() => {
    const result = (conversationStats as any)?.data || conversationStats;
    const data = result as ConversationStatsResult | undefined;

    return [
      {
        title: '总会话数',
        value: data?.totalConversations || 0,
        icon: <CommentOutlined />,
        iconColor: '#722ed1',
        iconBgColor: '#f9f0ff',
      },
      {
        title: '今日新增会话',
        value: data?.todayNewConversations || 0,
        icon: <CommentOutlined />,
        iconColor: '#13c2c2',
        iconBgColor: '#e6fffb',
      },
    ];
  }, [conversationStats]);

  // 映射会话趋势
  const sessionTrendData = useMemo(() => {
    const result = (conversationStats as any)?.data || conversationStats;
    const data = result as ConversationStatsResult | undefined;
    if (!data) return [];

    let trendData: any[] = [];
    if (conversationPeriod === '7d') {
      trendData = data.last7DaysTrend || [];
    } else if (conversationPeriod === '30d') {
      trendData = data.last30DaysTrend || [];
    } else if (conversationPeriod === 'month') {
      trendData = data.monthlyTrend || [];
    }

    return trendData.map((item: any) => ({
      date: item.date,
      value: item.conversationCount,
    }));
  }, [conversationStats, conversationPeriod]);

  return (
    <WorkspaceLayout title="系统概览" hideScroll={true}>
      <div className={cx(styles['dashboard-container'])}>
        {/* 核心统计卡片 */}
        <Row gutter={[16, 16]} className={cx(styles['stats-row'])}>
          {coreStats.map((stat, index) => (
            <Col key={index} xs={24} sm={12} md={6} lg={6} xl={6}>
              <StatCard {...stat} />
            </Col>
          ))}
        </Row>

        {/* 趋势分析 */}
        <Row gutter={[16, 16]} className={cx(styles['trend-row'])}>
          <Col span={24}>
            <TrendChart
              title="用户新增趋势"
              data={userTrendData}
              color="#722ed1"
              tooltipName="新增用户"
              loading={!hasUserLoaded && userLoading}
              period={userPeriod}
              onPeriodChange={setUserPeriod}
            />
          </Col>
          <Col span={24}>
            <TrendChart
              title="七日访问趋势"
              data={visitTrendData}
              color="#1890ff"
              tooltipName="访问量"
              loading={!hasAccessLoaded && accessLoading}
              periods={[{ label: '7天', value: '7d' }]}
            />
          </Col>
        </Row>

        {/* 资源概览 */}
        <div className={cx(styles['resource-row'])}>
          <ResourceGrid
            resources={resources}
            loading={!hasTotalLoaded && totalLoading}
          />
        </div>

        {/* 会话统计 */}
        <div className={cx(styles['session-row'])}>
          <SessionStats
            stats={mappedSessionStats}
            chartData={sessionTrendData}
            loading={!hasConversationLoaded && conversationLoading}
            period={conversationPeriod}
            onPeriodChange={setConversationPeriod}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
};

export default Dashboard;
