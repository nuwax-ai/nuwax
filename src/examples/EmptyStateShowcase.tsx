import AppDevEmptyState, {
  EmptyStateType,
} from '@/components/business-component/AppDevEmptyState';
import { Card, Col, Row, Typography } from 'antd';
import React from 'react';
import styles from './EmptyStateShowcase.less';

const { Title, Text } = Typography;

/**
 * 所有空状态类型配置
 */
const allEmptyStateTypes: Array<{
  type: EmptyStateType;
  label: string;
  category: 'loading' | 'error' | 'empty' | 'server';
}> = [
  // 加载状态
  { type: 'loading', label: '加载中', category: 'loading' },
  { type: 'server-starting', label: '等待开发服务器启动', category: 'server' },
  { type: 'server-restarting', label: '重启中', category: 'server' },
  { type: 'developing', label: '开发中', category: 'server' },
  { type: 'importing-project', label: '导入项目中', category: 'server' },

  // 错误状态
  { type: 'error', label: '出现错误', category: 'error' },
  { type: 'network-error', label: '网络连接失败', category: 'error' },
  { type: 'permission-denied', label: '权限不足', category: 'error' },
  { type: 'server-error', label: '服务器错误', category: 'error' },
  { type: 'preview-load-failed', label: '预览加载失败', category: 'error' },
  {
    type: 'server-start-failed',
    label: '开发服务器启动失败',
    category: 'error',
  },
  { type: 'no-preview-url', label: '暂无预览地址', category: 'error' },

  // 空状态
  { type: 'empty', label: '暂无内容', category: 'empty' },
  { type: 'no-data', label: '暂无数据', category: 'empty' },
  { type: 'no-file', label: '暂无文件', category: 'empty' },
  { type: 'conversation-empty', label: '开始新对话', category: 'empty' },
];

/**
 * 分类颜色
 */
const categoryColors: Record<string, string> = {
  loading: '#1890ff',
  error: '#ff4d4f',
  empty: '#8c8c8c',
  server: '#52c41a',
};

/**
 * 分类标签
 */
const categoryLabels: Record<string, string> = {
  loading: '加载状态',
  error: '错误状态',
  empty: '空状态',
  server: '服务器状态',
};

/**
 * 空状态示例展示组件
 */
const EmptyStateShowcase: React.FC = () => {
  // 按分类分组
  const groupedStates = allEmptyStateTypes.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof allEmptyStateTypes>);

  return (
    <div className={styles.showcase}>
      <Title level={2}>AppDevEmptyState 组件示例</Title>
      <Text type="secondary" className={styles.description}>
        展示所有空状态类型，包括 Figma 设计中的各种状态图标
      </Text>

      {Object.entries(groupedStates).map(([category, states]) => (
        <div key={category} className={styles.categorySection}>
          <Title
            level={4}
            style={{ color: categoryColors[category], marginBottom: 16 }}
          >
            {categoryLabels[category]} ({states.length})
          </Title>

          <Row gutter={[16, 16]}>
            {states.map((item) => (
              <Col key={item.type} xs={24} sm={12} md={8} lg={6}>
                <Card
                  className={styles.stateCard}
                  title={
                    <Text strong style={{ fontSize: 12 }}>
                      {item.label}
                    </Text>
                  }
                  extra={
                    <Text code style={{ fontSize: 10 }}>
                      {item.type}
                    </Text>
                  }
                  size="small"
                >
                  <div className={styles.statePreview}>
                    <AppDevEmptyState
                      type={item.type}
                      showButtons={false}
                      style={{ minHeight: 180, padding: '12px 8px' }}
                    />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </div>
  );
};

export default EmptyStateShowcase;
