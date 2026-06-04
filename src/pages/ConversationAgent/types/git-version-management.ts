/** Git 工作空间类型 */
export type GitWorkspaceType = 'taskAgent' | 'pageApp';

/** Git 取消暂存请求参数 */
export interface GitUnstageParams {
  /** 工作空间类型: taskAgent / pageApp */
  workspaceType?: GitWorkspaceType;
  /** 项目 ID（pageApp 模式） */
  projectId?: number;
  /** 取消暂存的文件列表 */
  files?: string[];
  /** 会话 ID */
  cid?: number;
}

/** Git tags 请求参数 */
export interface GitTagsParams {
  /** 工作空间类型: taskAgent / pageApp */
  workspaceType?: GitWorkspaceType;
  /** 项目 ID（pageApp 模式） */
  projectId?: number;
  /** 会话 ID */
  cid?: number;
}

/** Git tag delete 请求参数 */
export interface GitTagDeleteParams extends GitTagsParams {
  /** 标签名称 */
  tagName?: string;
  /*标签信息（创建时使用） */
  message?: string;
}

/** Git tag create 请求参数 */
export type GitTagCreateParams = GitTagDeleteParams;

/** Git status 请求参数 */
export type GitStatusParams = GitTagsParams;

/** Git stash 请求参数 */
export interface GitStashParams extends GitTagsParams {
  /*stash 信息（push 时使用） */
  message?: string;

  /*stash 索引（pop 时使用） */
  index?: number;
}

/** Git stash pop 请求参数 */
export type GitStashPopParams = GitStashParams;

/** Git stash list 请求参数 */
export type GitStashListParams = GitTagsParams;

/** Git rollback 请求参数 */
export interface GitRollbackParams extends GitTagsParams {
  /*回滚目标（commit hash / tag / branch） */
  target?: string;

  /*回滚模式: soft / hard */
  mode?: string;
}

/** Git log 请求参数 */
export interface GitLogParams extends GitTagsParams {
  /*最大返回条数 */
  maxCount?: number;

  /*分支名称 */
  branch?: string;
}

/** Git init 请求参数 */
export type GitInitParams = GitTagsParams;

/** Git discard 请求参数 */
export interface GitDiscardParams extends GitTagsParams {
  // 取消暂存的文件列表
  files?: string[];
}

/** Git diff 请求参数 */
export interface GitDiffParams extends GitTagsParams {
  /*起始提交/引用 */
  from?: string;

  /*目标提交/引用 */
  to?: string;

  /*文件路径列表 */
  paths?: Record<string, unknown>[];
}

/** Git commit 请求参数 */
export interface GitCommitParams extends GitTagsParams {
  /*提交信息 */
  message?: string;

  /*提交文件列表 */
  files?: Record<string, unknown>[];

  /*提交者名称 */
  authorName?: string;

  /*提交者邮箱 */
  authorEmail?: string;
}

/** Git branches 请求参数 */
export type GitBranchesParams = GitTagsParams;

/** Git branch switch 请求参数 */
export interface GitBranchSwitchParams extends GitTagsParams {
  /*分支名称 */
  branchName?: string;

  /*起始点（创建分支时使用） */
  startPoint?: string;

  /*是否强制删除（删除分支时使用） */
  force?: boolean;
}

/** Git branch delete 请求参数 */
export interface GitBranchDeleteParams extends GitTagsParams {
  /*分支名称 */
  branchName?: string;

  /*起始点（创建分支时使用） */
  startPoint?: string;

  /*是否强制删除（删除分支时使用） */
  force?: boolean;
}

/** Git branch create 请求参数 */
export interface GitBranchCreateParams extends GitTagsParams {
  /*分支名称 */
  branchName?: string;

  /*起始点（创建分支时使用） */
  startPoint?: string;

  /*是否强制删除（删除分支时使用） */
  force?: boolean;
}
