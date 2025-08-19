import classNames from 'classnames';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import SvgIcon from '../SvgIcon';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface CopyButtonProps {
  /** 要复制的文本内容 */
  text: string;
  /** 复制成功后的回调函数 */
  onCopy?: (text: string, result: boolean) => void;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义图标，如果不传则使用默认的复制图标 */
  icon?: React.ReactNode;
  /** 按钮文本，默认为"复制" */
  children?: React.ReactNode;
  /** 复制按钮的提示文本 */
  tooltipText?: string;
}

/**
 * 复制按钮组件
 * 支持自定义文本、图标、样式和回调函数
 * 默认使用复制图标，支持自定义图标覆盖
 */
const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  onCopy,
  className,
  style,
  disabled = false,
  icon,
  children = '复制',
  tooltipText,
}) => {
  // 处理复制成功
  const handleCopy = (text: string, result: boolean) => {
    if (onCopy) {
      onCopy(text, result);
    }
  };

  // 默认图标
  const defaultIcon = (
    <SvgIcon
      name="icons-chat-copy"
      className={cx(styles['copy-image'])}
      style={{ fontSize: 12 }}
    />
  );

  // 如果禁用，返回禁用状态的按钮
  if (disabled) {
    return (
      <span
        className={cx(
          styles['copy-btn'],
          styles.disabled,
          'flex',
          'items-center',
          'cursor-not-allowed',
          className,
        )}
        style={style}
        title={tooltipText}
      >
        {icon || defaultIcon}
        <span>{children}</span>
      </span>
    );
  }

  return (
    <CopyToClipboard text={text} onCopy={handleCopy}>
      <span
        className={cx(
          styles['copy-btn'],
          'flex',
          'items-center',
          'cursor-pointer',
          className,
        )}
        style={style}
        title={tooltipText}
      >
        {icon || defaultIcon}
        <span>{children}</span>
      </span>
    </CopyToClipboard>
  );
};

export default CopyButton;
