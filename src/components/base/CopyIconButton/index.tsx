import { copyJSON, copyText } from '@/utils/copy';
import { CopyOutlined } from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import React from 'react';

export interface CopyIconButtonProps {
  /** 要复制的文本内容 */
  text?: string;
  /** 要复制的 JSON 数据 */
  data?: Record<string, any> | any[];
  /** 复制成功后的回调函数 */
  onCopy?: (text: string, result: boolean) => void;
  /** 按钮类型 */
  buttonType?: 'text' | 'link' | 'default' | 'primary' | 'dashed';
  /** 按钮大小 */
  buttonSize?: 'large' | 'middle' | 'small';
  /** 是否显示成功提示 */
  showMessage?: boolean;
  /** JSON 缩进空格数 */
  jsonSpace?: number;
  /** 提示文本 */
  tooltipTitle?: string;
  /** 自定义成功消息 */
  successMessage?: string;
  /** 自定义失败消息 */
  errorMessage?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 拷贝图标按钮组件
 * 支持文本和 JSON 数据的拷贝
 * 使用统一的拷贝工具函数，提供一致的用户体验
 */
const CopyIconButton: React.FC<CopyIconButtonProps> = ({
  text,
  data,
  onCopy,
  buttonType = 'text',
  buttonSize = 'small',
  showMessage = true,
  jsonSpace = 2,
  tooltipTitle = '复制',
  successMessage,
  errorMessage,
  style,
  className,
}) => {
  // 处理拷贝
  const handleCopy = async () => {
    try {
      let success = false;
      let copiedText = '';

      if (data) {
        // 拷贝 JSON 数据
        success = await copyJSON(
          data,
          jsonSpace,
          showMessage,
          successMessage,
          errorMessage,
        );
        copiedText = JSON.stringify(data, null, jsonSpace);
      } else if (text) {
        // 拷贝文本
        success = await copyText(
          text,
          showMessage,
          successMessage,
          errorMessage,
        );
        copiedText = text;
      } else {
        if (showMessage) {
          message.error(errorMessage || '没有可复制的内容');
        }
        return;
      }

      if (success && onCopy) {
        onCopy(copiedText, true);
      }
    } catch (error) {
      console.error('拷贝失败:', error);
      if (onCopy) {
        onCopy('', false);
      }
    }
  };

  return (
    <Tooltip title={tooltipTitle}>
      <Button
        type={buttonType}
        size={buttonSize}
        icon={<CopyOutlined />}
        onClick={handleCopy}
        style={style}
        className={className}
      />
    </Tooltip>
  );
};

export default CopyIconButton;
