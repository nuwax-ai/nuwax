import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Modal, Progress } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 空闲警告弹窗属性
 */
export interface IdleWarningModalProps {
  /**
   * 是否显示弹窗
   */
  open: boolean;
  /**
   * 倒计时秒数
   * @default 15
   */
  countdownSeconds?: number;
  /**
   * 用户取消回调（点击按钮或有操作）
   */
  onCancel: () => void;
  /**
   * 倒计时结束回调
   */
  onTimeout: () => void;
  /**
   * 弹窗标题
   * @default '您已长时间未操作'
   */
  title?: string;
  /**
   * 弹窗描述内容
   */
  description?: string;
  /**
   * 确认按钮文字
   * @default '继续使用'
   */
  confirmText?: string;
  /**
   * 是否监听用户操作自动取消
   * 当弹窗显示时，如果检测到键鼠操作，自动取消倒计时
   * @default true
   */
  autoDetectActivity?: boolean;
}

/**
 * 空闲警告弹窗组件
 *
 * 用于在用户空闲一段时间后显示警告，并进行倒计时。
 * 用户可以通过点击按钮或进行键鼠操作来取消倒计时。
 *
 * @example
 * ```tsx
 * <IdleWarningModal
 *   open={showWarning}
 *   countdownSeconds={15}
 *   onCancel={() => setShowWarning(false)}
 *   onTimeout={() => {
 *     // 关闭远程桌面
 *     closeDesktop();
 *   }}
 * />
 * ```
 */
const IdleWarningModal: React.FC<IdleWarningModalProps> = ({
  open,
  countdownSeconds = 15,
  onCancel,
  onTimeout,
  title = '您已长时间未操作',
  description = '系统将自动关闭智能体电脑连接，以节省资源。',
  confirmText = '继续使用',
  autoDetectActivity = true,
}) => {
  // 当前倒计时秒数
  const [countdown, setCountdown] = useState(countdownSeconds);
  // 倒计时定时器引用
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // 用于存储回调函数的最新引用
  const onCancelRef = useRef(onCancel);
  const onTimeoutRef = useRef(onTimeout);

  // 更新回调函数引用
  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
  }, [onTimeout]);

  /**
   * 清除倒计时定时器
   */
  const clearCountdownTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /**
   * 处理用户取消操作
   */
  const handleCancel = useCallback(() => {
    clearCountdownTimer();
    setCountdown(countdownSeconds);
    onCancelRef.current?.();
  }, [clearCountdownTimer, countdownSeconds]);

  /**
   * 处理倒计时结束
   */
  const handleTimeout = useCallback(() => {
    clearCountdownTimer();
    setCountdown(countdownSeconds);
    onTimeoutRef.current?.();
  }, [clearCountdownTimer, countdownSeconds]);

  /**
   * 处理用户活动事件（键鼠操作）
   */
  const handleActivity = useCallback(() => {
    if (autoDetectActivity && open) {
      handleCancel();
    }
  }, [autoDetectActivity, open, handleCancel]);

  // 启动/停止倒计时
  useEffect(() => {
    if (open) {
      // 重置倒计时
      setCountdown(countdownSeconds);

      // 启动倒计时
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            // 倒计时结束
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // 弹窗关闭时清除定时器
      clearCountdownTimer();
      setCountdown(countdownSeconds);
    }

    return () => {
      clearCountdownTimer();
    };
  }, [open, countdownSeconds, handleTimeout, clearCountdownTimer]);

  // 监听用户活动事件
  useEffect(() => {
    if (!open || !autoDetectActivity) {
      return;
    }

    // 监听的事件类型
    const events = ['mousedown', 'keydown', 'touchstart'] as const;

    // 添加事件监听器
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [open, autoDetectActivity, handleActivity]);

  // 计算进度百分比
  const progressPercent = Math.round((countdown / countdownSeconds) * 100);

  // 根据剩余时间确定进度条颜色
  const getProgressStatus = () => {
    if (countdown <= 5) return 'exception';
    if (countdown <= 10) return 'normal';
    return 'active';
  };

  return (
    <Modal
      className={cx(styles['idle-warning-modal'])}
      open={open}
      closable={false}
      maskClosable={false}
      keyboard={false}
      footer={null}
      centered
      width={400}
      zIndex={1100}
    >
      <div className={cx(styles['modal-content'])}>
        {/* 图标 */}
        <div className={cx(styles['icon-container'])}>
          <ExclamationCircleOutlined className={cx(styles['warning-icon'])} />
        </div>

        {/* 标题 */}
        <h3 className={cx(styles['modal-title'])}>{title}</h3>

        {/* 描述 */}
        <p className={cx(styles['modal-description'])}>{description}</p>

        {/* 倒计时显示 */}
        <div className={cx(styles['countdown-container'])}>
          <Progress
            type="circle"
            percent={progressPercent}
            status={getProgressStatus()}
            format={() => (
              <span className={cx(styles['countdown-number'])}>
                {countdown}
              </span>
            )}
            size={80}
            strokeWidth={6}
          />
          <p className={cx(styles['countdown-text'])}>
            {countdown} 秒后自动关闭
          </p>
        </div>

        {/* 操作按钮 */}
        <div className={cx(styles['button-container'])}>
          <Button
            type="primary"
            size="large"
            block
            onClick={handleCancel}
            className={cx(styles['confirm-button'])}
          >
            {confirmText}
          </Button>
        </div>

        {/* 提示文字 */}
        <p className={cx(styles['hint-text'])}>任意键鼠操作将自动取消</p>
      </div>
    </Modal>
  );
};

export default IdleWarningModal;
