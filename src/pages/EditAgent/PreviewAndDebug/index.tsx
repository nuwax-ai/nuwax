import docImage from '@/assets/images/doc_image.jpg';
import ConditionRender from '@/components/ConditionRender';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import {
  apiAgentConversation,
  apiAgentConversationChatSuggest,
} from '@/services/agentConfig';
import {
  AssistantRoleEnum,
  ConversationEventTypeEnum,
  MessageModeEnum,
  MessageTypeEnum,
} from '@/types/enums/agent';
import { OpenCloseEnum } from '@/types/enums/space';
import type {
  AgentConversationInfo,
  ConversationChatResponse,
  CreatorInfo,
} from '@/types/interfaces/agent';
import type { PreviewAndDebugHeaderProps } from '@/types/interfaces/agentConfig';
import { UploadInfo } from '@/types/interfaces/common';
import { createSSEConnection } from '@/utils/fetchEventSource';
import {
  ClearOutlined,
  CloseCircleOutlined,
  PlusCircleOutlined,
} from '@ant-design/icons';
import { Input, Tooltip, Upload, UploadProps } from 'antd';
import classNames from 'classnames';
import cloneDeep from 'lodash/cloneDeep';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useRequest } from 'umi';
import AgentChatEmpty from './AgentChatEmpty';
import ChatView from './ChatView';
import styles from './index.less';
import PreviewAndDebugHeader from './PreviewAndDebugHeader';
import RecommendList from './RecommendList';

const cx = classNames.bind(styles);

/**
 * 预览与调试组件
 */
const PreviewAndDebug: React.FC<PreviewAndDebugHeaderProps> = ({
  onExecuteResults,
  agentConfigInfo,
  onPressDebug,
}) => {
  // 会话信息
  const [conversationInfo, setConversationInfo] =
    useState<AgentConversationInfo>();
  // 会话问题建议
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  // 文档
  const [files, setFiles] = useState<UploadInfo[]>([]);
  // 发布者信息
  const [publishUser, setPublishUser] = useState<CreatorInfo>();
  const [message, setMessage] = useState<string>('');
  const messageViewRef = useRef<HTMLDivElement | null>(null);
  const token = localStorage.getItem(ACCESS_TOKEN) ?? '';

  // 查询会话
  const { run } = useRequest(apiAgentConversation, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setConversationInfo(result);
      setPublishUser(result?.agent?.publishUser);
    },
  });

  // 智能体会话问题建议
  const { run: runChatSuggest } = useRequest(apiAgentConversationChatSuggest, {
    manual: true,
    debounceWait: 300,
    onSuccess: (result) => {
      setChatSuggestList(result);
    },
  });

  useEffect(() => {
    if (agentConfigInfo) {
      const { devConversationId } = agentConfigInfo;
      run(devConversationId);
    }
  }, [agentConfigInfo?.devConversationId]);

  // 会话处理
  const handleConversation = async (value: string) => {
    if (!agentConfigInfo?.devConversationId) {
      return;
    }
    setChatSuggestList([]);
    const attachments =
      files?.map((file) => ({
        fileKey: file.key,
        fileUrl: file.url,
        fileName: file.fileName,
        mimeType: file.mimeType,
      })) || [];

    const params = {
      conversationId: agentConfigInfo?.devConversationId,
      message: value,
      attachments,
      debug: true,
    };

    // 将文件和消息加入会话中
    const chatMessage = {
      role: AssistantRoleEnum.USER,
      type: MessageModeEnum.CHAT,
      text: value,
      time: moment(),
      id: null,
      ext: attachments,
      finished: false,
      metadata: null,
      messageType: MessageTypeEnum.USER,
    };

    const _conversationInfo = cloneDeep(conversationInfo);
    _conversationInfo.messageList.push(chatMessage);
    setConversationInfo(_conversationInfo);
    // 置空
    setFiles([]);
    setMessage('');

    // 启动连接
    const abortConnection = await createSSEConnection({
      url: `${process.env.BASE_URL}/api/agent/conversation/chat`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (data: ConversationChatResponse) => {
        console.log(data, '====');
        // 更新UI状态...
        if (data.eventType === ConversationEventTypeEnum.FINAL_RESULT) {
          // 调试结果
          const { componentExecuteResults, outputText } = data.data;
          onExecuteResults(componentExecuteResults);
          const chatResponseMessage = {
            role: AssistantRoleEnum.ASSISTANT,
            type: MessageModeEnum.CHAT,
            text: outputText,
            time: moment(),
            id: null,
            ext: '',
            finished: true,
            metadata: null,
            messageType: MessageTypeEnum.ASSISTANT,
          };
          _conversationInfo?.messageList?.push(chatResponseMessage);
          setConversationInfo(_conversationInfo);
          // 是否开启问题建议,可用值:Open,Close
          if (agentConfigInfo.openSuggest === OpenCloseEnum.Open) {
            runChatSuggest(params);
          }
        }
      },
    });
    // 主动关闭连接
    abortConnection();
    // 滚动到底部
    messageViewRef.current?.scrollTo({
      top: messageViewRef.current?.scrollHeight,
      behavior: 'smooth',
    });
  };

  // enter事件
  const handlePressEnter = (e) => {
    e.preventDefault();
    const { value } = e.target;
    handleConversation(value);
  };

  // 上传成功后，修改文档列表
  const handleChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (info.file.status === 'done') {
      const data: UploadInfo = info.file.response?.data;
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
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <PreviewAndDebugHeader onPressDebug={onPressDebug} />
      <div className={cx(styles['divider-horizontal'])}></div>
      <div
        className={cx(
          styles['main-content'],
          'flex-1',
          'flex',
          'flex-col',
          'overflow-y',
        )}
      >
        <div
          className={cx(styles['chat-wrapper'], 'flex-1')}
          ref={messageViewRef}
        >
          {conversationInfo?.messageList?.length > 0 ? (
            <>
              {conversationInfo?.messageList?.map((item, index) => (
                <ChatView
                  key={index}
                  messageInfo={item}
                  agentConfigInfo={agentConfigInfo}
                  avatar={publishUser?.avatar as string}
                  nickname={publishUser?.nickName as string}
                />
              ))}
              {/*会话建议*/}
              <RecommendList
                chatSuggestList={chatSuggestList}
                onClick={handleConversation}
              />
            </>
          ) : (
            // Chat记录为空
            <AgentChatEmpty agentConfigInfo={agentConfigInfo} />
          )}
        </div>
        {/*会话输入框*/}
        <footer className={cx(styles.footer, 'flex', 'items-center')}>
          <Tooltip title="清除会话">
            <span
              className={cx(
                styles.clear,
                'flex',
                'items-center',
                'content-center',
                'hover-box',
                'cursor-pointer',
              )}
            >
              <ClearOutlined />
            </span>
          </Tooltip>
          <div className={cx(styles['chat-box'], 'flex-1')}>
            <ConditionRender condition={files?.length}>
              <div className={cx(styles['files-container'])}>
                {files?.map((file, index) => (
                  <div
                    key={file.key}
                    className={cx(styles['file-box'], 'flex', 'items-center')}
                  >
                    {/*如果文件是图片，则显示图片，否则显示文档默认图片*/}
                    <img
                      src={
                        file.mimeType.includes('image/')
                          ? file.url
                          : (docImage as string)
                      }
                      alt=""
                    />
                    <div className={cx('flex-1', 'overflow-hide')}>
                      <h4 className={cx('text-ellipsis')}>{file.fileName}</h4>
                      <span className={styles.size}>{`${file.size} Byte`}</span>
                    </div>
                    <CloseCircleOutlined
                      className={cx(styles.del)}
                      onClick={() => handleDelFile(index)}
                    />
                  </div>
                ))}
              </div>
            </ConditionRender>
            <div className={cx(styles['chat-input'], 'flex', 'items-center')}>
              <Input.TextArea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rootClassName={styles.input}
                onPressEnter={handlePressEnter}
                placeholder="直接输入指令；可通过回车发送"
                autoSize={{ minRows: 1, maxRows: 3 }}
              />
              <Upload
                action={UPLOAD_FILE_ACTION}
                className={cx(styles['add-file'])}
                onChange={handleChange}
                headers={{
                  Authorization: token ? `Bearer ${token}` : '',
                }}
                showUploadList={false}
                // beforeUpload={beforeUpload ?? beforeUploadDefault}
              >
                <PlusCircleOutlined className={cx('cursor-pointer')} />
              </Upload>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PreviewAndDebug;
