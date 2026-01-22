import {
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
  UserAddOutlined,
} from '@ant-design/icons';
import { Badge, Col, Row, Tag } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { ResourceGrid, SessionStats, StatCard, TrendChart } from './components';
import styles from './index.less';

const cx = classNames.bind(styles);

const Clock: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(
    dayjs().format('YYYY-MM-DD HH:mm:ss'),
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(dayjs().format('YYYY-MM-DD HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className={cx(styles['current-time'])}>{currentTime}</span>;
};

const Dashboard: React.FC = () => {
  // 模拟数据 - 核心统计
  const coreStats = [
    {
      title: '总用户数',
      value: 128456,
      trend: { value: 5.2, isUp: true, label: 'vs 上月' },
      icon: <TeamOutlined />,
      iconColor: '#1890ff',
      iconBgColor: '#e6f7ff',
    },
    {
      title: '今日新增用户',
      value: 1248,
      trend: { value: 12.5, isUp: true, label: 'vs 昨日' },
      icon: <UserAddOutlined />,
      iconColor: '#52c41a',
      iconBgColor: '#f6ffed',
    },
    {
      title: '今日访问量',
      value: 8642,
      trend: { value: 3.8, isUp: true, label: 'vs 昨日' },
      icon: <EyeOutlined />,
      iconColor: '#722ed1',
      iconBgColor: '#f9f0ff',
    },
    {
      title: '30日总访问量',
      value: 218563,
      trend: { value: 8.6, isUp: true, label: 'vs 上月' },
      icon: <BarChartOutlined />,
      iconColor: '#fa8c16',
      iconBgColor: '#fff7e6',
    },
  ];

  // 模拟数据 - 用户新增趋势
  const userTrendData = [
    { date: '1月16日', value: 1120 },
    { date: '1月17日', value: 1180 },
    { date: '1月18日', value: 844 },
    { date: '1月19日', value: 856 },
    { date: '1月20日', value: 1080 },
    { date: '1月21日', value: 1020 },
    { date: '1月22日', value: 1150 },
  ];

  // 模拟数据 - 访问趋势
  const visitTrendData = [
    { date: '1月16日', value: 5800 },
    { date: '1月17日', value: 7200 },
    { date: '1月18日', value: 5657 },
    { date: '1月19日', value: 5850 },
    { date: '1月20日', value: 5100 },
    { date: '1月21日', value: 7800 },
    { date: '1月22日', value: 5200 },
  ];

  // 模拟数据 - 资源概览
  const resources = [
    {
      name: '工作空间',
      count: 12,
      icon: <FolderOutlined />,
      color: '#597ef7', // 蓝紫色
      bgColor: '#f0f5ff',
    },
    {
      name: '智能体',
      count: 24,
      icon: <DesktopOutlined />,
      color: '#eb2f96', // 粉色
      bgColor: '#fff0f6',
    },
    {
      name: '知识库',
      count: 156,
      icon: <BookOutlined />,
      color: '#13c2c2', // 青色
      bgColor: '#e6fffb',
    },
    {
      name: '工作流',
      count: 42,
      icon: <SyncOutlined />,
      color: '#52c41a', // 绿色
      bgColor: '#f6ffed',
    },
    {
      name: '数据表',
      count: 89,
      icon: <TableOutlined />,
      color: '#faad14', // 黄色
      bgColor: '#fffbe6',
    },
    {
      name: 'MCP',
      count: 18,
      icon: <CodeOutlined />,
      color: '#722ed1', // 紫色
      bgColor: '#f9f0ff',
    },
    {
      name: '网页应用',
      count: 67,
      icon: <AppstoreOutlined />,
      color: '#f5222d', // 红色
      bgColor: '#fff1f0',
    },
    {
      name: '模型',
      count: 38,
      icon: <DesktopOutlined />,
      color: '#2f54eb', // 深蓝色
      bgColor: '#f0f5ff',
    },
  ];

  // 模拟数据 - 会话统计
  const sessionStats = [
    {
      title: '总会话数',
      value: 15678,
      trend: { value: 18.6, isUp: true, label: 'vs 上月' },
      icon: <CommentOutlined />,
      iconColor: '#722ed1',
      iconBgColor: '#f9f0ff',
    },
    {
      title: '今日新增会话',
      value: 892,
      trend: { value: 15.3, isUp: true, label: 'vs 昨日' },
      icon: <CommentOutlined />,
      iconColor: '#13c2c2',
      iconBgColor: '#e6fffb',
    },
  ];

  // 模拟数据 - 会话趋势
  const sessionTrendData = [
    { date: '1月16日', value: 720 },
    { date: '1月17日', value: 765 },
    { date: '1月18日', value: 845 },
    { date: '1月19日', value: 765 },
    { date: '1月20日', value: 820 },
    { date: '1月21日', value: 856 },
    { date: '1月22日', value: 780 },
  ];

  return (
    <div className={cx(styles['dashboard-container'])}>
      {/* 页面头部 */}
      <div className={cx(styles['dashboard-header'])}>
        <div className={cx(styles['header-content'])}>
          <div className={cx(styles['header-title'])}>
            <h1>系统概览</h1>
            <p className={cx(styles['header-subtitle'])}>数据分析与监控平台</p>
          </div>
          <div className={cx(styles['header-actions'])}>
            <Tag color="processing" icon={<Badge status="processing" />}>
              实时更新
            </Tag>
            <Clock />
          </div>
        </div>
      </div>

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
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <TrendChart
            title="用户新增趋势"
            data={userTrendData}
            color="#722ed1"
            tooltipName="新增用户"
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <TrendChart
            title="七日访问趋势"
            data={visitTrendData}
            color="#1890ff"
            tooltipName="访问量"
          />
        </Col>
      </Row>

      {/* 资源概览 */}
      <div className={cx(styles['resource-row'])}>
        <ResourceGrid resources={resources} />
      </div>

      {/* 会话统计 */}
      <div className={cx(styles['session-row'])}>
        <SessionStats stats={sessionStats} chartData={sessionTrendData} />
      </div>
    </div>
  );
};

export default Dashboard;
