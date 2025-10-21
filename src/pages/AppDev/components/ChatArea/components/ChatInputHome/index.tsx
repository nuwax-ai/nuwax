import SvgIcon from '@/components/base/SvgIcon';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { UploadFileStatus } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { handleUploadFileList } from '@/utils/upload';
import { LoadingOutlined, PictureOutlined } from '@ant-design/icons';
import type { InputRef, UploadProps } from 'antd';
import { Button, Input, Menu, Popover, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import DataSourceList from './DataSourceList';
import styles from './index.less';

const cx = classNames.bind(styles);

// 聊天输入框组件
export interface ChatInputProps {
  chat: any;
  modelSelector: any;
  fileContentState: any;
  isStoppingTask: boolean;
  isSendingMessage: boolean;
  handleCancelAgentTask: () => void;
  className?: React.CSSProperties;
  onEnter: (message: string, files: UploadFileInfo[]) => void;
  // 数据源列表
  dataSourceList?: any[];
  selectedDataSourceList?: any[];
  onSelectDataSource?: (dataSource: any) => void;
}

/**
 * 手机端聊天输入组件
 */
const ChatInputHome: React.FC<ChatInputProps> = ({
  chat,
  modelSelector,
  fileContentState,
  isStoppingTask,
  isSendingMessage,
  handleCancelAgentTask,
  className,
  onEnter,
  dataSourceList,
  selectedDataSourceList,
  onSelectDataSource,
}) => {
  // 文档
  const [uploadFiles, setUploadFiles] = useState<UploadFileInfo[]>([]);
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const [messageInfo, setMessageInfo] = useState<string>('');
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  const textareaRef = useRef<InputRef>(null);

  useEffect(() => {
    setFiles(
      uploadFiles.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      ),
    );
  }, [uploadFiles]);

  /**
   * 提取文件名（不包含路径）
   */
  const getFileName = useCallback((filePath: string) => {
    return filePath.split('/').pop() || filePath;
  }, []);

  // 点击发送事件
  const handleSendMessage = () => {
    // if (disabledSend || wholeDisabled) {
    //   return;
    // }
    if (messageInfo || files?.length > 0) {
      // enter事件
      onEnter(messageInfo, files);
      // if (isClearInput) {
      //   // 置空
      //   setUploadFiles([]);
      //   setMessageInfo('');
      // }
    }
  };

  // enter事件
  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    //如果是输出过程中 或者 中止会话过程中 不能触发enter事件
    // if (isConversationActive || isStoppingConversation) {
    //   return;
    // }
    e.preventDefault();
    const { value, selectionStart, selectionEnd } =
      e.target as HTMLTextAreaElement;
    // shift+enter或者ctrl+enter时换行
    if (
      e.nativeEvent.keyCode === 13 &&
      (e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)
    ) {
      // 在光标位置插入换行符
      const newValue =
        value.slice(0, selectionStart) + '\n' + value.slice(selectionEnd);
      setMessageInfo(newValue);
    } else if (
      e.nativeEvent.keyCode === 13 &&
      (!!value.trim() || !!files?.length)
    ) {
      // enter事件
      onEnter(value, files);
      // if (isClearInput) {
      //   // 置空
      //   setUploadFiles([]);
      //   setMessageInfo('');
      // }
    }
  };

  const handleChange: UploadProps['onChange'] = (info) => {
    const { fileList } = info;
    setUploadFiles(handleUploadFileList(fileList));
  };

  const handleDelFile = (uid: string) => {
    setUploadFiles((uploadFiles) =>
      uploadFiles.filter((item) => item.uid !== uid),
    );
  };

  // // 停止会话功能 - 直接集成到组件内部
  // const handleStopConversation = useCallback(() => {
  //   // if (disabledStop || wholeDisabled) {
  //   //   return;
  //   // }
  //   // 设置停止操作状态
  //   setIsStoppingConversation(true);

  //   // 获取当前会话请求ID
  //   const requestId = getCurrentConversationRequestId();

  //   if (requestId) {
  //     if (onTempChatStop) {
  //       onTempChatStop(requestId);
  //     } else {
  //       // 调用停止会话方法
  //       runStopConversation(requestId);
  //     }
  //   }
  // }, [
  //   // disabledStop,
  //   // wholeDisabled,
  //   getCurrentConversationRequestId,
  //   runStopConversation,
  //   onTempChatStop,
  // ]);

  // // 获取按钮提示文本
  // const getButtonTooltip = () => {
  //   if (wholeDisabled) {
  //     return '会话已禁用';
  //   }
  //   if (disabledSend) {
  //     return '请输入你的问题';
  //   }
  //   if (isConversationActive) {
  //     return '点击停止当前会话';
  //   }
  //   return '点击发送消息';
  // };

  // // 获取停止按钮提示文本
  // const getStopButtonTooltip = () => {
  //   // if (wholeDisabled) {
  //   //   return '会话已禁用';
  //   // }
  //   if (!isConversationActive) {
  //     return '当前无进行中的会话';
  //   }
  //   if (
  //     isStoppingConversation ||
  //     loadingStopConversation ||
  //     loadingStopTempConversation
  //   ) {
  //     return '正在停止会话...';
  //   }
  //   return '点击停止当前会话';
  // };

  return (
    <div className={cx('w-full', 'relative', className)}>
      <div className={cx(styles['chat-container'], 'flex', 'flex-col')}>
        {/*文件列表*/}
        <ConditionRender condition={uploadFiles?.length}>
          <ChatUploadFile files={uploadFiles} onDel={handleDelFile} />
        </ConditionRender>
        {/*选择的数据源*/}
        <ConditionRender condition={dataSourceList?.length}>
          <DataSourceList
            dataSourceList={dataSourceList}
            selectedDataSourceList={selectedDataSourceList}
            onSelectDataSource={onSelectDataSource}
          />
        </ConditionRender>
        <div className={styles.leftActions}>
          {/* 选中文件显示 */}
          {fileContentState?.selectedFile && (
            <Tooltip title={fileContentState.selectedFile}>
              <div
                className={`text-ellipsis ${styles.selectedFileDisplay}`}
                style={{ maxWidth: '150px' }}
              >
                {getFileName(fileContentState.selectedFile)}
              </div>
            </Tooltip>
          )}
        </div>
        {/*输入框*/}
        <Input.TextArea
          ref={textareaRef}
          value={messageInfo}
          onChange={(e) => setMessageInfo(e.target.value)}
          rootClassName={cx(styles.input)}
          onPressEnter={handlePressEnter}
          placeholder="向AI助手提问..."
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        <footer className={cx('flex-1', styles.footer)}>
          {/*上传按钮*/}
          <Upload
            action={UPLOAD_FILE_ACTION}
            onChange={handleChange}
            multiple={true}
            fileList={uploadFiles}
            headers={{
              Authorization: token ? `Bearer ${token}` : '',
            }}
            data={{
              type: 'tmp',
            }}
            disabled={chat.isChatLoading}
            showUploadList={false}
            maxCount={10}
          >
            <Tooltip title="上传附件">
              <Button
                type="text"
                icon={<PictureOutlined />}
                disabled={chat.isChatLoading}
              />
            </Tooltip>
          </Upload>
          {/* 大模型选择 */}
          <Popover
            content={
              <div>
                <Menu
                  selectedKeys={
                    modelSelector?.selectedModelId
                      ? [modelSelector.selectedModelId.toString()]
                      : []
                  }
                  onClick={({ key }) => modelSelector?.selectModel(Number(key))}
                  style={{ maxHeight: 200, overflowY: 'auto' }}
                >
                  {modelSelector?.models?.map((model: any) => (
                    <Menu.Item
                      key={model.id.toString()}
                      disabled={chat.isChatLoading}
                    >
                      {model.name}
                    </Menu.Item>
                  ))}
                </Menu>
              </div>
            }
            trigger="hover"
            // open={open}
            // onOpenChange={handleOpenChange}
          >
            <span>
              {
                modelSelector?.models?.find(
                  (m: any) => m.id === modelSelector?.selectedModelId,
                )?.name
              }
            </span>
          </Popover>
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

          {/* 根据会话状态显示发送或停止按钮 */}
          {/* {isConversationActive ? (
            // 会话进行中，显示停止按钮
            <Tooltip title={getStopButtonTooltip()}>
              <span
                onClick={handleStopConversation}
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  'cursor-pointer',
                  styles.box,
                  styles['send-box'],
                  styles['stop-box'],
                  // 当会话进行中且按钮可点击时，使用高亮样式
                  {
                    [styles['stop-box-active']]:
                      !isStoppingConversation,
                  },
                )}
              >
                {isStoppingConversation ? (
                  <div className={cx(styles['loading-box'])}>
                    <LoadingOutlined className={cx(styles['loading-icon'])} />
                  </div>
                ) : (
                  <SvgIcon name="icons-chat-stop" />
                )}
              </span>
            </Tooltip>
          ) : (
            // 会话未进行中，显示发送按钮
            <Tooltip title={getButtonTooltip()}>
              <span
                onClick={handleSendMessage}
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  'cursor-pointer',
                  styles.box,
                  styles['send-box'],
                  { [styles.disabled]: disabledSend || wholeDisabled },
                )}
              >
                <SvgIcon name="icons-chat-send" style={{ fontSize: '14px' }} />
              </span>
            </Tooltip>
          )} */}
        </footer>
      </div>
    </div>
  );
};

export default ChatInputHome;
