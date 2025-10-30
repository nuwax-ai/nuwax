import { SyncOutlined } from '@ant-design/icons';
import React from 'react';

/**
 * 全局遮罩组件，同时支持文件操作、部署等阻断性 loading
 * @param props.visible 是否显示遮罩
 * @param props.tip 可选，自定义提示文案
 * @param props.icon 可选，自定义 loading 图标（不传则用默认蓝色 SyncOutlined）
 * @param props.zIndex 可选，zIndex 层级，默认 9999
 */
interface FileOperatingMaskProps {
  visible: boolean;
  tip?: string;
  icon?: React.ReactNode;
  zIndex?: number;
}
const FileOperatingMask: React.FC<FileOperatingMaskProps> = ({
  visible,
  tip,
  icon,
  zIndex,
}) => {
  if (!visible) return null;
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
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: 32 }}>
        {icon || (
          <SyncOutlined spin style={{ fontSize: 52, color: '#1677ff' }} />
        )}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 600,
          color: '#333',
          textAlign: 'center',
          maxWidth: 520,
        }}
      >
        {tip || '正在执行文件操作，请稍候...'}
      </div>
    </div>
  );
};

export default FileOperatingMask;
