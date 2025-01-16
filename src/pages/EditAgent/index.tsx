import CreateAgent from '@/components/CreateAgent';
import PublishAgent from '@/pages/EditAgent/PublishAgent';
import { CreateEditAgentEnum } from '@/types/enums/common';
import { EditAgentShowType } from '@/types/enums/space';
import { Form } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import AgentArrangeConfig from './AgentArrangeConfig';
import AgentHeader from './AgentHeader';
import ArrangeTitle from './ArrangeTitle';
import DebugDetails from './DebugDetails';
import styles from './index.less';
import PreviewAndDebug from './PreviewAndDebug';
import ShowStand from './ShowStand';
import SystemTipsWord from './SystemTipsWord';
import VersionHistory from './VersionHistory';

const cx = classNames.bind(styles);

/**
 * 编辑智能体
 */
const EditAgent: React.FC = () => {
  const [tipsText, setTipsText] = useState<string>('');
  const [showType, setShowType] = useState<EditAgentShowType>(
    EditAgentShowType.Hide,
  );
  const [open, setOpen] = useState<boolean>(false);
  const [openEditAgent, setOpenEditAgent] = useState<boolean>(false);
  const [form] = Form.useForm();

  const handlerClose = () => {
    setShowType(EditAgentShowType.Hide);
  };

  const handlerDebug = () => {
    setShowType(EditAgentShowType.Debug_Details);
  };

  const handlerToggleShowStand = () => {
    setShowType(EditAgentShowType.Show_Stand);
  };

  const handlerToggleVersionHistory = () => {
    setShowType(EditAgentShowType.Version_History);
  };

  // 点击发布按钮，打开发布智能体弹窗
  const handlerPublishAgent = () => {
    setOpen(true);
  };

  // 确认发布智能体
  const handlerConfirmPublish = () => {
    form.submit();
    setOpen(false);
  };

  // 取消发布
  const handlerCancelPublish = () => {
    setOpen(false);
  };

  // 点击编辑智能体按钮，打开弹窗
  const handlerEditAgent = () => {
    setOpenEditAgent(true);
  };

  // 确认编辑智能体
  const handlerConfirmEditAgent = () => {
    setOpenEditAgent(false);
  };

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <AgentHeader
        onToggleShowStand={handlerToggleShowStand}
        handlerToggleVersionHistory={handlerToggleVersionHistory}
        onEditAgent={handlerEditAgent}
        onPublish={handlerPublishAgent}
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
      {/*发布智能体弹窗*/}
      <PublishAgent
        form={form}
        open={open}
        onConfirm={handlerConfirmPublish}
        onCancel={handlerCancelPublish}
      />
      {/*编辑智能体弹窗*/}
      <CreateAgent
        type={CreateEditAgentEnum.Edit}
        agentName={'测试智能体'}
        intro={'这里是智能体的介绍'}
        open={openEditAgent}
        onCancel={() => setOpenEditAgent(false)}
        onConfirm={handlerConfirmEditAgent}
      />
    </div>
  );
};

export default EditAgent;
