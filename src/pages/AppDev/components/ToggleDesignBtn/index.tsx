import { SyncOutlined } from '@ant-design/icons';
import { Segmented } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';
const cx = classNames.bind(styles);

// 切换设计模式按钮
interface ToggleDesignBtnProps {
  className?: string;
}

const ToggleDesignBtn: React.FC<ToggleDesignBtnProps> = ({ className }) => {
  const { iframeDesignMode, isIframeLoaded } = useModel('appDevDesign');

  const toggleIframeDesignMode = () => {
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          type: 'TOGGLE_DESIGN_MODE',
          enabled: !iframeDesignMode,
          timestamp: Date.now(),
        },
        '*',
      );
    }
  };

  return (
    // 聊天模式切换
    <div className={cx(styles.chatModeContainer, className)}>
      <Segmented
        value={iframeDesignMode ? 'design' : 'chat'}
        onChange={toggleIframeDesignMode}
        options={[
          { label: '对话', value: 'chat' },
          {
            label: (
              <div className="flex items-center gap-4">
                {!isIframeLoaded ? (
                  <SyncOutlined spin style={{ fontSize: 12 }} />
                ) : null}
                设计
              </div>
            ),
            value: 'design',
            disabled: !isIframeLoaded,
          },
        ]}
      />
    </div>
  );
};

export default ToggleDesignBtn;
