import { dict } from '@/services/i18nRuntime';
import { CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface AppDevStatusHeroProps {
  /** 标题 */
  title?: string;
  /** 说明 */
  hint?: string;
  /** 是否显示加载图标 */
  spinning?: boolean;
  /** 是否为错误态 */
  error?: boolean;
  /** 底部操作 */
  action?: React.ReactNode;
}

/**
 * AppDevPro 工作区居中状态：服务启动中 / 启动失败。
 *
 * @param props 状态展示属性
 * @returns 居中状态内容
 */
export const AppDevStatusHero: React.FC<AppDevStatusHeroProps> = ({
  title,
  hint,
  spinning = false,
  error = false,
  action,
}) => (
  <div className={cx(styles.stage)}>
    <div className={cx(styles.hero)}>
      {spinning ? (
        <LoadingOutlined style={{ fontSize: 22 }} />
      ) : error ? (
        <CloseCircleOutlined className={cx(styles.errorIcon)} />
      ) : (
        <div className={cx(styles.mark)} aria-hidden />
      )}
      {title ? (
        <p className={cx(styles.title, { [styles.errorTitle]: error })}>
          {title}
        </p>
      ) : null}
      {hint ? <p className={cx(styles.hint)}>{hint}</p> : null}
      {action}
    </div>
  </div>
);

export interface AppDevServiceStartStatusProps {
  /** 是否启动失败 */
  failed: boolean;
  /** 失败后重新启动 */
  onRetry?: () => void;
}

/**
 * 服务启动中 / 启动失败的统一状态，预览与数据库共用。
 *
 * @param props.failed 是否失败
 * @param props.onRetry 失败后重试
 * @returns 服务启动状态
 */
const AppDevServiceStartStatus: React.FC<AppDevServiceStartStatusProps> = ({
  failed,
  onRetry,
}) => (
  <AppDevStatusHero
    spinning={!failed}
    error={failed}
    title={dict(
      failed
        ? 'PC.Pages.AppDevPro.containerStartFailed'
        : 'PC.Pages.AppDevPro.containerStarting',
    )}
    hint={dict(
      failed
        ? 'PC.Pages.AppDevPro.containerStartFailedHint'
        : 'PC.Pages.AppDevPro.containerStartingHint',
    )}
    action={
      failed && onRetry ? (
        <Button type="primary" onClick={onRetry}>
          {dict('PC.Pages.AppDevPro.containerStartRetry')}
        </Button>
      ) : null
    }
  />
);

export default AppDevServiceStartStatus;
