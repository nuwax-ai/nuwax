import { Button } from 'antd';
import React from 'react';
import styles from './index.less';

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
}

/**
 * AppDev 空状态组件属性
 */
export interface AppDevEmptyStateProps {
  /** 状态类型 */
  type?: 'loading' | 'error' | 'empty' | 'no-data';
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
}) => {
  /**
   * 获取默认图标
   */
  const getDefaultIcon = () => {
    if (icon) return icon;

    switch (type) {
      case 'loading':
        return <div className={styles.loadingIcon}>⚡</div>;
      case 'error':
        return <div className={styles.errorIcon}>⚠️</div>;
      case 'empty':
        return <div className={styles.emptyIcon}>📁</div>;
      case 'no-data':
        return <div className={styles.emptyIcon}>🌐</div>;
      default:
        return <div className={styles.emptyIcon}>📁</div>;
    }
  };

  /**
   * 获取默认标题
   */
  const getDefaultTitle = () => {
    if (title) return title;

    switch (type) {
      case 'loading':
        return '加载中...';
      case 'error':
        return '出现错误';
      case 'empty':
        return '暂无内容';
      case 'no-data':
        return '暂无数据';
      default:
        return '暂无内容';
    }
  };

  /**
   * 获取默认描述
   */
  const getDefaultDescription = () => {
    if (description) return description;

    switch (type) {
      case 'loading':
        return '正在加载，请稍候...';
      case 'error':
        return '加载过程中出现错误，请重试';
      case 'empty':
        return '当前没有可显示的内容';
      case 'no-data':
        return '当前没有可用的数据';
      default:
        return '当前没有可显示的内容';
    }
  };

  /**
   * 渲染操作按钮
   */
  const renderButtons = () => {
    if (!buttons || buttons.length === 0) return null;

    return (
      <div className={styles.emptyActions}>
        {buttons.map((button, index) => (
          <Button
            key={index}
            type={button.type || 'default'}
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
      <div className={styles.emptyIconContainer}>{getDefaultIcon()}</div>

      <div className={styles.emptyContent}>
        <h3 className={styles.emptyTitle}>{getDefaultTitle()}</h3>
        <p className={styles.emptyDescription}>{getDefaultDescription()}</p>
        {renderButtons()}
      </div>
    </div>
  );
};

export default AppDevEmptyState;
