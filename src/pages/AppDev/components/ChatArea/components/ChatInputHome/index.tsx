import SvgIcon from '@/components/base/SvgIcon';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import SelectList from '@/components/custom/SelectList';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { UploadFileStatus } from '@/types/enums/common';
import { ModelConfig } from '@/types/interfaces/appDev';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { DataResource } from '@/types/interfaces/dataResource';
import eventBus, { EVENT_NAMES } from '@/utils/eventBus';
import { handleUploadFileList } from '@/utils/upload';
import {
  CloseOutlined,
  DownOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Button, Input, Popover, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import DataSourceList from './DataSourceList';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天输入框组件
export interface ChatInputProps {
  // 聊天信息
  chat: any;
  // 大模型选择器
  modelSelector: any;
  // 文件内容状态
  fileContentState: any;
  // 设置选中的文件
  onSetSelectedFile: (fileId: string) => void;
  // 是否正在停止任务
  isStoppingTask: boolean;
  // 是否正在发送消息
  isSendingMessage: boolean;
  // 取消任务
  handleCancelAgentTask: () => void;
  className?: React.CSSProperties;
  onEnter: (
    files?: UploadFileInfo[],
    prototypeImages?: UploadFileInfo[],
  ) => void;
  // 数据源列表
  dataSourceList?: DataResource[];
  onToggleSelectDataSource?: (dataSource: DataResource) => void;
}

/**
 * 手机端聊天输入组件
 */
const ChatInputHome: React.FC<ChatInputProps> = ({
  chat,
  modelSelector,
  fileContentState,
  onSetSelectedFile,
  isStoppingTask,
  isSendingMessage,
  handleCancelAgentTask,
  className,
  onEnter,
  dataSourceList,
  onToggleSelectDataSource,
}) => {
  // 附件文件列表
  const [attachmentFiles, setAttachmentFiles] = useState<UploadFileInfo[]>([]);
  // 原型图片附件列表
  const [attachmentPrototypeImages, setAttachmentPrototypeImages] = useState<
    UploadFileInfo[]
  >([]);
  const [open, setOpen] = useState(false);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  /**
   * 提取文件名（不包含路径）
   */
  const getFileName = useCallback((filePath: string) => {
    return filePath.split('/').pop() || filePath;
  }, []);

  // 点击发送事件
  const handleSendMessage = () => {
    if (chat.chatInput?.trim()) {
      const files = attachmentFiles?.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      );
      const prototypeImages = attachmentPrototypeImages?.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      );
      // enter事件
      onEnter(files, prototypeImages);
      // 清空输入框
      chat.setChatInput('');
      // 清空附件文件列表
      setAttachmentFiles([]);
      // 清空原型图片附件列表
      setAttachmentPrototypeImages([]);
    }
  };

  // enter事件
  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const { value, selectionStart, selectionEnd } =
      e.target as HTMLTextAreaElement;

    // 验证：prompt（输入内容）是必填的
    if (!value?.trim()) {
      return;
    }

    //如果是输出过程中 或者 中止会话过程中 不能触发enter事件
    if (chat.isChatLoading || isSendingMessage) {
      return;
    }
    // shift+enter或者ctrl+enter时换行
    if (
      e.nativeEvent.keyCode === 13 &&
      (e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)
    ) {
      // 在光标位置插入换行符
      const newValue =
        value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd);
      chat.setChatInput(newValue);
    } else if (e.nativeEvent.keyCode === 13 && !!value.trim()) {
      const files = attachmentFiles?.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      );
      const prototypeImages = attachmentPrototypeImages?.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      );
      // enter事件
      onEnter(files, prototypeImages);
      // 清空输入框
      chat.setChatInput('');
      // 清空附件文件列表
      setAttachmentFiles([]);
      // 清空原型图片附件列表
      setAttachmentPrototypeImages([]);
    }
  };

  // 上传文件
  const handleChange: UploadProps['onChange'] = (info) => {
    const { fileList } = info;
    setAttachmentFiles(handleUploadFileList(fileList));
  };

  // 上传原型图片
  const handleChangePrototypeImages: UploadProps['onChange'] = (info) => {
    const { fileList } = info;
    setAttachmentPrototypeImages(handleUploadFileList(fileList));
  };

  const handleDelFile = (uid: string) => {
    setAttachmentFiles((attachmentFiles) =>
      attachmentFiles.filter((item) => item.uid !== uid),
    );
  };

  // 删除文件
  const handleDelFilePrototypeImages = (uid: string) => {
    setAttachmentPrototypeImages((attachmentFiles) =>
      attachmentFiles.filter((item) => item.uid !== uid),
    );
  };

  // 订阅发送消息事件
  useEffect(() => {
    const handleSendMessageEvent = () => {
      // 检查是否有输入内容
      if (chat.chatInput?.trim()) {
        handleSendMessage();
      }
    };

    // 订阅发送消息事件
    eventBus.on(EVENT_NAMES.SEND_CHAT_MESSAGE, handleSendMessageEvent);

    // 组件卸载时取消订阅
    return () => {
      eventBus.off(EVENT_NAMES.SEND_CHAT_MESSAGE, handleSendMessageEvent);
    };
  }, [chat.chatInput, handleSendMessage]);

  // 获取模型选项
  const getModeOptions = (models: ModelConfig[]) => {
    return (
      models?.map((model: ModelConfig) => ({
        label: model.name,
        value: model.id,
      })) || []
    );
  };

  // 模型弹窗内容
  const PopoverContent = () => {
    return (
      <div className={cx('flex', styles['model-selector-popover'])}>
        <div
          className={cx('flex-1', 'flex', 'flex-col', 'gap-6', 'overflow-hide')}
        >
          <h4>编码模型</h4>
          <SelectList
            className={cx(styles['select-list'])}
            options={getModeOptions(modelSelector?.models?.chatModelList)}
            value={modelSelector?.selectedModelId}
            onChange={modelSelector?.selectModel}
          />
        </div>
        <div
          className={cx('flex-1', 'flex', 'flex-col', 'gap-6', 'overflow-hide')}
        >
          <h4>视觉模型（可选）</h4>
          <SelectList
            className={cx(styles['select-list'])}
            allowClear
            options={getModeOptions(modelSelector?.models?.multiModelList)}
            value={modelSelector?.selectedMultiModelId}
            onChange={modelSelector?.selectMultiModel}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={cx('w-full', 'relative', className)}>
      <div className={cx(styles['chat-container'], 'flex', 'flex-col')}>
        {/*附件文件列表*/}
        <ConditionRender condition={attachmentFiles?.length}>
          <h5 className={cx(styles['file-title'])}>附件文件</h5>
          <ChatUploadFile files={attachmentFiles} onDel={handleDelFile} />
        </ConditionRender>
        {/*附件文件列表*/}
        <ConditionRender condition={attachmentPrototypeImages?.length}>
          <h5 className={cx(styles['file-title'])}>原型图片</h5>
          <ChatUploadFile
            files={attachmentPrototypeImages}
            onDel={handleDelFilePrototypeImages}
          />
        </ConditionRender>
        {/*选择的数据源*/}
        <ConditionRender condition={dataSourceList?.length}>
          <DataSourceList
            dataSourceList={dataSourceList}
            onToggleSelectDataSource={onToggleSelectDataSource}
          />
        </ConditionRender>
        {/* 选择的文件 */}
        {fileContentState?.selectedFile && (
          <Tooltip title={fileContentState.selectedFile}>
            <div className={`flex ${styles.selectedFileDisplay}`}>
              <div className={cx('text-ellipsis', styles['file-name'])}>
                {getFileName(fileContentState.selectedFile)}
              </div>
              <CloseOutlined
                className={cx('cursor-pointer', styles['close-icon'])}
                onClick={() => {
                  onSetSelectedFile('');
                }}
              />
            </div>
          </Tooltip>
        )}
        {/*输入框*/}
        <Input.TextArea
          value={chat.chatInput}
          onChange={(e) => chat.setChatInput(e.target.value)}
          rootClassName={cx(styles.input)}
          onPressEnter={handlePressEnter}
          placeholder="一句话做网站、应用、提效工具等，可选择工作流、插件等数据资源拓展多种能力"
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        <footer className={cx('flex-1', styles.footer)}>
          <div className={cx('flex', 'items-center', 'gap-4')}>
            {/*上传附件文件*/}
            <Upload
              action={UPLOAD_FILE_ACTION}
              onChange={handleChange}
              multiple={true}
              fileList={attachmentFiles}
              headers={{
                Authorization: token ? `Bearer ${token}` : '',
              }}
              data={{
                type: 'tmp',
              }}
              disabled={chat.isChatLoading}
              showUploadList={false}
              maxCount={9}
            >
              <Tooltip title="上传附件">
                <Button
                  type="text"
                  className={cx(styles['svg-icon'], {
                    [styles['upload-box-disabled']]: chat.isChatLoading,
                  })}
                  icon={
                    <SvgIcon
                      name="icons-common-attachments"
                      style={{ fontSize: '14px' }}
                    />
                  }
                />
              </Tooltip>
            </Upload>
            {/*上传原型图片附件*/}
            <Upload
              action={UPLOAD_FILE_ACTION}
              accept="image/*"
              onChange={handleChangePrototypeImages}
              multiple={true}
              fileList={attachmentPrototypeImages}
              headers={{
                Authorization: token ? `Bearer ${token}` : '',
              }}
              data={{
                type: 'tmp',
              }}
              disabled={chat.isChatLoading}
              showUploadList={false}
              maxCount={9}
            >
              <Tooltip title="上传原型图片">
                <Button
                  type="text"
                  className={cx(styles['svg-icon'], {
                    [styles['upload-box-disabled']]: chat.isChatLoading,
                  })}
                  icon={
                    <SvgIcon
                      name="icons-common-sketch"
                      style={{ fontSize: '14px' }}
                    />
                  }
                />
              </Tooltip>
            </Upload>
          </div>
          <div className={cx('flex', 'items-center', 'content-end', 'gap-10')}>
            {/* 大模型选择 */}
            <Tooltip title="模型">
              <Popover
                content={<PopoverContent />}
                trigger="click"
                open={open}
                onOpenChange={setOpen}
              >
                <div
                  className={cx(
                    'flex',
                    'items-center',
                    'gap-4',
                    'cursor-pointer',
                    styles['model-selector'],
                  )}
                >
                  <span>{modelSelector?.selectedModel?.name}</span>
                  <DownOutlined className={cx(styles['model-arrow'])} />
                </div>
              </Popover>
            </Tooltip>
            {/* 会话进行中仅显示取消按钮 */}
            {chat.isChatLoading ? (
              <Tooltip title={isStoppingTask ? '正在停止...' : '取消AI任务'}>
                <span
                  onClick={handleCancelAgentTask}
                  className={`${styles.box} ${styles['send-box']} ${
                    styles['stop-box']
                  } ${!isStoppingTask ? styles['stop-box-active'] : ''} ${
                    isStoppingTask ? styles.disabled : ''
                  }`}
                >
                  {isStoppingTask ? (
                    <div className={styles['loading-box']}>
                      <LoadingOutlined className={styles['loading-icon']} />
                    </div>
                  ) : (
                    <SvgIcon name="icons-chat-stop" />
                  )}
                </span>
              </Tooltip>
            ) : (
              <Tooltip title={isSendingMessage ? '正在发送...' : '发送消息'}>
                <span
                  onClick={handleSendMessage}
                  className={`${styles.box} ${styles['send-box']} ${
                    !chat.chatInput.trim() || isSendingMessage
                      ? styles.disabled
                      : ''
                  }`}
                >
                  {isSendingMessage ? (
                    <div className={styles['loading-box']}>
                      <LoadingOutlined className={styles['loading-icon']} />
                    </div>
                  ) : (
                    <SvgIcon name="icons-chat-send" />
                  )}
                </span>
              </Tooltip>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatInputHome;
