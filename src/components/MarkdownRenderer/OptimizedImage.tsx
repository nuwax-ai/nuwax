import { Image } from 'antd';
import React, {
  CSSProperties,
  memo,
  useCallback,
  useMemo,
  useState,
} from 'react';

import { IMAGE_FALLBACK } from '@/constants/images.constants';
import stylesInner from './index.less';

/**
 * 优化的图片组件
 * 解决图片闪动问题，提供更好的用户体验
 */
export interface OptimizedImageProps {
  src: string;
  alt?: string;
  title?: string;
  // imageKey: string; // 添加稳定的key
  containerClassNames?: string | string[];
  containerStyles?: CSSProperties;
  styles?: CSSProperties;
  dataKey?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(
  ({
    src,
    containerClassNames,
    containerStyles,
    styles,
    alt = '',
    dataKey,
  }) => {
    const [showPreview, setShowPreview] = useState(false);

    const handleError = useCallback(() => {
      // 这里可以扩展错误处理逻辑
    }, []);

    const containerClassName = useMemo(() => {
      if (containerClassNames) {
        return Array.isArray(containerClassNames)
          ? containerClassNames.join(' ')
          : containerClassNames;
      }
    }, [containerClassNames]);

    // useEffect(() => {
    //   console.log('OptimizedImage mount', src, containerClassName);
    //   return () => {
    //     console.log('OptimizedImage unmount', src, containerClassName);
    //   };
    // }, []);

    return (
      <div
        key={dataKey}
        data-key={dataKey}
        className={containerClassName || stylesInner['image-container']}
        style={containerStyles}
        onClick={() => {
          setShowPreview(true);
        }}
      >
        <Image
          src={src}
          fallback={IMAGE_FALLBACK}
          onError={handleError}
          width="100%"
          style={styles}
          alt={alt}
          preview={
            showPreview
              ? {
                  visible: showPreview,
                  src: src,
                  onVisibleChange: setShowPreview,
                }
              : false
          }
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.src === nextProps.src;
  },
);

export default OptimizedImage;
