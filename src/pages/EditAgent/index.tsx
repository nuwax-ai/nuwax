import CreateAgent from '@/components/CreateAgent';
import CustomFormModal from '@/components/CustomFormModal';
import { CreateEditAgentEnum } from '@/types/enums/common';
import { EditAgentShowType } from '@/types/enums/space';
import { Checkbox, Form, Input } from 'antd';
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

  const handlerPublishAgent = () => {
    setOpen(true);
  };

  const handlerConfirmPublish = () => {
    form.submit();
    setOpen(false);
  };

  const handlerCancelPublish = () => {
    setOpen(false);
  };

  const handlerEditAgent = () => {
    setOpenEditAgent(true);
  };

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
      <CustomFormModal
        form={form}
        classNames={{
          content: styles['modal-content'],
          header: styles['modal-content'],
        }}
        loading={false}
        title="发布智能体"
        open={open}
        onConfirm={handlerConfirmPublish}
        onCancel={handlerCancelPublish}
      >
        <Form form={form} layout={'vertical'}>
          <Form.Item label="发布渠道">
            <Checkbox>广场</Checkbox>
          </Form.Item>
          <Form.Item label="发布记录">
            <Input.TextArea
              rootClassName={styles['input-textarea']}
              placeholder="这里填写详细的发布记录，如果渠道选择了广场审核通过后将在智能体广场进行展示"
              autoSize={{ minRows: 5, maxRows: 8 }}
            ></Input.TextArea>
          </Form.Item>
        </Form>
      </CustomFormModal>
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
