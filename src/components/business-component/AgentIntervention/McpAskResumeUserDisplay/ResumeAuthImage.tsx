import { useAuthProtectedImageSrc } from '@/hooks/useAuthProtectedImageSrc';
import { Image } from 'antd';
import React, { memo } from 'react';
import styles from './index.less';

export interface ResumeAuthImageProps {
  url: string;
}

/**
 * MCP Ask resume 内联图片：受保护文件 URL 带 Bearer 拉取后展示，支持预览。
 */
const ResumeAuthImage: React.FC<ResumeAuthImageProps> = memo(({ url }) => {
  const { displaySrc, loading, error } = useAuthProtectedImageSrc(url);

  if (error) {
    return (
      <div className={styles.imagePlaceholder} aria-label="image-load-failed" />
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
    />
  );
});

ResumeAuthImage.displayName = 'ResumeAuthImage';

export default ResumeAuthImage;
