type Token = any;
export enum TokenRenderType {
  Custom = 'custom',
  Image = 'image',
  Standard = 'standard',
}
// 记录每个token的类型和位置信息
export interface TokenRenderGroup {
  type: TokenRenderType;
  tokens: Token[];
  startIndex: number;
}

const NEED_TOOLBAR_TOKEN_TYPE_MAP = ['fence', 'thead_open'];

const _paragraphImage = (newTokens: any[]) => {
  //通过这个方法 找到图片的token 然后给图片的token 添加一个meta.nextId 在图片的close
  const hitIndex = newTokens.findIndex((token) =>
    token.children?.some((child: any) => child?.type === TokenRenderType.Image),
  );
  if (
    hitIndex !== -1 &&
    newTokens[hitIndex + 1]?.meta?.id &&
    newTokens[hitIndex - 1]?.meta?.id
  ) {
    newTokens[hitIndex].children.forEach((child: any) => {
      child.meta = {
        ...child.meta,
        nextId: newTokens[hitIndex + 1]?.meta.id,
        prevId: newTokens[hitIndex - 1]?.meta.id,
      };
    });

    newTokens[hitIndex + 1].meta = {
      ...newTokens[hitIndex + 1].meta,
      component: TokenRenderType.Image,
      prevId: newTokens[hitIndex]?.meta.id,
    };
    newTokens[hitIndex].meta = {
      ...newTokens[hitIndex].meta,
      component: TokenRenderType.Image,
      nextId: newTokens[hitIndex + 1]?.meta.id,
    };

    newTokens[hitIndex - 1].meta = {
      ...newTokens[hitIndex - 1].meta,
      component: TokenRenderType.Image,
      prevId: newTokens[hitIndex]?.meta.id,
    };
  }
  return newTokens;
};

export default function rewriteToken(tokens: any[], requestId: string) {
  const newTokens = tokens.map((token, index) => {
    return {
      ...token,
      meta: {
        ...token.meta,
        requestId,
        id: `${token?.type}${token?.info ? '-' + token?.info : ''}-${index}`,
        isFirst: index === 0,
        isLast: index === tokens.length - 1,
        toolbar: NEED_TOOLBAR_TOKEN_TYPE_MAP.includes(token.type),
      },
    };
  });
  newTokens.forEach((token, index) => {
    token.meta.prevId = newTokens[index - 1]?.meta?.id || '';
    token.meta.nextId = newTokens[index + 1]?.meta?.id || '';
  });

  return _paragraphImage(newTokens);
}
