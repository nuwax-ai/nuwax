import React from 'react';

/** 客户端常驻会话使用实例创建时的 query；未包 Provider 时沿用浏览器当前 URL。 */
export const ConversationRendererRouteSearchContext = React.createContext<
  string | undefined
>(undefined);
