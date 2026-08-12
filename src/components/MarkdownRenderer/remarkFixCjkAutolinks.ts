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
const URL_REFERENCE_BOUNDARY = /\[\d+(?:\]|$)/;

const isHostOnlyUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return (
      ['http:', 'https:'].includes(parsedUrl.protocol) &&
      !!parsedUrl.host &&
      (parsedUrl.pathname === '' || parsedUrl.pathname === '/') &&
      !parsedUrl.search &&
      !parsedUrl.hash
    );
  } catch {
    return false;
  }
};

const findUrlBoundary = (linkText: string, normalizedUrl: string): number => {
  const cjkBoundary = linkText.search(CJK_URL_BOUNDARY);
  const referenceMatch = URL_REFERENCE_BOUNDARY.exec(linkText);
  const referenceBoundary = referenceMatch?.index ?? -1;

  if (referenceBoundary >= 0) {
    const urlBeforeReference = normalizedUrl.slice(
      0,
      normalizedUrl.length - (linkText.length - referenceBoundary),
    );
    // 仅把域名后的 [1]、[12] 识别为参考文献尾标；URL 路径中的方括号保持不变。
    if (isHostOnlyUrl(urlBeforeReference)) {
      return referenceBoundary;
    }
  }

  return cjkBoundary;
};

const splitBareUrlNode = (
  node: MarkdownNode,
  source: string,
): [MarkdownNode, MarkdownNode] | null => {
  if (
    node.type !== 'link' ||
    !node.url?.match(/^https?:\/\//i) ||
    node.children?.length !== 1 ||
    node.children[0].type !== 'text'
  ) {
    return null;
  }

  const startOffset = node.position?.start?.offset;
  const endOffset = node.position?.end?.offset;
  if (
    typeof startOffset !== 'number' ||
    typeof endOffset !== 'number' ||
    source.slice(startOffset, endOffset) !== node.children[0].value
  ) {
    // 只处理 GFM 裸 URL，避免改写用户显式声明的 Markdown 链接。
    return null;
  }

  const linkText = node.children[0].value;
  const boundaryIndex = findUrlBoundary(linkText, node.url);
  if (boundaryIndex < 0) return null;

  const trailingText = linkText.slice(boundaryIndex);
  // remark-gfm 会为 www.example.com 补全 http://，不能直接以 URL 的下标切分。
  const url = node.url.slice(0, node.url.length - trailingText.length);
  const displayUrl = linkText.slice(0, boundaryIndex);
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
      children: [{ ...node.children[0], value: displayUrl }],
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
