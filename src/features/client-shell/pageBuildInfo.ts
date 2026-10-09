/** 页面实际加载的构建信息；不可用发版后的 version.json 代替当前文档版本。 */
export type PageBuildInfo = Readonly<{
  appVersion?: string;
  gitHash?: string;
}>;

export function normalizeGitHash(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const hash = value.trim().toLowerCase();
  return /^[a-f0-9]{7,64}$/.test(hash) ? hash : undefined;
}

export function readPageBuildInfo(doc: Document): PageBuildInfo {
  const appVersion = doc
    .querySelector('meta[name="nuwax-build-version"]')
    ?.getAttribute('content')
    ?.trim();
  const gitHash = normalizeGitHash(
    doc
      .querySelector('meta[name="nuwax-build-git-hash"]')
      ?.getAttribute('content'),
  );
  return Object.freeze({ appVersion: appVersion || undefined, gitHash });
}

// 固定初始文档版本，路由切换、后续轮询或 DOM 变更均不能改变比较基准。
const pageBuildInfo: PageBuildInfo =
  typeof document === 'undefined'
    ? Object.freeze({})
    : readPageBuildInfo(document);

export function getPageBuildInfo(): PageBuildInfo {
  return pageBuildInfo;
}
