import { dict } from '@/services/i18nRuntime';
import {
  Button,
  Card,
  Descriptions,
  Divider,
  Space,
  Tag,
  Typography,
} from 'antd';
import React from 'react';
import type { PluginCardProps } from '../EcosystemCard';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

/**
 * 插件详情接口
 * 扩展自插件卡片接口
 */
export interface PluginDetailProps extends PluginCardProps {
  /** 插件版本 */
  version: string;
  /** 发布日期 */
  publishDate: string;
  /** 插件作者 */
  author: string;
  /** 插件分类 */
  categories: string[];
  /** 是否已启用 */
  isEnabled?: boolean;
  /** 安装/卸载回调 */
  onToggleEnable?: () => void;
  /** 详情页返回回调 */
  onBack?: () => void;
}

/**
 * 插件卡片详情组件
 * 展示插件的详细信息，包括版本、发布日期、作者、分类等
 * @param props 组件属性
 * @returns 插件卡片详情组件
 */
const PluginCardDetail: React.FC<PluginDetailProps> = ({
  icon,
  title,
  description,
  version,
  publishDate,
  author,
  categories = [],
  isNew = false,
  isEnabled = false,
  onToggleEnable,
  onBack,
}) => {
  return (
    <Card className={styles.detailCard}>
      <Button type="link" className={styles.backButton} onClick={onBack}>
        {dict('PC.Components.PluginCardDetail.back')}
      </Button>

      <div className={styles.header}>
        <div className={styles.iconContainer}>
          <img src={icon} alt={title} className={styles.icon} />
        </div>
        <div className={styles.infoContainer}>
          <div className={styles.titleRow}>
            <Title level={4} className={styles.title}>
              {title}
            </Title>
            {isNew && (
              <Tag color="red" className={styles.newTag}>
                {dict('PC.Components.PluginCardDetail.newVersion')}
              </Tag>
            )}
          </div>
          <Space size={16} className={styles.metaInfo}>
            <Text type="secondary">
              {dict('PC.Components.PluginCardDetail.version')}: {version}
            </Text>
            <Text type="secondary">
              {dict('PC.Components.PluginCardDetail.publishDate')}:{' '}
              {publishDate}
            </Text>
            <Text type="secondary">
              {dict('PC.Components.PluginCardDetail.author')}: {author}
            </Text>
          </Space>
          <Space size={8} wrap className={styles.categories}>
            {categories.map((category, index) => (
              <Tag key={index} color="blue">
                {category}
              </Tag>
            ))}
          </Space>
          <Button
            type={isEnabled ? 'default' : 'primary'}
            className={styles.actionButton}
            onClick={onToggleEnable}
          >
            {isEnabled
              ? dict('PC.Components.PluginCardDetail.uninstall')
              : dict('PC.Components.PluginCardDetail.install')}
          </Button>
        </div>
      </div>

      <Divider />

      <div className={styles.descriptionSection}>
        <Title level={5}>
          {dict('PC.Components.PluginCardDetail.pluginDescription')}
        </Title>
        <Paragraph className={styles.description}>{description}</Paragraph>
      </div>

      <Divider />

      <div className={styles.detailsSection}>
        <Title level={5}>
          {dict('PC.Components.PluginCardDetail.detailedInfo')}
        </Title>
        <Descriptions column={1} bordered>
          <Descriptions.Item
            label={dict('PC.Components.PluginCardDetail.pluginName')}
          >
            {title}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict('PC.Components.PluginCardDetail.version')}
          >
            {version}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict('PC.Components.PluginCardDetail.publishDate')}
          >
            {publishDate}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict('PC.Components.PluginCardDetail.author')}
          >
            {author}
          </Descriptions.Item>
          <Descriptions.Item
            label={dict('PC.Components.PluginCardDetail.supportedPlatforms')}
          >
            Web
          </Descriptions.Item>
        </Descriptions>
      </div>
    </Card>
  );
};

export default PluginCardDetail;
