import { SyncOutlined } from '@ant-design/icons';
import React from 'react';

/**
 * 全局遮罩组件，同时支持文件操作、部署等阻断性 loading
 * @param props.visible 是否显示遮罩
 * @param props.tip 可选，自定义提示文案（标题）
 * @param props.subtitle 可选，副标题文案
 * @param props.icon 可选，自定义 loading 图标（不传则用默认蓝色 SyncOutlined）
 * @param props.zIndex 可选，zIndex 层级，默认 9999
 */
interface FileOperatingMaskProps {
  visible: boolean;
  tip?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  zIndex?: number;
}
const FileOperatingMask: React.FC<FileOperatingMaskProps> = ({
  visible,
  tip,
  subtitle,
  icon,
  zIndex,
}) => {
  if (!visible) return null;

  // 是否有自定义图标（icon 为 undefined 时不显示图标区域）
  const hasIcon = icon !== undefined;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(255,255,255,0.80)',
        zIndex: zIndex || 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 内容容器 - 水平布局 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: '16px 24px',
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        }}
      >
        {hasIcon && (
          <div
            style={{
              flexShrink: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'spin 1s linear infinite',
            }}
          >
            {icon || (
              <SyncOutlined spin style={{ fontSize: 32, color: '#1677ff' }} />
            )}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'rgba(0, 0, 0, 0.88)',
              lineHeight: '24px',
            }}
          >
            {tip || '正在执行文件操作，请稍候...'}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 14,
                fontWeight: 400,
                color: 'rgba(0, 0, 0, 0.45)',
                lineHeight: '22px',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {/* CSS animation for spinning icon */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default FileOperatingMask;
