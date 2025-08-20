import { copyTextToClipboard } from '@/utils/clipboard';
import { CopyOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
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
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 复制图标按钮组件
 * 使用统一的 clipboard 工具函数，支持文本和 JSON 数据的复制
 * 提供一致的用户体验和错误处理
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
  style,
  className,
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
        },
        showMessage,
      );
    } catch (error) {
      console.error('复制失败:', error);
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
