/**
 * V2 渲染器懒加载共享包装（ChatContentArea / ConversationDetails 等入口复用）。
 *
 * 位置约束：本文件必须在 presentation-v2 目录**外**——懒加载 chunk 由
 * `import('@/features/conversation/presentation-v2/react')` 切分，错误边界与
 * Suspense 若放进 chunk 内，chunk 拉取失败时它们自身尚不存在，异常会冒泡
 * 到根卸载整棵树（「回退 V1、禁止白屏」规格，见 docs/conversation/renderer-v2.md）。
 * 类型经 `import type` 引入（编译期擦除，不把 chunk 提前并入主包）。
 */
import { dict } from '@/services/i18nRuntime';
import { LoadingOutlined } from '@ant-design/icons';
import React from 'react';
import type { ConversationRendererV2Props } from './presentation-v2/react';

const ConversationRendererV2 = React.lazy(() =>
  import('./presentation-v2/react').then((module) => ({
    default: module.ConversationRendererV2,
  })),
);

/**
 * V2 懒加载边界：chunk 拉取失败（发版后旧 tab 请求已删除 hash、弱网）时
 * V2 内部的 ErrorBoundary 尚未加载，异常会冒泡到根卸载整棵树。
 * 本地 boundary 捕获后回退 fallback（调用方传 V1 列表），满足回退规格。
 */
export class V2RendererLoadBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error(
      '[ConversationRendererV2] chunk load failed, falling back to V1',
      error,
      info?.componentStack,
    );
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/** V2 懒加载中的占位（e2e/组件测试经 data-testid 探测加载态） */
const V2RendererLoading: React.FC = () => (
  <div
    role="status"
    data-testid="v2-renderer-loading"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '24px 0',
      color: 'rgba(5, 5, 5, 0.45)',
    }}
  >
    <LoadingOutlined aria-hidden="true" />
    <span style={{ fontSize: 12 }}>
      {dict('PC.Pages.Chat.loadingHistoryConversation')}
    </span>
  </div>
);

export interface ConversationRendererV2LazyProps
  extends ConversationRendererV2Props {
  /** 懒加载失败（chunk 拉取异常）时的回退内容，调用方传 V1 消息列表 */
  fallback?: React.ReactNode;
}

/** V2 渲染器统一懒加载入口：Suspense 加载态 + chunk 失败回退的单一事实源 */
export const ConversationRendererV2Lazy: React.FC<
  ConversationRendererV2LazyProps
> = ({ fallback = null, ...props }) => (
  <V2RendererLoadBoundary fallback={fallback}>
    <React.Suspense fallback={<V2RendererLoading />}>
      <ConversationRendererV2 {...props} />
    </React.Suspense>
  </V2RendererLoadBoundary>
);
