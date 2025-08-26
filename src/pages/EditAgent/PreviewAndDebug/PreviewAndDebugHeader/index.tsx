import { SvgIcon } from '@/components/base';
import { Button } from 'antd';
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
        <Button
          type="text"
          className={cx(styles.debug)}
          icon={<SvgIcon name="icons-common-debug" />}
          onClick={onPressDebug}
        >
          调试
        </Button>
      </div>
    </header>
  );
};

export default PreviewAndDebugHeader;
