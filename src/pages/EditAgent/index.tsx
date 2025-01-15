import ShowStand from '@/pages/EditAgent/ShowStand';
import VersionHistory from '@/pages/EditAgent/VersionHistory';
import { EditAgentShowType } from '@/types/enums/space';
import classNames from 'classnames';
import React, { useState } from 'react';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import ArrangeTitle from './ArrangeTitle';
import DebugDetails from './DebugDetails';
import styles from './index.less';
import PreviewAndDebug from './PreviewAndDebug';
import SystemTipsWord from './SystemTipsWord';

const cx = classNames.bind(styles);

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const [tipsText, setTipsText] = useState<string>('');
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );

  const handlerClose = () => {
    setShowType(0);
  };

  const handlerDebug = () => {
    setShowType(1);
  };

  const handlerToggleShowStand = () => {
    setShowType(2);
  };

  const handlerToggleHistoryLog = () => {
    setShowType(3);
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <AgentHeader
        onToggleShowStand={handlerToggleShowStand}
        onToggleHistoryLog={handlerToggleHistoryLog}
      />
      <section
        className={cx(
          'flex',
          'flex-1',
          'px-16',
          'py-16',
          'overflow-y',
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
        <PreviewAndDebug onPressDebug={handlerDebug} />
        {/*调试详情*/}
        <DebugDetails
          visible={showType === EditAgentShowType.Debug_Details}
          onClose={handlerClose}
        />
        {/*展示台*/}
        <ShowStand
          visible={showType === EditAgentShowType.Show_Stand}
          onClose={handlerClose}
        />
        {/*版本历史*/}
        <VersionHistory
          visible={showType === EditAgentShowType.Version_History}
          onClose={handlerClose}
        />
      </section>
    </div>
  );
};

export default EditAgent;
