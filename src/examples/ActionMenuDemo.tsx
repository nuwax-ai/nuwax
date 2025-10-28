import ActionMenu, { ActionItem } from '@/components/base/ActionMenu';
import {
  Card,
  Divider,
  InputNumber,
  Select,
  Space,
  Switch,
  message,
} from 'antd';
import React, { useState } from 'react';
import styles from './ActionMenuDemo.less';

const { Option } = Select;

/**
 * ActionMenu 组件演示页面
 * 展示各种配置选项和用法
 */
const ActionMenuDemo: React.FC = () => {
  const [visibleCount, setVisibleCount] = useState(3);
  const [moreText, setMoreText] = useState('更多');
  const [gap, setGap] = useState(16);
  const [disabled, setDisabled] = useState(false);

  // 基础操作项
  const basicActions: ActionItem[] = [
    {
      key: 'view',
      icon: 'icons-eye',
      title: '查看',
      onClick: () => message.info('点击了查看'),
    },
    {
      key: 'edit',
      icon: 'icons-edit',
      title: '编辑',
      onClick: () => message.info('点击了编辑'),
    },
    {
      key: 'delete',
      icon: 'icons-delete',
      title: '删除',
      onClick: () => message.info('点击了删除'),
    },
    {
      key: 'share',
      icon: 'icons-share',
      title: '分享',
      onClick: () => message.info('点击了分享'),
    },
    {
      key: 'export',
      icon: 'icons-export',
      title: '导出',
      onClick: () => message.info('点击了导出'),
    },
  ];

  // 带样式的操作项
  const styledActions: ActionItem[] = [
    {
      key: 'primary',
      icon: 'icons-star',
      title: '主要操作',
      onClick: () => message.success('主要操作'),
      className: styles.primary,
    },
    {
      key: 'warning',
      icon: 'icons-warning',
      title: '警告操作',
      onClick: () => message.warning('警告操作'),
      className: styles.warning,
    },
    {
      key: 'danger',
      icon: 'icons-delete',
      title: '危险操作',
      onClick: () => message.error('危险操作'),
      className: styles.danger,
    },
    {
      key: 'info',
      icon: 'icons-info',
      title: '信息操作',
      onClick: () => message.info('信息操作'),
      className: styles.info,
    },
    {
      key: 'success',
      icon: 'icons-check',
      title: '成功操作',
      onClick: () => message.success('成功操作'),
      className: styles.success,
    },
  ];

  // 带分割线的操作项
  const actionsWithDividers: ActionItem[] = [
    {
      key: 'view',
      icon: 'icons-eye',
      title: '查看',
      onClick: () => message.info('点击了查看'),
    },
    {
      key: 'edit',
      icon: 'icons-edit',
      title: '编辑',
      onClick: () => message.info('点击了编辑'),
    },
    {
      key: 'delete',
      icon: 'icons-delete',
      title: '删除',
      onClick: () => message.info('点击了删除'),
      divider: true, // 在删除前显示分割线
    },
    {
      key: 'share',
      icon: 'icons-share',
      title: '分享',
      onClick: () => message.info('点击了分享'),
    },
    {
      key: 'export',
      icon: 'icons-export',
      title: '导出',
      onClick: () => message.info('点击了导出'),
    },
  ];

  // 带禁用状态的操作项
  const actionsWithDisabled: ActionItem[] = [
    {
      key: 'view',
      icon: 'icons-eye',
      title: '查看',
      onClick: () => message.info('点击了查看'),
    },
    {
      key: 'edit',
      icon: 'icons-edit',
      title: '编辑',
      onClick: () => message.info('点击了编辑'),
      disabled: true, // 禁用编辑
    },
    {
      key: 'delete',
      icon: 'icons-delete',
      title: '删除',
      onClick: () => message.info('点击了删除'),
    },
    {
      key: 'share',
      icon: 'icons-share',
      title: '分享',
      onClick: () => message.info('点击了分享'),
    },
  ];

  return (
    <div className={styles.container}>
      <h1>ActionMenu 组件演示</h1>
      <p className={styles.description}>
        这是一个通用的操作菜单组件，支持配置图标、标题、点击回调，可以控制显示多少项，其他项放到更多下拉菜单中。
      </p>

      {/* 基础用法 */}
      <Card title="基础用法" className={styles.card}>
        <p>默认显示3个操作项，其他放入更多菜单</p>
        <ActionMenu actions={basicActions} />
      </Card>

      {/* 自定义显示数量 */}
      <Card title="自定义显示数量" className={styles.card}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <span>显示数量:</span>
            <InputNumber
              min={1}
              max={5}
              value={visibleCount}
              onChange={(value) => setVisibleCount(value || 3)}
            />
            <span>间距:</span>
            <InputNumber
              min={8}
              max={32}
              value={gap}
              onChange={(value) => setGap(value || 16)}
            />
            <span>更多文本:</span>
            <Select
              value={moreText}
              onChange={setMoreText}
              style={{ width: 100 }}
            >
              <Option value="更多">更多</Option>
              <Option value="更多操作">更多操作</Option>
              <Option value="...">...</Option>
            </Select>
            <span>禁用:</span>
            <Switch checked={disabled} onChange={setDisabled} />
          </Space>
          <Divider />
          <ActionMenu
            actions={basicActions}
            visibleCount={visibleCount}
            moreText={moreText}
            gap={gap}
            disabled={disabled}
          />
        </Space>
      </Card>

      {/* 带样式的操作项 */}
      <Card title="带样式的操作项" className={styles.card}>
        <p>支持自定义样式类名，可以覆盖默认样式</p>
        <ActionMenu
          actions={styledActions}
          visibleCount={2}
          moreText="更多样式"
        />
      </Card>

      {/* 带分割线的操作项 */}
      <Card title="带分割线的操作项" className={styles.card}>
        <p>使用 divider 属性在菜单项之间添加分割线</p>
        <ActionMenu
          actions={actionsWithDividers}
          visibleCount={2}
          moreText="更多选项"
        />
      </Card>

      {/* 带禁用状态的操作项 */}
      <Card title="带禁用状态的操作项" className={styles.card}>
        <p>支持单个操作项禁用和全局禁用</p>
        <ActionMenu
          actions={actionsWithDisabled}
          visibleCount={2}
          moreText="更多操作"
        />
      </Card>

      {/* 实际应用场景 */}
      <Card title="实际应用场景" className={styles.card}>
        <p>在ChatTitleActions组件中的使用示例</p>
        <div className={styles.realExample}>
          <ActionMenu
            actions={[
              {
                key: 'share',
                icon: 'icons-chat-share',
                title: '分享',
                onClick: () => message.success('分享链接已复制'),
              },
              {
                key: 'collect',
                icon: 'icons-chat-collect',
                title: '收藏',
                onClick: () => message.success('已添加到收藏'),
              },
              {
                key: 'timed-task',
                icon: 'icons-chat-timer',
                title: '定时任务',
                onClick: () => message.info('定时任务功能开发中...'),
                className: styles.timedTask,
              },
              {
                key: 'history',
                icon: 'icons-chat-info',
                title: '历史会话',
                onClick: () => message.info('历史会话功能开发中...'),
                className: styles.historyConversation,
              },
            ]}
            visibleCount={2}
            moreText="更多"
            moreIcon="icons-more"
          />
        </div>
      </Card>
    </div>
  );
};

export default ActionMenuDemo;
