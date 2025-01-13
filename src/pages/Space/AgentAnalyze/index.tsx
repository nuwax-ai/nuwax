import type { AgentAnalyzeProps } from '@/types/interfaces/space';
import { Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const AgentAnalyze: React.FC<AgentAnalyzeProps> = ({ open, onCancel }) => {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="智能体概览"
      footer={false}
      width={556}
    >
      <div className={cx('flex', 'flex-wrap', styles['analyze-wrapper'])}>
        <div className={cx(styles['analyze-box'], 'flex', 'flex-col')}>
          <span>对话人数</span>
          <div className={cx('flex', 'items-center', 'content-center')}>
            232
          </div>
        </div>
        <div className={cx(styles['analyze-box'], 'flex', 'flex-col')}>
          <span>对话次数</span>
          <div className={cx('flex', 'items-center', 'content-center')}>
            232
          </div>
        </div>
        <div className={cx(styles['analyze-box'], 'flex', 'flex-col')}>
          <span>收藏用户数</span>
          <div className={cx('flex', 'items-center', 'content-center')}>
            232
          </div>
        </div>
        <div className={cx(styles['analyze-box'], 'flex', 'flex-col')}>
          <span>点赞次数</span>
          <div className={cx('flex', 'items-center', 'content-center')}>
            232
          </div>
        </div>
        <div className={cx(styles['row-line'])} />
        <div className={cx(styles['vertical-line'])} />
      </div>
    </Modal>
  );
};

export default AgentAnalyze;
