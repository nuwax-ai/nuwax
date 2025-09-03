import { BackgroundImage } from '@/types/background';
import { PlusOutlined } from '@ant-design/icons';
import { Empty, Upload } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './BackgroundImagePanel.less';

const cx = classNames.bind(styles);

interface BackgroundImagePanelProps {
  backgroundImages: BackgroundImage[];
  currentBackground: string;
  onBackgroundChange: (backgroundId: string) => void;
}

const BackgroundImagePanel: React.FC<BackgroundImagePanelProps> = ({
  backgroundImages,
  currentBackground,
  onBackgroundChange,
}) => {
  // 处理文件上传
  const handleUpload = (file: File) => {
    // 这里可以添加上传逻辑
    console.log('上传文件:', file);
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
      <div className={cx(styles.customBackgroundsSection)}>
        <h4>自定义背景图片</h4>
        <div className={cx(styles.customBackgroundGrid)}>
          {/* 上传按钮 */}
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

          {/* 这里可以显示已上传的自定义背景 */}
          {/* 示例：显示一个已上传的背景 */}
          <div
            className={cx(styles.backgroundOption, {
              [styles.active]: currentBackground === 'custom-1',
            })}
            onClick={() => onBackgroundChange('custom-1')}
            title="自定义背景"
          >
            <div
              className={cx(styles.backgroundPreview)}
              style={{
                backgroundImage: `url(${backgroundImages[0]?.preview || ''})`,
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackgroundImagePanel;
