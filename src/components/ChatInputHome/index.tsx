import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { UploadFileStatus } from '@/types/enums/common';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  ClearOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { InputRef, UploadProps } from 'antd';
import { Input, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  // 发送按钮disabled
  const disabledSend = useMemo(() => {
    return !messageInfo && !files?.length;
  }, [messageInfo, files]);

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

  // 上传成功后，修改文档列表
  const handleChange: UploadProps['onChange'] = (info) => {
    const { fileList } = info;
    setUploadFiles(
      fileList
        .filter((item) => item.status !== UploadFileStatus.removed)
        .map((item) => {
          const data = item.response?.data || {};
          return {
            key: data?.key || '',
            name: data?.fileName || item.name || '',
            size: data?.size || item.size || 0,
            url: item.url || data?.url || '',
            type: data?.mimeType || item.type || '',
            uid: item.uid,
            status: (item.status as UploadFileStatus) || UploadFileStatus.done,
            percent: item.percent,
            response: item.response,
          } as UploadFileInfo;
        }),
    );
  };

  // 删除文档
  const handleDelFile = (uid: string) => {
    const _files = [...uploadFiles];
    _files.splice(
      _files.findIndex((item) => item.uid === uid),
      1,
    );
    setUploadFiles(_files);
  };

  const handleClear = () => {
    if (clearDisabled || wholeDisabled) {
      return;
    }
    onClear?.();
  };

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
                  'hover-box',
                  'cursor-pointer',
                  { [styles.disabled]: clearDisabled || wholeDisabled },
                )}
                onClick={handleClear}
              >
                <ClearOutlined />
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
              <PlusOutlined />
            </span>
          </Upload>
          {/*手动选择组件*/}
          <ManualComponentItem
            manualComponents={manualComponents}
            selectedComponentList={selectedComponentList}
            onSelectComponent={onSelectComponent}
          />
          <Tooltip title={disabledSend ? '请输入你的问题' : ''}>
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
              <ArrowUpOutlined />
            </span>
          </Tooltip>
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
