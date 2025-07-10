import docImage from '@/assets/images/doc_image.jpg';
import {
  KNOWLEDGE_CUSTOM_DOC_LIST,
  KNOWLEDGE_LOCAL_DOC_LIST,
} from '@/constants/library.constants';
import {
  apiKnowledgeDocumentAdd,
  apiKnowledgeDocumentCustomAdd,
} from '@/services/knowledge';
import { UploadFileStatus } from '@/types/enums/common';
import {
  KnowledgeSegmentIdentifierEnum,
  KnowledgeSegmentTypeEnum,
  KnowledgeTextImportEnum,
  KnowledgeTextStepEnum,
} from '@/types/enums/library';
import type { UploadFileInfo } from '@/types/interfaces/common';
import type {
  LocalCustomDocModalProps,
  SegmentConfigModel,
} from '@/types/interfaces/knowledge';
import { getProgressStatus, handleUploadFileList } from '@/utils/upload';
import {
  CheckCircleOutlined,
  CloseCircleFilled,
  DeleteOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  message,
  Modal,
  Progress,
  Steps,
  UploadProps,
} from 'antd';
import classNames from 'classnames';
import omit from 'lodash/omit';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  // 自定义模式下form
  const [formText] = Form.useForm();
  // 步骤
  const [current, setCurrent] = useState<KnowledgeTextStepEnum>(
    KnowledgeTextStepEnum.Upload_Or_Text_Fill,
  );
  // 上传文件信息
  const [allUploadFileList, setAllUploadFileList] = useState<UploadFileInfo[]>(
    [],
  );
  const [uploadFileList, setUploadFileList] = useState<UploadFileInfo[]>([]);
  // 快速自动分段与清洗,true:无需分段设置,自动使用默认值
  const [autoSegmentConfigFlag, setAutoSegmentConfigFlag] =
    useState<boolean>(true);
  const fileConfigRef = useRef<{
    name: string;
    fileContent: string;
  }>();

  useEffect(() => {
    setUploadFileList(
      allUploadFileList.filter(
        (info) => info.status === UploadFileStatus.done && info.key && info.url,
      ),
    );
  }, [allUploadFileList]);

  // 分段配置信息
  const segmentConfigModelRef = useRef<SegmentConfigModel | null>(null);

  // 清除重置操作
  const handleClear = () => {
    setCurrent(KnowledgeTextStepEnum.Upload_Or_Text_Fill);
    setAllUploadFileList([]);
    setAutoSegmentConfigFlag(true);
    form.resetFields();
    formText.resetFields();
    segmentConfigModelRef.current = null;
  };

  // 知识库文档配置 - 数据新增接口
  const { run: runDocAdd } = useRequest(apiKnowledgeDocumentAdd, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('文档添加成功');
      handleClear();
      onConfirm();
    },
  });

  // 知识库文档配置 - 自定义新增接口
  const { run: runDocCustomAdd } = useRequest(apiKnowledgeDocumentCustomAdd, {
    manual: true,
    debounceInterval: 300,
    onSuccess: () => {
      message.success('文档添加成功');
      handleClear();
      onConfirm();
    },
  });

  // 本地文档 - 确认事件
  const handleOk = async () => {
    const fileList =
      uploadFileList?.map((info) => ({
        name: info.name,
        docUrl: info.url,
        fileSize: info.size,
      })) || [];

    const data = {
      kbId: id,
      fileList,
      autoSegmentConfigFlag: autoSegmentConfigFlag,
    };
    // 自动分段与清洗
    if (autoSegmentConfigFlag) {
      runDocAdd(data);
    } else {
      runDocAdd({
        ...data,
        segmentConfig: {
          segment: KnowledgeSegmentTypeEnum.DELIMITER,
          ...segmentConfigModelRef.current,
          isTrim: true,
        },
      });
    }
  };
  const getStatus = useCallback(
    (fileInfo: UploadFileInfo) => getProgressStatus(fileInfo),
    [],
  );

  // 自定义文档 - 确认事件
  const handleCustomDocOk = async () => {
    const data = {
      kbId: id,
      ...fileConfigRef.current,
      autoSegmentConfigFlag: autoSegmentConfigFlag,
    };
    // 自动分段与清洗
    if (autoSegmentConfigFlag) {
      runDocCustomAdd(data);
    } else {
      runDocCustomAdd({
        ...data,
        segmentConfig: {
          segment: KnowledgeSegmentTypeEnum.DELIMITER,
          ...segmentConfigModelRef.current,
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

  // 删除上传的文件列表
  const handleUploadFileDel = (uid: string) => {
    const _uploadFileInfo = [...allUploadFileList];
    _uploadFileInfo.splice(
      _uploadFileInfo.findIndex((item) => item.uid === uid),
      1,
    );
    setAllUploadFileList(_uploadFileInfo);
  };

  // 上传 - 下一步
  const handleUploadOrTextInput = async () => {
    if (type === KnowledgeTextImportEnum.Custom) {
      fileConfigRef.current = await formText.validateFields();
    }
    setCurrent(KnowledgeTextStepEnum.Create_Segmented_Set);
  };

  // 创建设置 - 下一步
  const handleConfirmCreateSet = async () => {
    if (!autoSegmentConfigFlag) {
      const formValues = await form.validateFields();
      let data;
      // 选择自定义'分段标识符'
      if (
        formValues?.selectDelimiter === KnowledgeSegmentIdentifierEnum.Custom
      ) {
        data = omit(formValues, ['selectDelimiter']);
      } else {
        // 选择下拉'分段标识符'
        data = {
          delimiter: formValues?.selectDelimiter,
          overlaps: Number(formValues.overlaps),
          words: Number(formValues.words),
        };
      }
      segmentConfigModelRef.current = data as SegmentConfigModel;
    }
    setCurrent(KnowledgeTextStepEnum.Data_Processing);
  };

  // Modal弹窗footer组件
  const footerComponent = () => {
    switch (current) {
      case KnowledgeTextStepEnum.Upload_Or_Text_Fill:
        return (
          <div className={cx('flex', 'content-end', styles.gap)}>
            <Button onClick={onCancel}>取消</Button>
            <Button
              onClick={handleUploadOrTextInput}
              type="primary"
              disabled={
                type === KnowledgeTextImportEnum.Local_Doc
                  ? uploadFileList?.length === 0
                  : false
              }
            >
              下一步
            </Button>
          </div>
        );
      case KnowledgeTextStepEnum.Create_Segmented_Set:
        return (
          <div className={cx('flex', 'content-end', styles.gap)}>
            <Button
              onClick={() =>
                setCurrent(KnowledgeTextStepEnum.Upload_Or_Text_Fill)
              }
            >
              上一步
            </Button>
            <Button onClick={handleConfirmCreateSet} type="primary">
              下一步
            </Button>
          </div>
        );
      case KnowledgeTextStepEnum.Data_Processing:
        return (
          <div className={cx('flex', 'content-end', styles.gap)}>
            <Button
              onClick={() =>
                setCurrent(KnowledgeTextStepEnum.Create_Segmented_Set)
              }
            >
              上一步
            </Button>
            <Button
              onClick={
                type === KnowledgeTextImportEnum.Local_Doc
                  ? handleOk
                  : handleCustomDocOk
              }
              type="primary"
            >
              确认
            </Button>
          </div>
        );
    }
  };

  // 取消事件
  const handleCancel = () => {
    handleClear();
    onCancel();
  };

  // 进度回调
  const handleUploadChange: UploadProps['onChange'] = (info) => {
    const { fileList } = info;
    setAllUploadFileList(handleUploadFileList(fileList, 90));
  };
  const getDisplayFileName = useCallback((name: string) => {
    if (!name) return '';
    return name.length > 24
      ? name.slice(0, 16) + '...' + name.slice(name.length - 8, name.length)
      : name;
  }, []);
  const getDisplayFileSize = useCallback((size: number) => {
    if (!size) return '';
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else if (size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(2)} MB`;
    } else {
      return `${(size / 1024 / 1024 / 1024).toFixed(2)} GB`;
    }
  }, []);
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
      onCancel={handleCancel}
      footer={footerComponent}
    >
      <div className={cx(styles['step-wrap'], 'radius-6')}>
        <Steps type="default" current={current} items={stepList} />
      </div>
      {current === KnowledgeTextStepEnum.Upload_Or_Text_Fill ? (
        type === KnowledgeTextImportEnum.Local_Doc ? (
          <>
            <UploadFile
              onChange={handleUploadChange}
              multiple={true}
              fileList={allUploadFileList}
              height={200}
            />
            <div className={cx(styles.fileList)}>
              {allUploadFileList?.map((info) => (
                <div key={info.uid} className={cx(styles['file-box'])}>
                  <div
                    className={cx('flex', 'items-center', 'content-between')}
                    style={{
                      height: '100%',
                    }}
                  >
                    <span
                      style={{
                        color:
                          info?.status === UploadFileStatus.error
                            ? '#e53241'
                            : 'rgba(0, 0, 0, 0.88)',
                      }}
                    >
                      {getDisplayFileName(info?.name)} (
                      {getDisplayFileSize(info?.size)})
                    </span>

                    <DeleteOutlined
                      onClick={() => handleUploadFileDel(info.uid)}
                    />
                  </div>
                  {info?.percent !== undefined &&
                    (getStatus(info) === 'success' ? (
                      <div className={styles['progress-upload-file-success']}>
                        <CheckCircleOutlined />
                      </div>
                    ) : (
                      <Progress
                        percent={Math.floor(info.percent || 0)}
                        type="circle"
                        status={getStatus(info)}
                        size={20}
                        className={styles['progress-upload-file']}
                      />
                    ))}
                  {info?.status === UploadFileStatus.error && (
                    <div className={styles['progress-upload-file-error']}>
                      <CloseCircleFilled />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <TextFill form={formText} />
        )
      ) : current === KnowledgeTextStepEnum.Create_Segmented_Set ? (
        <CreateSet
          form={form}
          autoSegmentConfigFlag={autoSegmentConfigFlag}
          onChoose={(flag) => setAutoSegmentConfigFlag(flag)}
        />
      ) : type === KnowledgeTextImportEnum.Local_Doc ? (
        <DataProcess uploadFileList={uploadFileList} />
      ) : (
        <div className={cx('flex', 'items-center', 'radius-6', styles.box)}>
          <img className={cx('radius-6')} src={docImage as string} alt="" />
          <h3 className={cx('text-ellipsis', 'flex-1')}>
            {fileConfigRef.current?.name}
          </h3>
        </div>
      )}
    </Modal>
  );
};

export default LocalCustomDocModal;
