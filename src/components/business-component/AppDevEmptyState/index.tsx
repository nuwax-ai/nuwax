import { Button } from 'antd';
import React from 'react';
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
}) => {
  /**
   * 默认状态配置映射
   */
  const defaultConfigs: Record<EmptyStateType, DefaultStateConfig> = {
    loading: {
      icon: <div className={styles.loadingIcon}>⚡</div>,
      title: '加载中...',
      description: '正在加载，请稍候...',
    },
    error: {
      icon: <div className={styles.errorIcon}>⚠️</div>,
      title: '出现错误',
      description: '加载过程中出现错误，请重试',
    },
    'network-error': {
      icon: <div className={styles.errorIcon}>🌐</div>,
      title: '网络连接失败',
      description: '网络连接异常，请检查网络设置后重试',
    },
    'permission-denied': {
      icon: <div className={styles.errorIcon}>🔒</div>,
      title: '权限不足',
      description: '您没有访问此资源的权限，请联系管理员',
    },
    empty: {
      icon: <div className={styles.emptyIcon}>📁</div>,
      title: '暂无内容',
      description: '当前没有可显示的内容',
    },
    'no-data': {
      icon: <div className={styles.emptyIcon}>🌐</div>,
      title: '暂无数据',
      description: '当前没有可用的数据',
    },
  };

  /**
   * 获取当前状态的配置
   */
  const currentConfig = defaultConfigs[type];

  /**
   * 渲染操作按钮
   */
  const renderButtons = () => {
    if (!showButtons || !buttons || buttons.length === 0) return null;

    return (
      <div className={styles.emptyActions}>
        {buttons.map((button, index) => (
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
    );
  };

  return (
    <div className={`${styles.emptyState} ${className || ''}`} style={style}>
      {showIcon && (
        <div className={styles.emptyIconContainer}>
          {icon || currentConfig.icon}
        </div>
      )}

      <div className={styles.emptyContent}>
        {showTitle && (
          <h3 className={styles.emptyTitle}>{title || currentConfig.title}</h3>
        )}
        {showDescription && (
          <p className={styles.emptyDescription}>
            {description || currentConfig.description}
          </p>
        )}
        {renderButtons()}
      </div>
    </div>
  );
};

export default AppDevEmptyState;
