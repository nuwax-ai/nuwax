import {
  ExclamationCircleOutlined,
  GlobalOutlined,
  InboxOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Button, Modal } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

/**
 * 空状态类型枚举
 */
export type EmptyStateType =
  | 'loading'
  | 'error'
  | 'empty'
  | 'no-data'
  | 'network-error'
  | 'permission-denied';

/**
 * 按钮配置接口
 */
export interface ButtonConfig {
  /** 按钮文本 */
  text: string;
  /** 按钮图标 */
  icon?: React.ReactNode;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 按钮类型 */
  type?: 'primary' | 'default' | 'dashed' | 'link' | 'text';
  /** 按钮大小 */
  size?: 'small' | 'middle' | 'large';
}

/**
 * 默认状态配置
 */
interface DefaultStateConfig {
  icon: React.ReactNode;
  title: string;
  description: string;
}

/**
 * AppDev 空状态组件属性
 */
export interface AppDevEmptyStateProps {
  /** 状态类型 */
  type?: EmptyStateType;
  /** 自定义图标 */
  icon?: React.ReactNode;
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 按钮配置数组 */
  buttons?: ButtonConfig[];
  /** 自定义样式类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示图标 */
  showIcon?: boolean;
  /** 是否显示标题 */
  showTitle?: boolean;
  /** 是否显示描述 */
  showDescription?: boolean;
  /** 是否显示按钮 */
  showButtons?: boolean;
  /** 描述文本最大长度，超过则截取并显示省略号 */
  maxDescriptionLength?: number;
  /** 是否允许描述文本换行 */
  allowDescriptionWrap?: boolean;
  /** 最大显示行数，超过则显示省略号 */
  maxLines?: number;
  /** 是否支持点击查看完整内容 */
  clickableDescription?: boolean;
  /** 点击查看完整内容的按钮文本 */
  viewFullTextButtonText?: string;
}

/**
 * AppDev 空状态组件
 * 用于 AppDev 页面的预览、文件树、会话消息等场景的空状态展示
 */
const AppDevEmptyState: React.FC<AppDevEmptyStateProps> = ({
  type = 'empty',
  icon,
  title,
  description,
  buttons,
  className,
  style,
  showIcon = true,
  showTitle = true,
  showDescription = true,
  showButtons = true,
  maxDescriptionLength = 200, // 默认最大长度 200 字符
  allowDescriptionWrap = false, // 默认不允许换行
  maxLines = 3, // 默认最大显示 3 行
  clickableDescription = false, // 默认不支持点击查看
  viewFullTextButtonText = '查看完整内容', // 默认按钮文本
}) => {
  // 弹窗状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);

  /**
   * 默认状态配置映射
   */
  const defaultConfigs: Record<EmptyStateType, DefaultStateConfig> = {
    loading: {
      icon: (
        <div className={styles.loadingIcon}>
          <LoadingOutlined />
        </div>
      ),
      title: '加载中...',
      description: '正在加载，请稍候...',
    },
    error: {
      icon: (
        <div className={styles.errorIcon}>
          <ExclamationCircleOutlined />
        </div>
      ),
      title: '出现错误',
      description: '加载过程中出现错误，请重试',
    },
    'network-error': {
      icon: (
        <div className={styles.errorIcon}>
          <GlobalOutlined />
        </div>
      ),
      title: '网络连接失败',
      description: '网络连接异常，请检查网络设置后重试',
    },
    'permission-denied': {
      icon: <div className={styles.errorIcon}>🔒</div>,
      title: '权限不足',
      description: '您没有访问此资源的权限，请联系管理员',
    },
    empty: {
      icon: (
        <div className={styles.emptyIcon}>
          <InboxOutlined />
        </div>
      ),
      title: '暂无内容',
      description: '当前没有可显示的内容',
    },
    'no-data': {
      icon: (
        <div className={styles.emptyIcon}>
          <GlobalOutlined />
        </div>
      ),
      title: '暂无数据',
      description: '当前没有可用的数据',
    },
  };

  /**
   * 获取当前状态的配置
   */
  const currentConfig = defaultConfigs[type];

  /**
   * 处理描述文本，支持截取和换行控制
   */
  const processDescription = (text: string): string => {
    if (!text) return text;

    // 如果设置了最大长度且文本超过限制，进行截取
    if (maxDescriptionLength > 0 && text.length > maxDescriptionLength) {
      return text.substring(0, maxDescriptionLength) + '...';
    }

    return text;
  };

  /**
   * 获取处理后的描述文本
   */
  const processedDescription = processDescription(
    description || currentConfig.description,
  );

  /**
   * 处理查看完整内容
   */
  const handleViewFullText = () => {
    setIsModalVisible(true);
  };

  /**
   * 关闭弹窗
   */
  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  /**
   * 检查是否需要显示查看完整内容按钮
   */
  const shouldShowViewFullButton = () => {
    if (!clickableDescription) return false;

    const fullText = description || currentConfig.description;
    const processedText = processedDescription;

    // 如果处理后的文本比原文本短，说明被截取了
    return (
      fullText.length > processedText.length ||
      (allowDescriptionWrap &&
        maxLines > 1 &&
        fullText.split('\n').length > maxLines)
    );
  };

  /**
   * 渲染操作按钮
   */
  const renderButtons = () => {
    const regularButtons = [...(buttons || [])];

    if (!showButtons && !shouldShowViewFullButton()) return null;

    return (
      <div className={styles.emptyActions}>
        {/* 渲染常规按钮 */}
        {showButtons && regularButtons.length > 0 && (
          <div className={styles.regularButtons}>
            {regularButtons.map((button, index) => (
              <Button
                key={index}
                type={button.type || 'default'}
                size={button.size || 'middle'}
                icon={button.icon}
                onClick={button.onClick}
                loading={button.loading}
                disabled={button.disabled}
              >
                {button.text}
              </Button>
            ))}
          </div>
        )}

        {/* 查看完整内容按钮单独一行 */}
        {shouldShowViewFullButton() && (
          <div className={styles.viewFullTextButton}>
            <Button type="link" size="small" onClick={handleViewFullText}>
              {viewFullTextButtonText}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className={`${styles.emptyState} ${className || ''}`} style={style}>
        {showIcon && (
          <div className={styles.emptyIconContainer}>
            {icon || currentConfig.icon}
          </div>
        )}

        <div className={styles.emptyContent}>
          {showTitle && (
            <h3 className={styles.emptyTitle}>
              {title || currentConfig.title}
            </h3>
          )}
          {showDescription && (
            <p
              className={`${styles.emptyDescription} ${
                allowDescriptionWrap && maxLines > 1
                  ? styles.multiLineTruncate
                  : styles.singleLineTruncate
              }`}
              style={
                {
                  '--max-lines': maxLines,
                } as React.CSSProperties
              }
              title={description || currentConfig.description} // 显示完整文本的 tooltip
            >
              {processedDescription}
            </p>
          )}
          {renderButtons()}
        </div>
      </div>

      {/* 完整内容弹窗 */}
      <Modal
        title={title || currentConfig.title}
        open={isModalVisible}
        onCancel={handleCloseModal}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            关闭
          </Button>,
        ]}
        width={600}
        style={{ top: 20 }}
      >
        <div className={styles.fullTextContent}>
          <pre className={styles.fullTextPre}>
            {description || currentConfig.description}
          </pre>
        </div>
      </Modal>
    </>
  );
};

export default AppDevEmptyState;
