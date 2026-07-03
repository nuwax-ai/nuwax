/**
 * Agent 会话框语音交互示例页
 *
 * 使用真实 UnifiedChatSession + ChatInputHomeIndependent（与 Agent 开发页一致），
 * 消息发送为本地 Mock，语音录制/转写亦为模拟，无需麦克风与后端。
 *
 * 访问：/examples/voice-input-demo
 */
import { UnifiedChatSession } from '@/components/business-component';
import { DefaultSelectedEnum } from '@/types/enums/agent';
import type { MessageInfo } from '@/types/interfaces/conversationInfo';
import { Alert, Button, message, Space, Switch, Typography } from 'antd';
import React, { useCallback, useState } from 'react';
import { Link } from 'umi';
import styles from './index.less';
import {
  createAssistantReply,
  createUserMessage,
  DEMO_AGENT_INFO,
  DEMO_CONVERSATION_ID,
  DEMO_SUGGEST_LIST,
} from './mockData';

const { Title, Paragraph, Text } = Typography;

const VoiceInputDemoPage: React.FC = () => {
  const [messageList, setMessageList] = useState<MessageInfo[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<number>();
  // 真实麦克风模式：录音与波形走真实 PCM 音量（需授权麦克风；转写走真实 STT 接口）
  const [useRealMic, setUseRealMic] = useState(false);

  const handleSendMessage = useCallback((text: string) => {
    const trimmed = text?.trim();
    if (!trimmed) {
      return;
    }

    const userMsg = createUserMessage(trimmed);
    const assistantMsg = createAssistantReply(trimmed);

    setMessageList((prev) => [...prev, userMsg, assistantMsg]);
    message.success('已发送（演示 Mock）');
  }, []);

  const handleClear = useCallback(async () => {
    setMessageList([]);
    message.info('已清空演示会话');
  }, []);

  return (
    <div className={styles['voice-input-demo']}>
      <header className={styles['voice-input-demo-header']}>
        <Paragraph type="secondary" style={{ marginBottom: 8 }}>
          <Link to="/examples">← 返回示例中心</Link>
        </Paragraph>
        <Space
          align="start"
          style={{ width: '100%', justifyContent: 'space-between' }}
        >
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>
              Agent 会话框 · 语音交互演示
            </Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              路由：<Text code>/examples/voice-input-demo</Text>
            </Paragraph>
          </div>
          <Space>
            <Space size={4}>
              <Text type="secondary">真实麦克风</Text>
              <Switch
                checked={useRealMic}
                onChange={setUseRealMic}
                checkedChildren="开"
                unCheckedChildren="关"
              />
            </Space>
            <Button
              onClick={() => void handleClear()}
              disabled={!messageList.length}
            >
              清空消息
            </Button>
          </Space>
        </Space>
        <Alert
          type="info"
          showIcon
          style={{ marginTop: 12 }}
          message="交互说明"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>麦克风在发送按钮左侧，点击开始录音</li>
              <li>
                录音时底栏仅保留左侧「+」「清空」，中间为波形动效，右侧为停止/发送
              </li>
              <li>
                {useRealMic
                  ? '当前为真实麦克风模式：波形随你的声音起伏，转写走真实 STT 接口（消息发送仍为本地模拟）'
                  : '当前为模拟模式：波形为伪随机动效、不访问麦克风；打开右上角「真实麦克风」可体验真实音量驱动'}
              </li>
            </ul>
          }
        />
      </header>

      <main className={styles['voice-input-demo-session']}>
        <div className={styles['voice-input-demo-session-inner']}>
          <UnifiedChatSession
            conversationId={DEMO_CONVERSATION_ID}
            messageList={messageList}
            isLoading={false}
            isConversationActive={false}
            messageBottomMode="chat"
            agentInfo={DEMO_AGENT_INFO}
            allowOtherModel={DefaultSelectedEnum.No}
            initialAgentMode="yolo"
            selectedModelId={selectedModelId}
            onModelSelect={setSelectedModelId}
            chatSuggestList={DEMO_SUGGEST_LIST}
            onSendMessage={handleSendMessage}
            onClear={handleClear}
            enableMention={false}
            placeholder="输入消息，或使用发送按钮左侧的麦克风…"
            showAnnouncement
            voiceInputMock={!useRealMic}
          />
        </div>
      </main>
    </div>
  );
};

export default VoiceInputDemoPage;
