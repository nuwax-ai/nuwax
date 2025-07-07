import {
  CodeOutlined,
  CopyOutlined,
  DownloadOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { Button, Dropdown, Tooltip } from 'antd';
import React, { useState } from 'react';
import styles from './index.less';

// 导入类型定义
import type { MarkdownCodeToolbarProps } from './types';

// 导入常量
import { MESSAGES } from './constants';

// 导入工具函数
import { downloadPNG, downloadSVG } from './utils';

// 导入自定义hooks
import {
  useContainerPosition,
  useCopyFeature,
  useMermaidFeature,
} from './hooks';

/**
 * Markdown 代码块工具栏组件
 * 提供语言显示、行数统计、折叠切换、代码复制等功能
 * 对于 mermaid 类型还提供图形操作功能
 */
export const MarkdownCodeToolbar: React.FC<MarkdownCodeToolbarProps> = (
  props,
) => {
  // ==================== State ====================
  const [innerProps, setInnerProps] = useState<MarkdownCodeToolbarProps>(props);

  // ==================== 自定义 Hooks ====================
  // 容器位置计算
  const containerPosition = useContainerPosition(
    innerProps.containerId,
    innerProps.id,
    innerProps,
    setInnerProps,
  );

  // 复制功能
  const { isCopying, handleCopy } = useCopyFeature(innerProps);

  // Mermaid 功能
  const { isMermaid, isCodeView, toggleCodeView } =
    useMermaidFeature(innerProps);

  // ==================== 事件处理 ====================
  /**
   * 处理代码视图切换
   */
  const handleToggleCodeView = () => {
    toggleCodeView(innerProps.id || '');
  };

  /**
   * 处理 PNG 下载
   */
  const handleDownloadPNG = () => {
    downloadPNG(innerProps.id || '');
  };

  /**
   * 处理 SVG 下载
   */
  const handleDownloadSVG = () => {
    downloadSVG(innerProps.id || '');
  };

  // ==================== 渲染 ====================
  return (
    <div
      className={`${styles.toolbar} ${innerProps.className || ''}`}
      style={{
        top: containerPosition.top,
        left: containerPosition.left,
        width: containerPosition.width,
      }}
    >
      <div className={styles.toolbarContainer}>
        {/* 左侧信息 */}
        <div className={styles.info}>
          <span className={styles.title}>{innerProps.title}</span>
        </div>

        {/* 右侧操作 */}
        <div className={styles.actions}>
          {/* Mermaid 专用功能 */}
          {isMermaid && (
            <>
              <Tooltip title="查看源代码">
                <Button
                  type={isCodeView ? 'primary' : 'text'}
                  size="small"
                  icon={<CodeOutlined />}
                  onClick={handleToggleCodeView}
                />
              </Tooltip>

              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'svg',
                      label: 'SVG',
                      icon: <DownloadOutlined />,
                      onClick: handleDownloadSVG,
                    },
                    {
                      key: 'png',
                      label: 'PNG',
                      icon: <DownloadOutlined />,
                      onClick: handleDownloadPNG,
                    },
                  ],
                }}
                trigger={['click']}
              >
                <Button type="text" size="small" icon={<DownloadOutlined />}>
                  下载 <DownOutlined />
                </Button>
              </Dropdown>
            </>
          )}

          {/* 通用复制功能 */}
          <Button
            type="text"
            size="small"
            icon={<CopyOutlined />}
            loading={isCopying}
            className={styles.copyBtn}
            onClick={handleCopy}
            title="复制代码"
          >
            {isCopying ? MESSAGES.COPYING : '复制'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MarkdownCodeToolbar;
