import '@/components/MarkdownRenderer/ds-markdown.css';
import styles from '@/components/MarkdownRenderer/index.less';
import { replaceMathBracket } from '@/components/MarkdownRenderer/utils';
import type { MarkdownCMDRef } from '@/types/interfaces/markdownRender';
import classNames from 'classnames';
import { ConfigProvider, MarkdownCMD } from 'ds-markdown';
import 'ds-markdown/katex.css';
import { katexPlugin } from 'ds-markdown/plugins';
import { forwardRef, useMemo } from 'react';
import genAppDevPlugin from '../../genAppDevPlugin';
import './index.less';

const cx = classNames.bind(styles);

interface AppDevMarkdownCMDProps {
  id: string;
  className?: string;
  theme?: 'light' | 'dark';
  disableTyping?: boolean;
  interval?: number;
  requestId?: string;
}

/**
 * AppDev 专用 MarkdownCMD 渲染器
 * 使用 MarkdownCMD 提供流式渲染支持，集成 Plan 和 Tool Call 的自定义插件
 */
const AppDevMarkdownCMD = forwardRef<MarkdownCMDRef, AppDevMarkdownCMDProps>(
  (
    {
      id,
      className = '',
      theme = 'light',
      disableTyping = false,
      interval = 10,
      requestId,
    },
    ref,
  ) => {
    const plugins = useMemo(() => {
      const appDevPlugin = genAppDevPlugin();
      return [katexPlugin, appDevPlugin];
    }, []);

    // 使用 requestId 作为主要 key，确保每次新会话都重新渲染
    const renderKey = requestId ? `${id}-${requestId}` : id;

    return (
      <div
        key={renderKey}
        id={id}
        data-key={id}
        className={cx(
          styles['markdown-container'],
          'appDevMarkdownCMD',
          className,
        )}
      >
        <ConfigProvider>
          <MarkdownCMD
            ref={ref}
            timerType="requestAnimationFrame"
            interval={interval}
            plugins={plugins}
            codeBlock={{ headerActions: false }}
            theme={theme}
            math={{
              splitSymbol: 'bracket',
              replaceMathBracket,
            }}
            disableTyping={disableTyping}
          />
        </ConfigProvider>
      </div>
    );
  },
);

AppDevMarkdownCMD.displayName = 'AppDevMarkdownCMD';

export default AppDevMarkdownCMD;
