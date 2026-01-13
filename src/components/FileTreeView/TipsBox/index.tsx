import { LoadingOutlined } from '@ant-design/icons';
import { Spin } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 提示框组件 Props
 */
interface TipsBoxProps {
  /** 是否显示 */
  visible: boolean;
  /** 提示文本 */
  text: string;
}

/**
 * 提示框组件
 * 用于显示上传、下载、导出等操作的提示信息
 */
const TipsBox: React.FC<TipsBoxProps> = ({ visible, text }) => {
  return (
    <div
      className={cx(
        styles['tips-box'],
        'flex',
        'content-center',
        'items-center',
        'gap-10',
        {
          [styles.visible]: visible,
          [styles.hidden]: !visible,
        },
      )}
    >
      <Spin indicator={<LoadingOutlined spin />} />
      {text}
    </div>
  );
};

export default TipsBox;
