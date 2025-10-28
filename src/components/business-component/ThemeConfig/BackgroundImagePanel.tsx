import { BackgroundImage } from '@/types/background';
import { PlusOutlined } from '@ant-design/icons';
import { Empty, Upload } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './BackgroundImagePanel.less';

const cx = classNames.bind(styles);

interface BackgroundImagePanelProps {
  /** 背景图片列表 */
  backgroundImages: BackgroundImage[];
  /** 当前选中的背景图片ID */
  currentBackground: string;
  /** 背景图片变更回调 */
  onBackgroundChange: (backgroundId: string) => void;
  /** 是否支持自定义背景图片上传，默认 true */
  enableCustomUpload?: boolean;
  /** 自定义背景图片列表 */
  customBackgroundImages?: BackgroundImage[];
  /** 文件上传处理函数 */
  onUpload?: (file: File) => void;
}

const BackgroundImagePanel: React.FC<BackgroundImagePanelProps> = ({
  backgroundImages,
  currentBackground,
  onBackgroundChange,
  enableCustomUpload = true,
  customBackgroundImages = [],
  onUpload,
}) => {
  // 处理文件上传
  const handleUpload = (file: File) => {
    if (onUpload) {
      onUpload(file);
    } else {
      // 默认处理逻辑
      console.log('上传文件:', file);
    }
    return false; // 阻止默认上传行为
  };

  return (
    <div className={cx(styles.backgroundImagePanel)}>
      <h3 className={cx(styles.panelTitle)}>背景图片</h3>

      {/* 系统自带背景图片 */}
      <div className={cx(styles.systemBackgroundsSection)}>
        <h4>系统自带背景图片</h4>
        {backgroundImages.length > 0 ? (
          <div className={cx(styles.backgroundGrid)}>
            {backgroundImages.map((bg) => (
              <div
                key={bg.id}
                className={cx(styles.backgroundOption, {
                  [styles.active]: currentBackground === bg.id,
                })}
                onClick={() => onBackgroundChange(bg.id)}
                title={bg.name}
              >
                <div
                  className={cx(styles.backgroundPreview)}
                  style={{ backgroundImage: `url(${bg.preview})` }}
                />
              </div>
            ))}
          </div>
        ) : (
          <Empty
            description="暂无可用背景图"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>

      {/* 自定义背景图片 */}
      {(enableCustomUpload || customBackgroundImages.length > 0) && (
        <div className={cx(styles.customBackgroundsSection)}>
          <h4>自定义背景图片</h4>
          <div className={cx(styles.customBackgroundGrid)}>
            {/* 上传按钮 - 根据 enableCustomUpload 决定是否显示 */}
            {enableCustomUpload && (
              <div className={cx(styles.uploadOption)}>
                <Upload
                  beforeUpload={handleUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <div className={cx(styles.uploadButton)}>
                    <div className={cx(styles.uploadContainer)}>
                      <PlusOutlined className={cx(styles.uploadIcon)} />
                      <span className={cx(styles.uploadText)}>上传图片</span>
                    </div>
                  </div>
                </Upload>
              </div>
            )}

            {/* 显示已上传的自定义背景 */}
            {customBackgroundImages.map((bg) => (
              <div
                key={bg.id}
                className={cx(styles.backgroundOption, {
                  [styles.active]: currentBackground === bg.id,
                })}
                onClick={() => onBackgroundChange(bg.id)}
                title={bg.name}
              >
                <div
                  className={cx(styles.backgroundPreview)}
                  style={{ backgroundImage: `url(${bg.preview})` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BackgroundImagePanel;
