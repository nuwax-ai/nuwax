import ChatUploadFile from '@/components/ChatUploadFile';
import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import type { ChatInputProps, UploadFileInfo } from '@/types/interfaces/common';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { Input, Tooltip, Upload } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 手机端聊天输入组件
 */
const ChatInputHome: React.FC<ChatInputProps> = ({
  className,
  onEnter,
  visible,
  selectedComponentList,
  onSelectComponent,
  isClearInput = true,
  manualComponents,
  onScrollBottom,
}) => {
  // 文档
  const [files, setFiles] = useState<UploadFileInfo[]>([]);
  const [message, setMessage] = useState<string>('');
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';
  // const [selectedComponentList, setSelectedComponentList] = useState<
  //   AgentSelectedComponentInfo[]
  // >([]);

  // useEffect(() => {
  //   // 初始化选中的组件列表
  //   if (infos?.length) {
  //     setSelectedComponentList(infos || []);
  //   } else if (manualComponents?.length) {
  //     // 手动组件默认选中的组件
  //     const _manualComponents = manualComponents
  //       .filter((item) => item.defaultSelected === DefaultSelectedEnum.Yes)
  //       .map((item) => ({
  //         id: item.id,
  //         type: item.type,
  //       }));
  //     setSelectedComponentList(_manualComponents || []);
  //   }
  // }, [infos, manualComponents]);

  // 发送按钮disabled
  const disabledSend = useMemo(() => {
    return !message && !files?.length;
  }, [message, files]);

  // 点击发送事件
  const handleSendMessage = () => {
    if (disabledSend) {
      return;
    }
    if (message || files?.length > 0) {
      // enter事件
      onEnter(message, files, selectedComponentList);
      if (isClearInput) {
        // 置空
        setFiles([]);
        setMessage('');
      }
    }
  };

  // enter事件
  const handlePressEnter = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const { value } = e.target as HTMLTextAreaElement;
    // shift+enter或者ctrl+enter时换行
    if (
      e.nativeEvent.keyCode === 13 &&
      (e.nativeEvent.shiftKey || e.nativeEvent.ctrlKey)
    ) {
      const enterValue = `${value}\n`;
      setMessage(enterValue);
    } else if (
      e.nativeEvent.keyCode === 13 &&
      (!!value.trim() || !!files?.length)
    ) {
      // enter事件
      onEnter(value, files, selectedComponentList);
      if (isClearInput) {
        // 置空
        setFiles([]);
        setMessage('');
      }
    }
  };

  // 上传成功后，修改文档列表
  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const data: UploadFileInfo = info.file.response?.data;
      const _files = [...files];
      _files.push(data);
      setFiles(_files);
    }
  };

  // 删除文档
  const handleDelFile = (index: number) => {
    const _files = [...files];
    _files.splice(index, 1);
    setFiles(_files);
  };

  return (
    <div className={cx('w-full', className)}>
      <div className={cx(styles['chat-container'], 'flex', 'flex-col')}>
        {/*文件列表*/}
        <ConditionRender condition={files?.length}>
          <ChatUploadFile files={files} onDel={handleDelFile} />
        </ConditionRender>
        {/*输入框*/}
        <Input.TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rootClassName={cx(styles.input, 'flex-1')}
          onPressEnter={handlePressEnter}
          placeholder="直接输入指令；可通过回车发送"
          autoSize={{ minRows: 1, maxRows: 3 }}
        />
        <div className={cx('flex')}>
          {/*上传按钮*/}
          <Upload
            action={UPLOAD_FILE_ACTION}
            onChange={handleChange}
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
              )}
            >
              <PlusOutlined />
            </span>
          </Upload>
          <div
            className={cx(
              'flex-1',
              'flex',
              'items-center',
              styles['manual-container'],
            )}
          >
            {manualComponents?.map((item, index) => {
              return (
                <span
                  key={index}
                  className={cx(
                    styles['manual-box'],
                    'flex',
                    'items-center',
                    'cursor-pointer',
                    {
                      [styles.active]: selectedComponentList?.some(
                        (c) => c.id === item.id,
                      ),
                    },
                  )}
                  onClick={() => onSelectComponent?.(item)}
                >
                  {item.name}
                </span>
              );
            })}
          </div>
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
                { [styles.disabled]: disabledSend },
              )}
            >
              <ArrowUpOutlined />
            </span>
          </Tooltip>
        </div>
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
