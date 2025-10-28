import { Col, Empty, Row, Typography } from 'antd';
import React from 'react';
import PluginCard, { PluginCardProps } from '../EcosystemCard';
import styles from './index.less';

const { Title } = Typography;

/**
 * 插件卡片列表组件接口
 */
export interface PluginCardListProps {
  /** 列表标题 */
  title?: string;
  /** 卡片数据 */
  plugins: PluginCardProps[];
  /** 列表为空时的提示 */
  emptyText?: string;
  /** 卡片点击事件 */
  onCardClick?: (plugin: PluginCardProps, index: number) => void;
  /** 每行显示的卡片数量 */
  column?: number;
  /** 卡片间距 */
  gutter?: [number, number];
  /** 自定义类名 */
  className?: string;
}

/**
 * 插件卡片列表组件
 * 用于展示多个插件卡片的列表组件
 * @param props 组件属性
 * @returns 插件卡片列表组件
 */
const PluginCardList: React.FC<PluginCardListProps> = ({
  title,
  plugins = [],
  emptyText = '暂无数据',
  onCardClick,
  column = 1,
  gutter = [16, 16],
  className,
}) => {
  return (
    <div className={className}>
      {title && (
        <Title level={4} className={styles.listTitle}>
          {title}
        </Title>
      )}

      {plugins.length > 0 ? (
        <Row gutter={gutter}>
          {plugins.map((plugin, index) => (
            <Col
              key={`${plugin.title}-${index}`}
              xs={24}
              sm={24}
              md={24 / column}
              lg={24 / column}
              xl={24 / column}
              className={styles.cardCol}
            >
              <PluginCard
                {...plugin}
                onClick={() => onCardClick?.(plugin, index)}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description={emptyText}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          className={styles.emptyContainer}
        />
      )}
    </div>
  );
};

export default PluginCardList;
