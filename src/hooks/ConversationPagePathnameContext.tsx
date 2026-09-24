import React from 'react';

/** 客户端常驻实例固定创建时的路径；普通路由沿用当前 location。 */
export const ConversationPagePathnameContext = React.createContext<
  string | undefined
>(undefined);
