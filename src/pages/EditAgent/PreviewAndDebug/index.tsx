import personal from '@/assets/images/personal.png';
import docImage from '@/assets/images/doc_image.jpg';
import RecommendList from './RecommendList';
import {
  apiAgentConversation,
  apiAgentConversationChatSuggest,
} from '@/services/agentConfig';
import type { AgentConfigInfo, AgentConversationInfo, CreatorInfo } from '@/types/interfaces/agent';
import { useRequest } from 'umi';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import ChatView from './ChatView';
import styles from './index.less';
import PreviewAndDebugHeader from './PreviewAndDebugHeader';
import { ClearOutlined, CloseCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Input, Tooltip, Upload, UploadProps } from 'antd';
import { UPLOAD_FILE_ACTION } from '@/constants/common.constants';
import { ACCESS_TOKEN } from '@/constants/home.constants';
import { UploadInfo } from '@/types/interfaces/common';
import ConditionRender from '@/components/ConditionRender';
import { createSSEConnection } from '@/utils/fetchEventSource';

const cx = classNames.bind(styles);

// 预览与调试组件
export interface PreviewAndDebugHeaderProps {
  agentConfigInfo: AgentConfigInfo;
  onPressDebug: () => void;
}

/**
 * 预览与调试组件
 */
const PreviewAndDebug: React.FC<PreviewAndDebugHeaderProps> = ({
  agentConfigInfo,
  onPressDebug,
}) => {
  const [conversationInfo, setConversationInfo] =
    useState<AgentConversationInfo>();
  const [chatSuggestList, setChatSuggestList] = useState<string[]>([]);
  const [files, setFiles] = useState<UploadInfo[]>([]);
  const [publishUser, setPublishUser] = useState<CreatorInfo>();
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
      const {devConversationId} = agentConfigInfo;
      run(devConversationId);
    }
  }, [agentConfigInfo]);

  const handlePressEnter = async (e) => {
    if (!agentConfigInfo?.devConversationId) {
      return;
    }
    const {value} = e.target;
    const attachments = files?.map(file => ({
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

    // 启动连接
    const abortConnection = await createSSEConnection({
      url: `${process.env.BASE_URL}/api/agent/conversation/chat`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/plain, */* ',
      },
      body: params,
      onMessage: (data) => {
        console.log(data, 6666);
        if (data.eventType === "FINAL_RESULT") {
          runChatSuggest(params);
        }
        // 更新UI状态...
      },
      onError: (error) => {
        console.error('流式请求异常:', error);
        // 显示错误提示...
      },
      onOpen: (response) => {
        console.log('连接已建立', response.status);
      },
      onClose: () => {
      },
    });
    // 主动关闭连接
    abortConnection();
  }

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

  const handleDelFile = (index: number) => {
    const _files = [...files];
    _files.splice(index, 1);
    setFiles(_files);
  }

  return (
    <div className={cx(styles.container, 'h-full', 'flex', 'flex-col')}>
      <PreviewAndDebugHeader onPressDebug={onPressDebug} />
      <div className={cx(styles['divider-horizontal'])}></div>
      <div className={cx(styles['main-content'], 'flex-1', 'flex', 'flex-col', 'overflow-y')}>
        <div className={cx(styles['chat-wrapper'], 'flex-1')}>
          <>
            {conversationInfo?.messageList?.length > 0 ? (
              conversationInfo?.messageList?.map((item, index) => (
                <ChatView
                  key={index}
                  messageInfo={item}
                  agentConfigInfo={agentConfigInfo}
                  avatar={publishUser?.avatar as string}
                  nickname={publishUser?.nickName as string}
                />
              ))
            ) : (
              <div className={cx('flex', 'flex-col', 'h-full', 'items-center', 'content-center')}>
                <img className={cx(styles.avatar)} src={agentConfigInfo?.icon || personal as string} alt="" />
                <h3 className={cx('w-full', 'text-ellipsis', styles.nickname)}>{agentConfigInfo?.name}</h3>
              </div>
            )}
          </>
          <RecommendList chatSuggestList={chatSuggestList} />
        </div>
        {/*会话输入框*/}
        <footer className={cx(styles.footer, 'flex', 'items-center')}>
          <Tooltip title="清除会话">
            <span
              className={cx(styles.clear, 'flex', 'items-center', 'content-center', 'hover-box', 'cursor-pointer')}>
              <ClearOutlined />
            </span>
          </Tooltip>
          <div className={cx(styles['chat-box'], 'flex-1')}>
            <ConditionRender condition={files?.length}>
              <div className={cx(styles['files-container'])}>
                {
                  files?.map((file, index) => (
                    <div key={file.key} className={cx(styles['file-box'], 'flex', 'items-center')}>
                      {
                        file.mimeType.includes('image/') ? <img src={file.url} alt="" /> :
                          <img src={docImage as string} alt="" />
                      }
                      <div className={cx('flex-1', 'overflow-hide')}>
                        <h4 className={cx('text-ellipsis')}>{file.fileName}</h4>
                        <span className={styles.size}>{`${file.size} Byte`}</span>
                      </div>
                      <CloseCircleOutlined className={cx(styles.del)} onClick={() => handleDelFile(index)} />
                    </div>
                  ))
                }
              </div>
            </ConditionRender>
            <div className={cx(styles['chat-input'], 'flex', 'items-center')}>
              <Input.TextArea
                rootClassName={styles.input}
                onPressEnter={handlePressEnter}
                placeholder="直接输入指令；可通过cmd+回车发送"
                autoSize={{ minRows: 1, maxRows: 3 }} />
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
