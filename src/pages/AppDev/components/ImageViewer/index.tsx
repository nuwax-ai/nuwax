import SvgIcon from '@/components/base/SvgIcon';
import { IMAGE_FALLBACK } from '@/constants/images.constants';
import { dict } from '@/services/i18nRuntime';
import { isBase64Image } from '@/utils/appDevUtils';
import { Button, Image, Tooltip } from 'antd';
import React from 'react';
import styles from './index.less';

interface ImageViewerProps {
  /** 图片路径 */
  imagePath?: string;
  /** 图片URL */
  imageUrl: string;
  /** 图片alt文本 */
  alt: string;
  /** 刷新回调 */
  onRefresh?: () => void;
}

/**
 * 图片查看器组件
 * 显示图片预览，支持 base64 和普通 URL
 */
const ImageViewer: React.FC<ImageViewerProps> = ({
  imagePath,
  imageUrl,
  alt,
  onRefresh,
}) => {
  // 判断是否为 base64 图片
  const isBase64 = isBase64Image(imageUrl);
  //如果是相对地址就可
  let _imageUrl = imageUrl;
  if (_imageUrl.startsWith('/')) {
    _imageUrl = `${process.env.BASE_URL}${_imageUrl}`;
  }
  return (
    <div className={styles.imagePreviewContainer}>
      {imagePath && (
        <div className={styles.imagePreviewHeader}>
          <span>
            {dict('PC.Pages.AppDevImageViewer.previewPath', imagePath)}
            {isBase64 && (
              <span className={styles.base64Indicator}>
                {dict('PC.Pages.AppDevImageViewer.base64Tag')}
              </span>
            )}
          </span>
          <Tooltip title={dict('PC.Common.Global.refresh')}>
            <Button
              size="small"
              type="text"
              icon={
                <SvgIcon name="icons-common-refresh" style={{ fontSize: 16 }} />
              }
              onClick={onRefresh}
            />
          </Tooltip>
        </div>
      )}
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
          src={_imageUrl}
          alt={alt}
          style={{
            maxWidth: '100%',
            maxHeight: '600px',
          }}
          fallback={IMAGE_FALLBACK}
        />
      </div>
    </div>
  );
};

export default ImageViewer;
