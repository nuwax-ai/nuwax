import { ReloadOutlined } from '@ant-design/icons';
import { Button, Image } from 'antd';
import React from 'react';
import styles from './index.less';

interface ImageViewerProps {
  /** 图片路径 */
  imagePath: string;
  /** 图片URL */
  imageUrl: string;
  /** 图片alt文本 */
  alt: string;
  /** 刷新回调 */
  onRefresh: () => void;
}

/**
 * 图片查看器组件
 * 显示图片预览
 */
const ImageViewer: React.FC<ImageViewerProps> = ({
  imagePath,
  imageUrl,
  alt,
  onRefresh,
}) => {
  return (
    <div className={styles.imagePreviewContainer}>
      <div className={styles.imagePreviewHeader}>
        <span>图片预览: {imagePath}</span>
        <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh}>
          刷新
        </Button>
      </div>
      <div
        className={styles.imagePreviewContent}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Image
          src={imageUrl}
          alt={alt}
          style={{
            maxWidth: '100%',
            maxHeight: '600px',
          }}
          fallback={`/api/file-preview/${imagePath}`}
        />
      </div>
    </div>
  );
};

export default ImageViewer;
