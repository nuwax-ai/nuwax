import { LoadingOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

// 空状态 SVG 插图
import emptyStateConversation from '@/assets/images/empty_state_conversation.svg';
import emptyStateLaptop from '@/assets/images/empty_state_laptop.svg';
// 状态指示器图标 - 绿色系（成功/进行中）
import emptyStateIconCode from '@/assets/images/empty_state_icon_code.svg';
import emptyStateIconDownload from '@/assets/images/empty_state_icon_download.svg';
// 状态指示器图标 - 黄色系（警告/重启）
import emptyStateIndicatorRestart from '@/assets/images/empty_state_indicator_restart.svg';
// 状态指示器图标 - 红色系（错误）
import emptyStateIconCloseCircle from '@/assets/images/empty_state_icon_close_circle.svg';
import emptyStateIconError from '@/assets/images/empty_state_icon_error.svg';
import emptyStateIconEyeClose from '@/assets/images/empty_state_icon_eye_close.svg';
import emptyStateIconNetworkError from '@/assets/images/empty_state_icon_network_error.svg';
import emptyStateIconPermissionDenied from '@/assets/images/empty_state_icon_permission_denied.svg';
import emptyStateIconPreviewError from '@/assets/images/empty_state_icon_preview_error.svg';
import emptyStateIconServerError from '@/assets/images/empty_state_icon_server_error.svg';
// 空数据状态图标
import emptyStateNoData from '@/assets/images/empty_state_no_data.svg';
import { t } from '@/services/i18nRuntime';

/**
 * 空状态类型枚举
 */
export type EmptyStateType =
  | 'loading'
  | 'error'
  | 'empty'
  | 'no-data'
  | 'network-error'
  | 'permission-denied'
  | 'server-starting'
  | 'server-restarting'
  | 'developing'
  | 'importing-project'
  | 'server-error'
  | 'preview-load-failed'
  | 'server-start-failed'
  | 'no-preview-url'
  | 'conversation-empty'
  | 'add-data'
  | 'no-file';

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
  viewFullTextButtonText = t('PC.Components.AppDevEmptyState.viewFullText'), // 默认按钮文本
}) => {
  // 弹窗状态管理
  const [isModalVisible, setIsModalVisible] = useState(false);

  /**
   * 默认状态配置映射
   */
  const defaultConfigs: Record<EmptyStateType, DefaultStateConfig> = {
    loading: {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.blue}>
            <LoadingOutlined style={{ color: '#1677ff', fontSize: 16 }} />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.loadingTitle'),
      description: t('PC.Components.AppDevEmptyState.loadingDescription'),
    },
    error: {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.red}>
            <img src={emptyStateIconError} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.errorTitle'),
      description: t('PC.Components.AppDevEmptyState.errorDescription'),
    },
    'network-error': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.red}>
            <img src={emptyStateIconNetworkError} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.networkErrorTitle'),
      description: t('PC.Components.AppDevEmptyState.networkErrorDescription'),
    },
    'permission-denied': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.red}>
            <img src={emptyStateIconPermissionDenied} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.permissionDeniedTitle'),
      description: t(
        'PC.Components.AppDevEmptyState.permissionDeniedDescription',
      ),
    },
    empty: {
      icon: (
        <div className={styles.conversationIcon}>
          <img
            src={emptyStateNoData}
            alt=""
            className={styles.conversationImage}
          />
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.emptyTitle'),
      description: t('PC.Components.AppDevEmptyState.emptyDescription'),
    },
    'no-data': {
      icon: (
        <div className={styles.conversationIcon}>
          <img
            src={emptyStateNoData}
            alt=""
            className={styles.conversationImage}
          />
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.noDataTitle'),
      description: t('PC.Components.AppDevEmptyState.noDataDescription'),
    },
    'server-starting': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.green}>
            <img src={emptyStateIconCode} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.serverStartingTitle'),
      description: t(
        'PC.Components.AppDevEmptyState.serverStartingDescription',
      ),
    },
    'server-restarting': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.yellow}>
            <img src={emptyStateIndicatorRestart} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.serverRestartingTitle'),
      description: t(
        'PC.Components.AppDevEmptyState.serverRestartingDescription',
      ),
    },
    developing: {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.green}>
            <img src={emptyStateIconCode} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.developingTitle'),
      description: t('PC.Components.AppDevEmptyState.developingDescription'),
    },
    'importing-project': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.green}>
            <img src={emptyStateIconDownload} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.importingProjectTitle'),
      description: t(
        'PC.Components.AppDevEmptyState.importingProjectDescription',
      ),
    },
    'server-error': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.red}>
            <img src={emptyStateIconServerError} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.serverErrorTitle'),
      description: t('PC.Components.AppDevEmptyState.serverErrorDescription'),
    },
    'preview-load-failed': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.red}>
            <img src={emptyStateIconPreviewError} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.previewLoadFailedTitle'),
      description: t(
        'PC.Components.AppDevEmptyState.previewLoadFailedDescription',
      ),
    },
    'server-start-failed': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.red}>
            <img src={emptyStateIconCloseCircle} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.serverStartFailedTitle'),
      description: t(
        'PC.Components.AppDevEmptyState.serverStartFailedDescription',
      ),
    },
    'no-preview-url': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
          <div className={styles.serverStateIndicator + ' ' + styles.red}>
            <img src={emptyStateIconEyeClose} alt="" />
          </div>
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.noPreviewUrlTitle'),
      description: t('PC.Components.AppDevEmptyState.noPreviewUrlDescription'),
    },
    'conversation-empty': {
      icon: (
        <div className={styles.conversationIcon}>
          <img
            src={emptyStateConversation}
            alt=""
            className={styles.conversationImage}
          />
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.conversationEmptyTitle'),
      description: t(
        'PC.Components.AppDevEmptyState.conversationEmptyDescription',
      ),
    },
    'add-data': {
      icon: (
        <div className={styles.conversationIcon}>
          <img
            src={emptyStateNoData}
            alt=""
            className={styles.conversationImage}
          />
        </div>
      ),
      title: '', // Figma 设计中没有标题
      description: t('PC.Components.AppDevEmptyState.addDataDescription'),
    },
    'no-file': {
      icon: (
        <div className={styles.serverStateIcon}>
          <img src={emptyStateLaptop} alt="" className={styles.laptopIcon} />
        </div>
      ),
      title: t('PC.Components.AppDevEmptyState.noFileTitle'),
      description: t('PC.Components.AppDevEmptyState.noFileDescription'),
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
              } ${showButtons ? '' : styles['mb-0']}`}
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
            {t('PC.Components.AppDevEmptyState.close')}
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
