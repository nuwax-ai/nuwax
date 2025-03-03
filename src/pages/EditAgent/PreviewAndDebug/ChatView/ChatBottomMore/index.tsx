import TooltipIcon from '@/components/TooltipIcon';
import {
  CopyOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface ChatBottomMoreProps {
  onCopy?: () => void;
  onDebug?: () => void;
}

const ChatBottomMore: React.FC<ChatBottomMoreProps> = ({
  onCopy,
  onDebug,
}) => {
  const iconList = [
    {
      icon: <CopyOutlined />,
      title: '复制',
      onClick: onCopy,
    },
    {
      icon: <PaperClipOutlined />,
      title: '调试',
      onClick: onDebug,
    },
    // {
    //   icon: <LinkOutlined />,
    //   title: '追问',
    //   onClick: onAsk,
    // },
    // {
    //   icon: <ReloadOutlined />,
    //   title: '重新生成',
    //   onClick: onRegen,
    // },
    // {
    //   icon: <DeleteOutlined />,
    //   title: '删除',
    //   onClick: onDel,
    // },
  ];

  return (
    <div
      className={cx(
        styles.container,
        'flex',
        'content-between',
        'items-center',
      )}
    >
      <div className={cx('flex', 'items-center', styles['elapsed-time'])}>
        <span>4.7s</span>
        <span className={cx(styles['vertical-line'])} />
        <span>4576 Tokens</span>
      </div>
      <div className={cx('flex', styles['more-action'])}>
        {iconList.map((item, index) => (
          <TooltipIcon
            key={index}
            className={styles.icon}
            icon={item.icon}
            title={item.title}
            type="white"
            onClick={item.onClick}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatBottomMore;
