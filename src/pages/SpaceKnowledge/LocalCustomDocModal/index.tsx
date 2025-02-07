import {
  KNOWLEDGE_CUSTOM_DOC_LIST,
  KNOWLEDGE_LOCAL_DOC_LIST,
} from '@/constants/library.constants';
import {
  KnowledgeTextImportEnum,
  KnowledgeTextStepEnum,
} from '@/types/enums/library';
import { Modal, Steps } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import CreateSet from './CreateSet';
import DataProcess from './DataProcess';
import TextFill from './TextFill';
import UploadFile from './UploadFile';
import styles from './index.less';

const cx = classNames.bind(styles);

interface LocalCustomDocModalProps {
  type?: KnowledgeTextImportEnum;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 本地文档弹窗组件
 */
const LocalCustomDocModal: React.FC<LocalCustomDocModalProps> = ({
  type = KnowledgeTextImportEnum.Local_Doc,
  open,
  onConfirm,
  onCancel,
}) => {
  const [current, setCurrent] = useState<KnowledgeTextStepEnum>(
    KnowledgeTextStepEnum.Upload_Or_Text_Fill,
  );

  const [confirmLoading, setConfirmLoading] = useState<boolean>(false);

  const onChange = (value: KnowledgeTextStepEnum) => {
    console.log('onChange:', value);
    setCurrent(value);
  };

  // 确认事件
  const handleOk = () => {
    setConfirmLoading(true);
    if (current === KnowledgeTextStepEnum.Upload_Or_Text_Fill) {
      setCurrent(KnowledgeTextStepEnum.Create_Segmented_Set);
    }
    if (current === KnowledgeTextStepEnum.Create_Segmented_Set) {
      setCurrent(KnowledgeTextStepEnum.Data_Processing);
    }
    if (current === KnowledgeTextStepEnum.Data_Processing) {
      onConfirm();
    }
    setConfirmLoading(false);
  };

  const stepList = useMemo(() => {
    return type === KnowledgeTextImportEnum.Local_Doc
      ? KNOWLEDGE_LOCAL_DOC_LIST
      : KNOWLEDGE_CUSTOM_DOC_LIST;
  }, [type]);

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
          items={stepList}
        />
      </div>
      {current === KnowledgeTextStepEnum.Upload_Or_Text_Fill ? (
        type === KnowledgeTextImportEnum.Local_Doc ? (
          <UploadFile />
        ) : (
          <TextFill />
        )
      ) : current === KnowledgeTextStepEnum.Create_Segmented_Set ? (
        <CreateSet />
      ) : (
        <DataProcess />
      )}
    </Modal>
  );
};

export default LocalCustomDocModal;
