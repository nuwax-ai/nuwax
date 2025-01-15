import ChatView from '@/pages/EditAgent/PreviewAndDebug/ChatView';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';
import PreviewAndDebugHeader from './PreviewAndDebugHeader';

const cx = classNames.bind(styles);

interface PreviewAndDebugHeaderProps {
  onPressDebug: () => void;
}

const PreviewAndDebug: React.FC<PreviewAndDebugHeaderProps> = ({
  onPressDebug,
}) => {
  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <PreviewAndDebugHeader onPressDebug={onPressDebug} />
      <div className={cx(styles['divider-horizontal'])}></div>
      <div className={cx(styles['main-content'])}>
        <ChatView />
      </div>
    </div>
  );
};

export default PreviewAndDebug;
