import { A2UIProvider, A2UIRenderer, useA2UI } from '@copilotkit/a2ui-renderer';
import {
  CopilotKit,
  MCPAppsActivityRenderer,
  a2uiDefaultTheme,
  useAgent,
} from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useEffect, useMemo } from 'react';

import type { CopilotKitMcpPayload } from '../../utils/copilotKitMcp';
import styles from './index.less';

const cx = classNames.bind(styles);

interface CopilotKitPanelProps {
  conversationId: number | string;
  payload?: CopilotKitMcpPayload | null;
  onClose: () => void;
}

const DEFAULT_RUNTIME_URL = 'http://127.0.0.1:4111/api/copilotkit';

const A2UISurfaceView: React.FC<{
  payload: CopilotKitMcpPayload;
}> = ({ payload }) => {
  const { clearSurfaces, processMessages } = useA2UI();
  const surfaceIds = useMemo(
    () => (payload.surfaceIds?.length ? payload.surfaceIds : ['default']),
    [payload.surfaceIds],
  );
  const opsRef = React.useRef<string>('');

  useEffect(() => {
    const opsKey = JSON.stringify(payload.operations);
    if (opsKey === opsRef.current) return;
    opsRef.current = opsKey;

    clearSurfaces();
    if (payload.operations?.length) {
      processMessages(payload.operations);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload.operations]);

  return (
    <div className={cx(styles['surface-stack'])}>
      {surfaceIds.map((surfaceId) => (
        <A2UIRenderer
          key={surfaceId}
          surfaceId={surfaceId}
          className={cx(styles['a2ui-surface'])}
          fallback={
            <div className={cx(styles['empty-state'])}>
              等待后端智能体返回 A2UI Surface。
            </div>
          }
        />
      ))}
    </div>
  );
};

const McpAppsSurfaceView: React.FC<{
  payload: CopilotKitMcpPayload;
}> = ({ payload }) => {
  const { agent } = useAgent({ agentId: 'default' });

  if (!payload.mcpAppsContent) {
    return (
      <div className={cx(styles['empty-state'])}>
        MCP Apps 数据不完整，暂时无法渲染。
      </div>
    );
  }

  return (
    <MCPAppsActivityRenderer
      activityType="mcp-apps"
      content={payload.mcpAppsContent as any}
      message={payload.raw}
      agent={agent as any}
    />
  );
};

const CopilotKitPayloadRenderer: React.FC<{
  payload?: CopilotKitMcpPayload | null;
}> = ({ payload }) => {
  if (!payload) {
    return (
      <div className={cx(styles['empty-state'])}>
        左侧输入会继续发送给 nuwax 后端。后端智能体通过动态 MCP 返回 CopilotKit
        MCP Apps 或 A2UI 结果后，这里会自动展示。
      </div>
    );
  }

  return (
    <A2UIProvider
      key={payload.sourceMessageId || 'a2ui'}
      theme={a2uiDefaultTheme}
    >
      <A2UISurfaceView payload={payload} />
    </A2UIProvider>
  );
};

const CopilotKitPanel: React.FC<CopilotKitPanelProps> = ({
  conversationId,
  payload,
  onClose,
}) => {
  const runtimeUrl = useMemo(() => {
    return process.env.COPILOTKIT_RUNTIME_URL || DEFAULT_RUNTIME_URL;
  }, []);

  const threadId = useMemo(() => {
    return `nuwax-chat-${conversationId || 'default'}`;
  }, [conversationId]);

  const subtitle = payload
    ? `${payload.kind === 'mcp-apps' ? 'MCP Apps' : 'A2UI'} · ${
        payload.sourceMessageId || threadId
      }`
    : '等待 nuwax 后端智能体返回 MCP UI';

  return (
    <div className={cx(styles.container)}>
      <header className={cx(styles.header)}>
        <div>
          <div className={cx(styles.title)}>AI UI 生成</div>
          <div className={cx(styles.subtitle)}>{subtitle}</div>
        </div>
        <Button size="small" onClick={onClose}>
          关闭
        </Button>
      </header>

      <div className={cx(styles.body)}>
        {payload?.kind === 'mcp-apps' ? (
          <CopilotKit
            runtimeUrl={runtimeUrl}
            onError={(event) => {
              console.error('[CopilotKit]', event);
            }}
            a2ui={{
              theme: a2uiDefaultTheme,
            }}
          >
            <McpAppsSurfaceView payload={payload} />
          </CopilotKit>
        ) : (
          <CopilotKitPayloadRenderer payload={payload} />
        )}
      </div>
    </div>
  );
};

export default CopilotKitPanel;
