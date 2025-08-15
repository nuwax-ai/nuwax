import SvgIcon from '@/components/base/SvgIcon';
import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { UploadFileStatus } from '@/types/enums/common';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import { handleUploadFileList } from '@/utils/upload';
import { ArrowDownOutlined, LoadingOutlined } from '@ant-design/icons';
import type { InputRef, UploadProps } from 'antd';
import { Input, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useModel } from 'umi';
import styles from './index.less';
import ManualComponentItem from './ManualComponentItem';

const cx = classNames.bind(styles);

/**
 * 手机端聊天输入组件
 */
const ChatInputHome: React.FC<ChatInputProps> = ({
  className,
  wholeDisabled = false,
  clearDisabled = false,
  onEnter,
  visible,
  selectedComponentList,
  onSelectComponent,
  onClear,
  isClearInput = true,
  manualComponents,
  onScrollBottom,
}) => {
  // 获取停止会话相关的方法和状态
  const {
    runStopConversation,
    loadingStopConversation,
    getCurrentConversationRequestId,
    isConversationActive,
    disabledConversationActive,
  } = useModel('conversationInfo');

  // 文档
  const [uploadFiles, setUploadFiles] = useState<UploadFileInfo[]>([]);
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const [messageInfo, setMessageInfo] = useState<string>('');
  // 停止操作是否正在进行中
  const [isStoppingConversation, setIsStoppingConversation] =
    useState<boolean>(false);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  const textareaRef = useRef<InputRef>(null);

  useEffect(() => {
    setFiles(
      uploadFiles.filter(
        (item) => item.status === UploadFileStatus.done && item.url && item.key,
      ),
    );
  }, [uploadFiles]);

  // 监听会话状态变化，当会话结束时重置停止状态
  useEffect(() => {
    if (!isConversationActive) {
      setIsStoppingConversation(false);
    }
  }, [isConversationActive]);

  // 发送按钮disabled
  const disabledSend = useMemo(() => {
    return !messageInfo && !files?.length;
  }, [messageInfo, files]);

  // 停止按钮disabled - 只有在会话进行中时才可停止，与输入框内容无关
  const disabledStop = useMemo(() => {
    return (
      !isConversationActive || isStoppingConversation || loadingStopConversation
    );
  }, [isConversationActive, isStoppingConversation, loadingStopConversation]);

  // 点击发送事件
  const handleSendMessage = () => {
    if (disabledSend || wholeDisabled) {
      return;
    }
    if (messageInfo || files?.length > 0) {
      // enter事件
      onEnter(messageInfo, files);
      if (isClearInput) {
        // 置空
        setUploadFiles([]);
        setMessageInfo('');
      }
    }
  };

  // enter事件
  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    //如果是输出过程中 或者 中止会话过程中 不能触发enter事件
    if (isConversationActive || isStoppingConversation) {
      return;
    }
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
      if (isClearInput) {
        // 置空
        setUploadFiles([]);
        setMessageInfo('');
      }
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

  const handleClear = () => {
    if (clearDisabled || wholeDisabled) {
      return;
    }
    disabledConversationActive();
    onClear?.();
  };

  // 停止会话功能 - 直接集成到组件内部
  const handleStopConversation = useCallback(() => {
    if (disabledStop || wholeDisabled) {
      return;
    }
    // 设置停止操作状态
    setIsStoppingConversation(true);

    // 获取当前会话请求ID
    const requestId = getCurrentConversationRequestId();
    console.log('requestId', requestId);

    if (requestId) {
      // 调用停止会话方法
      runStopConversation(requestId);
    }
  }, [
    disabledStop,
    wholeDisabled,
    getCurrentConversationRequestId,
    runStopConversation,
  ]);

  // 获取按钮提示文本
  const getButtonTooltip = () => {
    if (wholeDisabled) {
      return '会话已禁用';
    }
    if (disabledSend) {
      return '请输入你的问题';
    }
    if (isConversationActive) {
      return '点击停止当前会话';
    }
    return '点击发送消息';
  };

  // 获取停止按钮提示文本
  const getStopButtonTooltip = () => {
    if (wholeDisabled) {
      return '会话已禁用';
    }
    if (!isConversationActive) {
      return '当前无进行中的会话';
    }
    if (isStoppingConversation || loadingStopConversation) {
      return '正在停止会话...';
    }
    return '点击停止当前会话';
  };

  useEffect(() => {
    return () => {
      disabledConversationActive();
      setUploadFiles([]);
    };
  }, []);

  return (
    <div className={cx('w-full', 'relative', className)}>
      <div className={cx(styles['chat-container'], 'flex', 'flex-col')}>
        {/*文件列表*/}
        <ConditionRender condition={uploadFiles?.length}>
          <ChatUploadFile files={uploadFiles} onDel={handleDelFile} />
        </ConditionRender>
        {/*输入框*/}
        <Input.TextArea
          ref={textareaRef}
          disabled={wholeDisabled}
          value={messageInfo}
          onChange={(e) => setMessageInfo(e.target.value)}
          rootClassName={cx(styles.input)}
          onPressEnter={handlePressEnter}
          placeholder="直接输入指令；可通过回车发送"
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
        <footer className={cx('flex', styles.footer)}>
          <ConditionRender condition={!!onClear}>
            <Tooltip title="清空会话记录">
              <span
                className={cx(
                  styles.clear,
                  'flex',
                  'items-center',
                  'content-center',
                  'cursor-pointer',
                  { [styles.disabled]: clearDisabled || wholeDisabled },
                )}
                onClick={handleClear}
              >
                <SvgIcon name="icons-chat-clear" />
              </span>
            </Tooltip>
          </ConditionRender>
          {/*上传按钮*/}
          <Upload
            action={UPLOAD_FILE_ACTION}
            disabled={wholeDisabled}
            onChange={handleChange}
            multiple={true}
            fileList={uploadFiles}
            headers={{
              Authorization: token ? `Bearer ${token}` : '',
            }}
            data={{
              type: 'tmp',
            }}
            showUploadList={false}
          >
            <span
              className={cx(
                'flex',
                'items-center',
                'content-center',
                'cursor-pointer',
                styles.box,
                styles['plus-box'],
                { [styles['upload-box-disabled']]: wholeDisabled },
              )}
            >
              <SvgIcon name="icons-chat-add" />
            </span>
          </Upload>
          {/*手动选择组件*/}
          <ManualComponentItem
            manualComponents={manualComponents}
            selectedComponentList={selectedComponentList}
            onSelectComponent={onSelectComponent}
          />
          {/* 根据会话状态显示发送或停止按钮 */}
          {isConversationActive ? (
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
                      !disabledStop &&
                      !wholeDisabled &&
                      !isStoppingConversation,
                  },
                  { [styles.disabled]: disabledStop || wholeDisabled },
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
                <SvgIcon name="icons-chat-send" />
              </span>
            </Tooltip>
          )}
        </footer>
      </div>
      {/* 滚动到底部按钮 */}
      <div className={cx(styles['chat-action'])}>
        <div
          className={cx(styles['to-bottom'], { [styles.visible]: visible })}
          onClick={onScrollBottom}
        >
          <ArrowDownOutlined />
        </div>
      </div>
    </div>
  );
};

export default ChatInputHome;
