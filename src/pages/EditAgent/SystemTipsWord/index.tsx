// import { ICON_CONFIRM_STAR } from '@/constants/images.constants';
import type { SystemTipsWordProps } from '@/types/interfaces/space';
import { Input } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const { TextArea } = Input;

/**
 * 系统提示词组件
 */
const SystemTipsWord: React.FC<SystemTipsWordProps> = ({ value, onChange }) => {
  return (
    <div className={cx('flex-1', 'px-16', 'py-16')}>
      <div
        className={cx(
          'flex',
          'items-center',
          'content-between',
          'mb-16',
          'py-6',
        )}
      >
        <span className={cx(styles['system-tips'])}>系统提示词</span>
        {/*<Tooltip title="自动优化提示词" placement="top">*/}
        {/*  <Button*/}
        {/*    className={cx(styles['optimize-btn'])}*/}
        {/*    icon={<ICON_CONFIRM_STAR />}*/}
        {/*  >*/}
        {/*    优化*/}
        {/*  </Button>*/}
        {/*</Tooltip>*/}
      </div>
      <TextArea
        rootClassName={styles['text-area']}
        placeholder={'输入系统提示词，对大模型进行角色塑造'}
        variant="borderless"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoSize={{ minRows: 20, maxRows: 30 }}
      />
    </div>
  );
};

export default SystemTipsWord;
