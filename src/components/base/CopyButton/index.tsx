import { copyJSON, copyText } from '@/utils/copy';
import classNames from 'classnames';
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import SvgIcon from '../SvgIcon';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface CopyButtonProps {
  /** 要复制的文本内容 */
  text?: string;
  /** 要复制的 JSON 数据 */
  data?: Record<string, any> | any[];
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
  /** 是否显示成功消息 */
  showSuccessMsg?: boolean;
  /** 拷贝方式：'component' | 'function' */
  copyMode?: 'component' | 'function';
  /** JSON 缩进空格数 */
  jsonSpace?: number;
  /** 自定义成功消息 */
  successMessage?: string;
  /** 自定义失败消息 */
  errorMessage?: string;
}

/**
 * 复制按钮组件
 * 支持两种拷贝方式：
 * 1. 使用 react-copy-to-clipboard 组件（默认）
 * 2. 使用统一的拷贝工具函数
 *
 * 支持自定义文本、图标、样式和回调函数
 * 默认使用复制图标，支持自定义图标覆盖
 */
const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  data,
  onCopy,
  className,
  style,
  disabled = false,
  icon,
  children = '复制',
  tooltipText,
  showSuccessMsg = true,
  copyMode = 'component',
  jsonSpace = 2,
  successMessage,
  errorMessage,
}) => {
  // 处理复制成功
  const handleCopy = (text: string, result: boolean) => {
    if (onCopy) {
      onCopy(text, result);
    }
  };

  // 使用函数方式拷贝
  const handleFunctionCopy = async () => {
    try {
      let success = false;

      if (data) {
        // 拷贝 JSON 数据
        success = await copyJSON(
          data,
          jsonSpace,
          showSuccessMsg,
          successMessage,
          errorMessage,
        );
      } else if (text) {
        // 拷贝文本
        success = await copyText(
          text,
          showSuccessMsg,
          successMessage,
          errorMessage,
        );
      }

      if (success && onCopy) {
        onCopy(data ? JSON.stringify(data, null, jsonSpace) : text || '', true);
      }
    } catch (error) {
      console.error('拷贝失败:', error);
      if (onCopy) {
        onCopy('', false);
      }
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

  // 使用函数方式拷贝
  if (copyMode === 'function') {
    return (
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
        onClick={handleFunctionCopy}
      >
        {icon || defaultIcon}
        <span>{children}</span>
      </span>
    );
  }

  // 使用组件方式拷贝（默认）
  const copyTextValue = data
    ? JSON.stringify(data, null, jsonSpace)
    : text || '';

  return (
    <CopyToClipboard text={copyTextValue} onCopy={handleCopy}>
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
