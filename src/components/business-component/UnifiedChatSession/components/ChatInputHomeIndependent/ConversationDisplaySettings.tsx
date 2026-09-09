/**
 * 「会话显示」配置面板（V2 双线重构）：统一配置渲染版本（V1/V2）、
 * V2 展示预设与逐类高级覆盖；会话覆盖可清除并恢复继承全局设置。
 * 变更经全局事件广播，消息列表即时切换渲染器。
 * 本组件只输出面板内容，触发入口由 ConversationDebugFab 提供。
 */
import type {
  NodePresentationMode,
  RowNodeKind,
} from '@/features/conversation/presentation-v2';
import { PROCESS_NODE_KINDS } from '@/features/conversation/presentation-v2';
import { useConversationRendererPreference } from '@/hooks/useConversationRendererPreference';
import { dict } from '@/services/i18nRuntime';
import type { ConversationRendererVersion } from '@/utils/conversationRendererPreference';
import { Segmented, Select, theme } from 'antd';
import React from 'react';

// 行标签仅覆盖节点行类型（narration 穿插直出，无行级档位）
const NODE_KIND_LABEL_KEYS: Record<RowNodeKind, string> = {
  reasoning: 'PC.Components.ConversationRendererV2.nodeTitleReasoning',
  context: 'PC.Components.ConversationRendererV2.nodeTitleContext',
  tool: 'PC.Components.ConversationRendererV2.nodeTitleTool',
  subagent: 'PC.Components.ConversationRendererV2.nodeTitleSubagent',
  plan: 'PC.Components.ConversationRendererV2.nodeTitlePlan',
  'completed-interaction':
    'PC.Components.ConversationRendererV2.nodeTitleInteractionAsk',
  unknown: 'PC.Components.ConversationRendererV2.nodeTitleUnknown',
};

const MODE_OPTIONS: {
  value: NodePresentationMode | 'default';
  labelKey: string;
}[] = [
  {
    value: 'default',
    labelKey: 'PC.Components.ChatInputHome.conversationDisplayModeDefault',
  },
  {
    value: 'hidden',
    labelKey: 'PC.Components.ChatInputHome.conversationDisplayModeHidden',
  },
  {
    value: 'summary',
    labelKey: 'PC.Components.ChatInputHome.conversationDisplayModeSummary',
  },
  {
    value: 'expanded',
    labelKey: 'PC.Components.ChatInputHome.conversationDisplayModeExpanded',
  },
];

export interface ConversationDisplaySettingsProps {
  conversationId?: number | string | null;
}

const ConversationDisplaySettings: React.FC<
  ConversationDisplaySettingsProps
> = ({ conversationId }) => {
  const { token } = theme.useToken();
  const {
    renderer,
    globalVersion,
    source,
    preferences,
    sessionOverride,
    setGlobalVersion,
    setPreset,
    setNodeOverride,
    setSessionVersion,
  } = useConversationRendererPreference(conversationId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      data-testid="conversation-display-settings"
    >
      <div>
        <div
          style={{
            fontSize: 12,
            color: token.colorTextTertiary,
            marginBottom: 4,
          }}
        >
          {dict(
            'PC.Components.ChatInputHome.conversationDisplayGlobalRenderer',
          )}
        </div>
        <Segmented
          value={globalVersion}
          block
          // 显式 name：测试环境 rc-util 的 useId 恒返回 'test-id'，同名 radio 组会互斥顶掉勾选
          name="conversation-display-global-renderer"
          aria-label={dict(
            'PC.Components.ChatInputHome.conversationDisplayGlobalRenderer',
          )}
          disabled={source === 'url'}
          options={[
            {
              value: 'v1',
              label: dict(
                'PC.Components.ChatInputHome.conversationDisplayRendererV1',
              ),
            },
            {
              value: 'v2',
              label: dict(
                'PC.Components.ChatInputHome.conversationDisplayRendererV2',
              ),
            },
          ]}
          onChange={(value) =>
            setGlobalVersion(value as ConversationRendererVersion)
          }
        />
        <div
          data-testid="conversation-display-effective-source"
          style={{
            marginTop: 6,
            fontSize: 12,
            lineHeight: 1.5,
            color:
              source === 'url'
                ? token.colorWarningText
                : token.colorTextTertiary,
          }}
        >
          {dict(
            'PC.Components.ChatInputHome.conversationDisplayEffective',
            renderer.toUpperCase(),
            dict(
              `PC.Components.ChatInputHome.conversationDisplaySource.${source}`,
            ),
          )}
        </div>
      </div>

      {conversationId !== null && conversationId !== undefined && (
        <div>
          <div
            style={{
              fontSize: 12,
              color: token.colorTextTertiary,
              marginBottom: 4,
            }}
          >
            {sessionOverride
              ? dict(
                  'PC.Components.ChatInputHome.conversationDisplaySessionOverride',
                )
              : dict('PC.Components.ChatInputHome.conversationDisplay')}
          </div>
          <Segmented
            // 未设置覆盖时默认展示 V2（继承链兜底也是 V2，展示与生效一致）
            value={sessionOverride ?? 'v2'}
            block
            name="conversation-display-session-override"
            aria-label={dict(
              'PC.Components.ChatInputHome.conversationDisplaySessionOverride',
            )}
            options={[
              {
                value: 'inherit',
                label: dict(
                  'PC.Components.ChatInputHome.conversationDisplayModeDefault',
                ),
              },
              { value: 'v1', label: 'V1' },
              { value: 'v2', label: 'V2' },
            ]}
            onChange={(value) =>
              setSessionVersion(
                value === 'inherit'
                  ? null
                  : (value as ConversationRendererVersion),
              )
            }
            disabled={source === 'url'}
          />
          {sessionOverride && (
            <button
              type="button"
              style={{
                fontSize: 12,
                marginTop: 4,
                display: 'inline-block',
                cursor: 'pointer',
                padding: 0,
                border: 0,
                background: 'transparent',
                color: token.colorLink,
              }}
              onClick={() => setSessionVersion(null)}
            >
              {dict(
                'PC.Components.ChatInputHome.conversationDisplayClearSessionOverride',
              )}
            </button>
          )}
        </div>
      )}

      {renderer === 'v2' && (
        <>
          <div>
            <div
              style={{
                fontSize: 12,
                color: token.colorTextTertiary,
                marginBottom: 4,
              }}
            >
              {dict('PC.Components.ChatInputHome.conversationDisplayPreset')}
            </div>
            <Segmented
              value={preferences.preset}
              block
              name="conversation-display-preset"
              aria-label={dict(
                'PC.Components.ChatInputHome.conversationDisplayPreset',
              )}
              options={[
                {
                  value: 'focused',
                  label: dict(
                    'PC.Components.ChatInputHome.conversationDisplayPresetFocused',
                  ),
                },
                {
                  value: 'balanced',
                  label: dict(
                    'PC.Components.ChatInputHome.conversationDisplayPresetBalanced',
                  ),
                },
                {
                  value: 'detailed',
                  label: dict(
                    'PC.Components.ChatInputHome.conversationDisplayPresetDetailed',
                  ),
                },
              ]}
              onChange={(value) =>
                setPreset(value as typeof preferences.preset)
              }
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 12,
                color: token.colorTextTertiary,
                marginBottom: 4,
              }}
            >
              {dict('PC.Components.ChatInputHome.conversationDisplayAdvanced')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {PROCESS_NODE_KINDS.map((kind) => (
                <label
                  key={kind}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'default',
                  }}
                >
                  <span style={{ flex: 1, fontSize: 12 }}>
                    {dict(NODE_KIND_LABEL_KEYS[kind])}
                  </span>
                  <Select
                    size="small"
                    style={{ width: 110 }}
                    aria-label={dict(NODE_KIND_LABEL_KEYS[kind])}
                    value={preferences.nodeOverrides[kind] ?? 'default'}
                    options={MODE_OPTIONS.map((option) => ({
                      value: option.value,
                      label: dict(option.labelKey),
                    }))}
                    onChange={(value) =>
                      setNodeOverride(
                        kind,
                        value === 'default'
                          ? null
                          : (value as NodePresentationMode),
                      )
                    }
                  />
                </label>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ConversationDisplaySettings;
