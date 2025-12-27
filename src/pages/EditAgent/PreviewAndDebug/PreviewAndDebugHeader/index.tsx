import { SvgIcon } from '@/components/base';
import { EditAgentShowType } from '@/types/enums/space';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PreviewAndDebugHeaderProps {
  isShowPreview?: boolean;
  onShowPreview?: () => void;
  onPressDebug: () => void;
  onToggleFileTree?: () => void;
  isFileTreeVisible?: boolean;
}

const PreviewAndDebugHeader: React.FC<PreviewAndDebugHeaderProps> = ({
  onPressDebug,
  onShowPreview,
  isShowPreview,
  onToggleFileTree,
  isFileTreeVisible,
}) => {
  const { showType } = useModel('conversationInfo');

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
        {(showType === EditAgentShowType.Version_History ||
          showType === EditAgentShowType.Show_Stand ||
          showType === EditAgentShowType.Hide) && (
          <Button
            type="text"
            className={cx(styles.debug)}
            icon={
              <SvgIcon name="icons-common-debug" style={{ fontSize: 16 }} />
            }
            onClick={onPressDebug}
          >
            调试
          </Button>
        )}

        {/*打开预览页面*/}
        {isShowPreview && (
          <Button
            type="text"
            className={cx(styles.debug)}
            icon={
              <SvgIcon name="icons-nav-ecosystem" style={{ fontSize: 16 }} />
            }
            onClick={() => onShowPreview?.()}
          />
        )}

        {/*文件树切换按钮*/}
        {onToggleFileTree && !isFileTreeVisible && (
          <Button
            type="text"
            className={cx(styles.debug)}
            icon={
              <SvgIcon name="icons-nav-components" style={{ fontSize: 16 }} />
            }
            onClick={onToggleFileTree}
          />
        )}
      </div>
    </header>
  );
};

export default PreviewAndDebugHeader;
