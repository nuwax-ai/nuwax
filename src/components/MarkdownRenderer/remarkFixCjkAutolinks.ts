interface PositionPoint {
  offset?: number;
}

interface MarkdownNode {
  type?: string;
  value?: string;
  url?: string;
  children?: MarkdownNode[];
  position?: {
    start?: PositionPoint;
    end?: PositionPoint;
  };
}

interface MarkdownFile {
  value?: unknown;
}

// GFM 会把紧邻裸 URL 的中日韩正文当作 URL 路径；这些字符应作为正文边界。
const CJK_URL_BOUNDARY =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}，。！？；：、（）［］【】《》〈〉“”‘’「」『』]/u;

const splitBareUrlNode = (
  node: MarkdownNode,
  source: string,
): [MarkdownNode, MarkdownNode] | null => {
  if (
    node.type !== 'link' ||
    !node.url?.match(/^https?:\/\//i) ||
    node.children?.length !== 1 ||
    node.children[0].type !== 'text' ||
    node.children[0].value !== node.url
  ) {
    return null;
  }

  const startOffset = node.position?.start?.offset;
  const endOffset = node.position?.end?.offset;
  if (
    typeof startOffset !== 'number' ||
    typeof endOffset !== 'number' ||
    source.slice(startOffset, endOffset) !== node.url
  ) {
    // 只处理 GFM 裸 URL，避免改写用户显式声明的 Markdown 链接。
    return null;
  }

  const boundaryIndex = node.url.search(CJK_URL_BOUNDARY);
  if (boundaryIndex < 0) return null;

  const url = node.url.slice(0, boundaryIndex);
  const trailingText = node.url.slice(boundaryIndex);
  if (!url || !trailingText) return null;

  try {
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol) || !parsedUrl.host) {
      return null;
    }
  } catch {
    // 不把国际化域名等合法场景截断成不完整的协议前缀。
    return null;
  }

  return [
    {
      ...node,
      url,
      children: [{ ...node.children[0], value: url }],
    },
    { type: 'text', value: trailingText },
  ];
};

export const fixCjkAutolinks = (tree: MarkdownNode, source: string): void => {
  if (!tree.children) return;

  for (let index = 0; index < tree.children.length; index += 1) {
    const child = tree.children[index];
    const splitNodes = splitBareUrlNode(child, source);

    if (splitNodes) {
      tree.children.splice(index, 1, ...splitNodes);
      index += 1;
      continue;
    }

    fixCjkAutolinks(child, source);
  }
};

/** 修正 remark-gfm 对“裸 URL + 中文正文”的过度链接。 */
const remarkFixCjkAutolinks = () => {
  return (tree: MarkdownNode, file: MarkdownFile) => {
    const source = typeof file.value === 'string' ? file.value : '';
    fixCjkAutolinks(tree, source);
  };
};

export default remarkFixCjkAutolinks;
