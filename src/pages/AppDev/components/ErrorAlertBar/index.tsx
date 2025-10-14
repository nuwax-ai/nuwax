import { Alert, Button, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import styles from './index.less';

interface ErrorAlertBarProps {
  /** 是否显示错误提示 */
  visible: boolean;
  /** 错误信息 */
  errorMessage?: string;
  /** 错误描述 */
  errorDescription?: string;
  /** 自动消失时间（毫秒），默认10秒 */
  autoHideDelay?: number;
  /** 关闭回调 */
  onClose?: () => void;
  /** 重试回调 */
  onRetry?: () => void;
  /** 自定义样式类名 */
  className?: string;
}

/**
 * 错误提示条组件
 * 在页面顶部显示错误信息，支持自动消失和手动操作
 */
const ErrorAlertBar: React.FC<ErrorAlertBarProps> = ({
  visible,
  errorMessage = '操作失败',
  errorDescription,
  autoHideDelay = 10000,
  onClose,
  onRetry,
  className,
}) => {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowAlert(true);

      // 设置自动隐藏定时器
      const timer = setTimeout(() => {
        setShowAlert(false);
        onClose?.();
      }, autoHideDelay);

      return () => {
        clearTimeout(timer);
      };
    } else {
      setShowAlert(false);
    }
  }, [visible, autoHideDelay, onClose]);

  const handleClose = () => {
    setShowAlert(false);
    onClose?.();
  };

  const handleRetry = () => {
    onRetry?.();
  };

  if (!showAlert) {
    return null;
  }

  return (
    <div className={`${styles.errorAlertBar} ${className || ''}`}>
      <Alert
        message={errorMessage}
        description={errorDescription}
        type="error"
        showIcon
        closable
        onClose={handleClose}
        action={
          <Space>
            {onRetry && (
              <Button size="small" onClick={handleRetry}>
                重试
              </Button>
            )}
            <Button size="small" onClick={handleClose}>
              关闭
            </Button>
          </Space>
        }
      />
    </div>
  );
};

export default ErrorAlertBar;
