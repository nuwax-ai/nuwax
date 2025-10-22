import SvgIcon from '@/components/base/SvgIcon';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { UploadFileStatus } from '@/types/enums/common';
import type { UploadFileInfo } from '@/types/interfaces/common';
import { DataResource } from '@/types/interfaces/dataResource';
import { handleUploadFileList } from '@/utils/upload';
import { LoadingOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Input, Menu, Popover, Tooltip, Upload } from 'antd';
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
  // 是否正在停止任务
  isStoppingTask: boolean;
  // 是否正在发送消息
  isSendingMessage: boolean;
  // 取消任务
  handleCancelAgentTask: () => void;
  className?: React.CSSProperties;
  onEnter: (files: UploadFileInfo[]) => void;
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
  isStoppingTask,
  isSendingMessage,
  handleCancelAgentTask,
  className,
  onEnter,
  dataSourceList,
  onToggleSelectDataSource,
}) => {
  // 文档
  const [uploadFiles, setUploadFiles] = useState<UploadFileInfo[]>([]);
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

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
    if (chat.chatInput?.trim()) {
      // enter事件
      onEnter(files);
      // 清空输入框
      chat.setChatInput('');
      // 清空文件列表
      setUploadFiles([]);
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
      // enter事件
      onEnter(files);
      // 清空输入框
      chat.setChatInput('');
      // 清空文件列表
      setUploadFiles([]);
    }
  };

  // 上传文件
  const handleChange: UploadProps['onChange'] = (info) => {
    const { fileList } = info;
    setUploadFiles(handleUploadFileList(fileList));
  };

  // 删除文件
  const handleDelFile = (uid: string) => {
    setUploadFiles((uploadFiles) =>
      uploadFiles.filter((item) => item.uid !== uid),
    );
  };

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
            onToggleSelectDataSource={onToggleSelectDataSource}
          />
        </ConditionRender>
        {/* 选择的文件 */}
        {fileContentState?.selectedFile && (
          <Tooltip title={fileContentState.selectedFile}>
            <div className={`text-ellipsis ${styles.selectedFileDisplay}`}>
              {getFileName(fileContentState.selectedFile)}
            </div>
          </Tooltip>
        )}
        {/*输入框*/}
        <Input.TextArea
          value={chat.chatInput}
          onChange={(e) => chat.setChatInput(e.target.value)}
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
              <span
                className={cx(
                  'flex',
                  'items-center',
                  'content-center',
                  'cursor-pointer',
                  styles.box,
                  styles['plus-box'],
                  { [styles['upload-box-disabled']]: chat.isChatLoading },
                )}
              >
                <SvgIcon
                  name="icons-chat-add"
                  style={{ fontSize: '14px' }}
                  className={cx(styles['svg-icon'])}
                />
              </span>
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
        </footer>
      </div>
    </div>
  );
};

export default ChatInputHome;
