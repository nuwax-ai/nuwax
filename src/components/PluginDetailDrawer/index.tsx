import { CloseOutlined } from '@ant-design/icons';
import { Button, Divider, Drawer, Typography } from 'antd';
import React from 'react';
import type { PluginCardProps } from '../PluginCard';
import styles from './index.less';

const { Title, Paragraph } = Typography;

export interface PluginDetailDrawerProps {
  /** 是否显示抽屉 */
  visible: boolean;
  /** 插件详情数据 */
  plugin?: PluginCardProps;
  /** 关闭抽屉回调 */
  onClose: () => void;
  /** 更新配置回调 */
  onUpdate?: () => void;
  /** 停用回调 */
  onDisable?: () => void;
  /** 切换启用状态回调 */
  onToggleEnable?: () => void;
}

/**
 * 插件详情抽屉组件
 * 右侧划出的插件详情展示
 */
const PluginDetailDrawer: React.FC<PluginDetailDrawerProps> = ({
  visible,
  plugin,
  onClose,
  onUpdate,
  onDisable,
  onToggleEnable,
}) => {
  if (!plugin) return null;

  const { icon, title, description, isEnabled } = plugin;

  return (
    <Drawer
      title={plugin?.title}
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
      className={styles.pluginDetailDrawer}
    >
      <div className={styles.drawerHeader}>
        <div className={styles.titleArea}>
          <img src={icon} alt={title} className={styles.icon} />
          <div className={styles.titleContent}>
            <Title level={5} className={styles.title}>
              {title}
            </Title>
            <div className={styles.subtitle}>来自女娲官方</div>
          </div>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className={styles.closeButton}
        />
      </div>

      <div className={styles.content}>
        <Paragraph className={styles.description}>{description}</Paragraph>

        <Divider className={styles.divider} />

        <div className={styles.section}>
          <Title level={5} className={styles.sectionTitle}>
            使用文档
          </Title>
          <Paragraph className={styles.docContent}>
            在互联网上搜索相关信息，例如今日新闻、天气情况、国际形势、技术资料等；在互联网上搜索相关信息，例如今日新闻、天气情况...
          </Paragraph>
          <Paragraph className={styles.docContent}>
            在互联网上搜索相关信息，例如今日新闻、天气情况、国际形势、技术资料等；在互联网上搜索相关信息，例如今日新闻、天气情况...在互联网上搜索相关信息，例如今日新闻、天气情况、国际形势、技术资料等；在互联网上搜索相关信息，例如今日新闻、天气情况...
          </Paragraph>
        </div>

        <div className={styles.toolSection}>
          {/* 这部分可以根据实际需求自定义，截图中显示的是一个工具列表 */}
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          type="primary"
          size="large"
          className={styles.actionButton}
          onClick={isEnabled ? onUpdate : onToggleEnable}
        >
          {isEnabled ? '更新配置' : '启用'}
        </Button>
        <Button
          size="large"
          className={styles.actionButton}
          onClick={isEnabled ? onDisable : undefined}
          disabled={!isEnabled}
        >
          停用
        </Button>
      </div>
    </Drawer>
  );
};

export default PluginDetailDrawer;
