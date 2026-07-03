import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { FileOutlined } from '@ant-design/icons';
import { Image } from 'antd';
import React, { memo, useCallback, useState } from 'react';
import styles from './index.less';

export interface ResumeAuthImageProps {
  url: string;
}

/**
 * MCP Ask resume 内联图片：受保护文件 URL 带 Bearer 拉取后展示，支持预览。
 * 加载失败时展示灰色通用文件图标，不使用 PDF 专用图标或 Ant Design 错误态。
 */
const ResumeAuthImage: React.FC<ResumeAuthImageProps> = memo(({ url }) => {
  const { displaySrc, loading, error } = useAuthProtectedImageSrc(url);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const handleImageError = useCallback(() => {
    setImageLoadFailed(true);
  }, []);

  if (error || imageLoadFailed) {
    return (
      <span
        className={styles.imageFallback}
        aria-label="image-fallback"
        aria-hidden="true"
      >
        <FileOutlined />
      </span>
    );
  }

  if (loading || !displaySrc) {
    return <div className={styles.imagePlaceholder} aria-busy="true" />;
  }

  return (
    <Image
      src={displaySrc}
      alt=""
      width={62}
      height={62}
      className={styles.image}
      rootClassName={styles.imageWrap}
      preview={{ mask: false, src: displaySrc }}
      onError={handleImageError}
    />
  );
});

ResumeAuthImage.displayName = 'ResumeAuthImage';

export default ResumeAuthImage;
