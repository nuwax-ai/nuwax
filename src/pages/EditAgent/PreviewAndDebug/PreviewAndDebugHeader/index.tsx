import debugImage from '@/assets/images/debug_image.png';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PreviewAndDebugHeaderProps {
  onPressDebug: () => void;
}

const PreviewAndDebugHeader: React.FC<PreviewAndDebugHeaderProps> = ({
  onPressDebug,
}) => {
  return (
    <header
      className={cx(
        'flex',
        'content-between',
        'items-center',
        styles.container,
      )}
    >
      <h3>预览与调试</h3>
      <div className={cx(styles['extra-box'], 'flex')}>
        {/*<MessageOutlined className={cx('cursor-pointer')} />*/}
        <span
          className={cx(
            'hover-box',
            'cursor-pointer',
            'flex',
            'items-center',
            'content-center',
            styles.debug,
          )}
          onClick={onPressDebug}
        >
          <img src={debugImage as string} alt="" />
          调试
        </span>
      </div>
    </header>
  );
};

export default PreviewAndDebugHeader;
