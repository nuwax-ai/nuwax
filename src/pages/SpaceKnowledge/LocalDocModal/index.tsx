import { KNOWLEDGE_LOCAL_DOC_LIST } from '@/constants/library.constants';
import { KnowledgeTextStepEnum } from '@/types/enums/library';
import { Modal, Steps } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import CreateSet from './CreateSet';
import DataProcess from './DataProcess';
import styles from './index.less';
import UploadFile from './UploadFile';

const cx = classNames.bind(styles);

interface LocalDocModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 本地文档弹窗组件
 */
const LocalDocModal: React.FC<LocalDocModalProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const [current, setCurrent] = useState<KnowledgeTextStepEnum>(
    KnowledgeTextStepEnum.Upload,
  );

  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);

  const onChange = (value: KnowledgeTextStepEnum) => {
    console.log('onChange:', value);
    setCurrent(value);
  };

  // 确认事件
  const handleOk = () => {
    setConfirmLoading(true);
    if (current === KnowledgeTextStepEnum.Upload) {
      setCurrent(KnowledgeTextStepEnum.Create_Set);
    }
    if (current === KnowledgeTextStepEnum.Create_Set) {
      setCurrent(KnowledgeTextStepEnum.Data_Processing);
    }
    if (current === KnowledgeTextStepEnum.Data_Processing) {
      onConfirm();
    }
    setConfirmLoading(false);
  };

  return (
    <Modal
      title="添加内容"
      destroyOnClose
      classNames={{
        content: cx(styles.container),
        header: cx(styles.header),
        body: cx(styles.body),
      }}
      open={open}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      cancelText="取消"
      okText="确认"
    >
      <div className={cx(styles['step-wrap'], 'radius-6')}>
        <Steps
          type="default"
          current={current}
          onChange={onChange}
          items={KNOWLEDGE_LOCAL_DOC_LIST}
        />
      </div>
      {current === KnowledgeTextStepEnum.Upload ? (
        <UploadFile />
      ) : current === KnowledgeTextStepEnum.Create_Set ? (
        <CreateSet />
      ) : (
        <DataProcess />
      )}
    </Modal>
  );
};

export default LocalDocModal;
