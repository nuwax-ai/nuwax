import { copyTextToClipboard } from '@/utils/clipboard';
import { message } from 'antd';
import classNames from 'classnames';
import React from 'react';
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
  /** JSON 缩进空格数 */
  jsonSpace?: number;
  /** 自定义成功消息 */
  successMessage?: string;
  /** 自定义失败消息 */
  errorMessage?: string;
}

/**
 * 复制按钮组件
 * 使用统一的 clipboard 工具函数，支持文本和 JSON 数据的复制
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
  jsonSpace = 2,
  successMessage,
  errorMessage,
}) => {
  // 处理复制
  const handleCopy = async () => {
    try {
      let copyText = '';

      if (data) {
        // 复制 JSON 数据
        copyText = JSON.stringify(data, null, jsonSpace);
      } else if (text) {
        // 复制文本
        copyText = text;
      } else {
        // 没有可复制的内容
        if (onCopy) {
          onCopy('', false);
        }
        return;
      }

      // 使用统一的复制方法
      await copyTextToClipboard(
        copyText,
        (copiedText, result) => {
          if (onCopy) {
            onCopy(copiedText, result || false);
          }
          if (result && showSuccessMsg && successMessage) {
            message.success(successMessage);
          } else if (!result && errorMessage) {
            message.error(errorMessage);
          }
        },
        false,
      );
    } catch (error) {
      console.error('复制失败:', error);
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

  // 可点击的复制按钮
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
      onClick={handleCopy}
    >
      {icon || defaultIcon}
      <span>{children}</span>
    </span>
  );
};

export default CopyButton;
