/**
 * 会话 Mock 验收页判定（dev-only 单点，全部业务出口共用）。
 *
 * 存在原因：/mock-chat（及 /app/mock-chat 应用形态变体）验收页的会话接口走
 * 同源 Umi mock（dev-server），需在少量服务层出口切换源、跳过登录重定向。
 * 路由本身仅在 development 注册（src/routes/index.ts），生产构建不可达；
 * 此处 NODE_ENV 双保险，生产恒为 false，业务行为零影响。
 *
 * 摘除方式：删除本文件与全部引用（5 处：app.tsx / common.constants.ts /
 * agentConfig.ts / common.ts ×2）即可整体移除 mock 验收体系的服务层侵入。
 * 详见 docs/conversation/mock-optimization-plan.md。
 */
const MOCK_CHAT_ROUTES = [
  '/mock-chat',
  '/app/mock-chat',
  '/mock-gallery',
  '/app/mock-gallery',
];

export const isConversationMockPage = (): boolean =>
  process.env.NODE_ENV === 'development' &&
  typeof window !== 'undefined' &&
  MOCK_CHAT_ROUTES.some(
    (route) =>
      window.location.pathname === route ||
      window.location.pathname.startsWith(`${route}/`),
  );
