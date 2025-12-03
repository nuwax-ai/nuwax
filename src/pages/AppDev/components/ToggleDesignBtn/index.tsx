import { Button } from 'antd';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';

// 切换设计模式按钮
interface ToggleDesignBtnProps {
  className?: string;
}

const ToggleDesignBtn: React.FC<ToggleDesignBtnProps> = ({ className }) => {
  const { iframeDesignMode, isIframeLoaded } = useModel('appDev');

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
    <Button
      type="primary"
      onClick={toggleIframeDesignMode}
      disabled={!isIframeLoaded}
      icon={
        <svg height="16" strokeLinejoin="round" viewBox="0 0 16 16" width="16">
          <path
            d="M3.24695 2.29181L13.9969 6.04181L15.577 6.59259L14.1141 7.40509L9.86414 9.76642C9.82336 9.78908 9.78914 9.8233 9.76648 9.86407L7.40515 14.1141L6.59265 15.577L6.04187 13.9969L2.29187 3.24689L1.78015 1.78009L3.24695 2.29181ZM6.9071 11.9227L8.45593 9.13556C8.61463 8.84994 8.85 8.61457 9.13562 8.45587L11.9237 6.90607L4.2196 4.21857L6.9071 11.9227Z"
            fill="currentColor"
          ></path>
        </svg>
      }
      className={`${
        iframeDesignMode ? styles.active : styles.default
      } ${className}`}
    >
      design
    </Button>
  );
};

export default ToggleDesignBtn;
