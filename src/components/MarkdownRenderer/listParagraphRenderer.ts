/**
 * 列表段落渲染器
 * 为列表项内的段落添加 div.paragraph 包裹
 */

/**
 * 检查当前段落是否在列表项内
 */
function isParagraphInListItem(tokens: any[], idx: number): boolean {
  let listItemDepth = 0;

  // 向前扫描，查找是否在列表项内
  for (let i = idx - 1; i >= 0; i--) {
    const token = tokens[i];

    if (token.type === 'list_item_close') {
      listItemDepth--;
    } else if (token.type === 'list_item_open') {
      listItemDepth++;
      if (listItemDepth > 0) {
        return true;
      }
    }

    // 如果遇到其他容器的结束，停止搜索
    if (
      token.type === 'bullet_list_close' ||
      token.type === 'ordered_list_close'
    ) {
      break;
    }
  }

  return false;
}

/**
 * 应用列表段落渲染规则
 * @param mdInstance markdown-it 实例
 */
export function applyListParagraphRenderer(mdInstance: any): void {
  // 保存原始的 paragraph_open 渲染规则
  const originalParagraphOpen =
    mdInstance.renderer.rules.paragraph_open ||
    function (tokens: any[], idx: number, options: any, env: any, self: any) {
      return self.renderToken(tokens, idx, options);
    };

  // 保存原始的 paragraph_close 渲染规则
  const originalParagraphClose =
    mdInstance.renderer.rules.paragraph_close ||
    function (tokens: any[], idx: number, options: any, env: any, self: any) {
      return self.renderToken(tokens, idx, options);
    };

  // 覆盖段落开始标签渲染
  mdInstance.renderer.rules.paragraph_open = function (
    tokens: any[],
    idx: number,
    options: any,
    env: any,
    self: any,
  ) {
    if (isParagraphInListItem(tokens, idx)) {
      return '<div class="paragraph">';
    }
    return originalParagraphOpen(tokens, idx, options, env, self);
  };

  // 覆盖段落结束标签渲染
  mdInstance.renderer.rules.paragraph_close = function (
    tokens: any[],
    idx: number,
    options: any,
    env: any,
    self: any,
  ) {
    if (isParagraphInListItem(tokens, idx)) {
      return '</div>';
    }
    return originalParagraphClose(tokens, idx, options, env, self);
  };
}
