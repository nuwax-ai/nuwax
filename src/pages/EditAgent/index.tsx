import { ICON_CONFIRM_STAR } from '@/constants/images.constants';
import { CaretDownOutlined, FormOutlined } from '@ant-design/icons';
import { Button, Input, Tooltip } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import styles from './index.less';

const cx = classNames.bind(styles);

const { TextArea } = Input;

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const [tipsText, setTipsText] = useState<string>();
  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <AgentHeader />
      <section className={cx('flex', 'flex-1', 'px-16', 'py-16')}>
        <div
          className={cx('radius-6', 'flex', 'flex-col', styles['edit-info'])}
        >
          <div
            className={cx(
              'flex',
              'content-between',
              'items-center',
              'px-16',
              styles['edit-header'],
            )}
          >
            <h3>编排</h3>
            <div className={cx('flex', styles['drop-box'])}>
              <FormOutlined />
              <span>女娲智能体</span>
              <CaretDownOutlined />
            </div>
          </div>
          <div className={cx('flex-1', 'flex')}>
            <div className={cx('flex-1', 'px-16', 'py-16')}>
              <div className={cx('flex', 'items-center', 'content-between')}>
                <span className={cx(styles['system-tips'])}>系统提示词</span>
                <Tooltip title="自动优化提示词" placement="top">
                  <Button
                    className={cx(styles['optimize-btn'])}
                    icon={<ICON_CONFIRM_STAR />}
                  >
                    优化
                  </Button>
                </Tooltip>
              </div>
              <TextArea
                placeholder="输入系统提示词，对大模型进行角色塑造"
                variant="borderless"
                value={tipsText}
                onChange={(e) => setTipsText(e.target.value)}
                autoSize={{ minRows: 6, maxRows: 10 }}
              />
            </div>
            <div className={cx(styles['h-line'])} />
            <div className={cx('flex-1', 'px-16', 'py-12')}>
              <AgentArrangeConfig />
            </div>
          </div>
        </div>
        <div></div>
        <div></div>
      </section>
    </div>
  );
};

export default EditAgent;
