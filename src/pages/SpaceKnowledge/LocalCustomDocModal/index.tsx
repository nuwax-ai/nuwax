import {
  KNOWLEDGE_CUSTOM_DOC_LIST,
  KNOWLEDGE_LOCAL_DOC_LIST,
} from '@/constants/library.constants';
import { apiKnowledgeDocumentAdd } from '@/services/knowledge';
import {
  KnowledgeTextImportEnum,
  KnowledgeTextStepEnum,
} from '@/types/enums/library';
import type {
  LocalCustomDocModalProps,
  UploadFileInfo,
} from '@/types/interfaces/knowledge';
import { SegmentConfigModel } from '@/types/interfaces/knowledge';
import { DeleteOutlined } from '@ant-design/icons';
import { Form, message, Modal, Steps } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import { useRequest } from 'umi';
import CreateSet from './CreateSet';
import DataProcess from './DataProcess';
import TextFill from './TextFill';
import UploadFile from './UploadFile';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 本地文档弹窗组件
 */
const LocalCustomDocModal: React.FC<LocalCustomDocModalProps> = ({
  id,
  type = KnowledgeTextImportEnum.Local_Doc,
  open,
  onConfirm,
  onCancel,
}) => {
  const [form] = Form.useForm();
  const [current, setCurrent] = useState<KnowledgeTextStepEnum>(
    KnowledgeTextStepEnum.Upload_Or_Text_Fill,
  );
  // 上传文件信息
  const [uploadFileList, setUploadFileList] = useState<UploadFileInfo[]>([]);
  // 快速自动分段与清洗,true:无需分段设置,自动使用默认值
  const [autoSegmentConfigFlag, setAutoSegmentConfigFlag] =
    useState<boolean>(true);
  const [segmentConfigModel, setSegmentConfigModel] =
    useState<SegmentConfigModel>();

  // 知识库文档配置 - 数据新增接口
  const { run: runDocAdd } = useRequest(apiKnowledgeDocumentAdd, {
    manual: true,
    debounceWait: 300,
    onSuccess: () => {
      message.success('文档添加成功');
      onConfirm();
    },
  });

  // 确认事件
  const handleOk = async () => {
    if (current === KnowledgeTextStepEnum.Upload_Or_Text_Fill) {
      setCurrent(KnowledgeTextStepEnum.Create_Segmented_Set);
    }
    if (current === KnowledgeTextStepEnum.Create_Segmented_Set) {
      if (!autoSegmentConfigFlag) {
        const values = await form.validateFields();
        setSegmentConfigModel(values);
      }
      setCurrent(KnowledgeTextStepEnum.Data_Processing);
    }
    if (current === KnowledgeTextStepEnum.Data_Processing) {
      const fileList =
        uploadFileList?.map((info) => ({
          name: info.fileName,
          docUrl: info.url,
        })) || [];
      runDocAdd({
        kbId: id,
        fileList,
        autoSegmentConfigFlag: true,
        segmentConfig: {
          segment: 'WORDS',
          ...segmentConfigModel,
          isTrim: true,
        },
      });
    }
  };

  const stepList = useMemo(() => {
    return type === KnowledgeTextImportEnum.Local_Doc
      ? KNOWLEDGE_LOCAL_DOC_LIST
      : KNOWLEDGE_CUSTOM_DOC_LIST;
  }, [type]);

  // 上传的文件列表
  const handleUploadSuccess = (data: UploadFileInfo) => {
    const _uploadFileInfo = [...uploadFileList];
    _uploadFileInfo.push(data);
    setUploadFileList(_uploadFileInfo);
  };

  // 删除上传的文件列表
  const handleUploadFileDel = (index: number) => {
    const _uploadFileInfo = [...uploadFileList];
    _uploadFileInfo.splice(index, 1);
    setUploadFileList(_uploadFileInfo);
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
      onCancel={onCancel}
      cancelText="取消"
      okText="确认"
    >
      <div className={cx(styles['step-wrap'], 'radius-6')}>
        <Steps type="default" current={current} items={stepList} />
      </div>
      {current === KnowledgeTextStepEnum.Upload_Or_Text_Fill ? (
        type === KnowledgeTextImportEnum.Local_Doc ? (
          <>
            <UploadFile onUploadSuccess={handleUploadSuccess} />
            {uploadFileList?.map((info, index) => (
              <div
                key={info.key}
                className={cx(
                  'flex',
                  'items-center',
                  'content-between',
                  styles['file-box'],
                )}
              >
                <span>
                  {info.fileName} ({`${info.size}k`})
                </span>
                <DeleteOutlined onClick={() => handleUploadFileDel(index)} />
              </div>
            ))}
          </>
        ) : (
          <TextFill />
        )
      ) : current === KnowledgeTextStepEnum.Create_Segmented_Set ? (
        <CreateSet
          form={form}
          autoSegmentConfigFlag={autoSegmentConfigFlag}
          onChoose={(flag) => setAutoSegmentConfigFlag(flag)}
        />
      ) : (
        <DataProcess />
      )}
    </Modal>
  );
};

export default LocalCustomDocModal;
