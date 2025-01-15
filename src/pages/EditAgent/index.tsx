import PreviewAndDebug from '@/pages/EditAgent/PreviewAndDebug';
import classNames from 'classnames';
import React, { useState } from 'react';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import ArrangeTitle from './ArrangeTitle';
import styles from './index.less';
import SystemTipsWord from './SystemTipsWord';

const cx = classNames.bind(styles);

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const [tipsText, setTipsText] = useState<string>('');

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <AgentHeader />
      <section
        className={cx(
          'flex',
          'flex-1',
          'px-16',
          'py-16',
          'overflow-hide',
          styles.section,
        )}
      >
        {/*编排*/}
        <div
          className={cx('radius-6', 'flex', 'flex-col', styles['edit-info'])}
        >
          {/*编排title*/}
          <ArrangeTitle />
          <div className={cx('flex-1', 'flex', 'overflow-y')}>
            {/*系统提示词*/}
            <SystemTipsWord value={tipsText} onChange={setTipsText} />
            <div className={cx(styles['h-line'])} />
            {/*配置区域*/}
            <AgentArrangeConfig />
          </div>
        </div>
        {/*预览与调试*/}
        <PreviewAndDebug />
        {/*调试详情*/}
        <div></div>
      </section>
    </div>
  );
};

export default EditAgent;
