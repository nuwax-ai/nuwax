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

/**
 * Git status 响应 data 字段
 * 对应接口 `/api/git/status` 返回体中的 `data`，外层为 `RequestResponse<GitStatusResponse>`
 */
export interface GitStatusResponse {
  /** 业务是否成功 */
  success: boolean;
  /** 日志 ID */
  logId: string;
  /** 当前分支名（如 main、feat-618） */
  current: string;
  /** 已暂存的文件路径（已 git add，将包含在下次 commit 中） */
  staged: string[];
  /** 工作区已修改但未暂存的文件路径（相对 HEAD 有变动，且不在暂存区） */
  modified: string[];
  /** 新创建且已暂存的文件路径（git 之前未跟踪的文件被 git add 后出现在这里） */
  created: string[];
  /** 已删除的文件路径（暂存区或工作区中文件被删除） */
  deleted: string[];
  /** 未跟踪的新文件路径（从未 git add） */
  untracked?: string[];
  /** 已重命名的文件路径（一般为新路径） */
  renamed?: string[];
  /** 合并冲突的文件路径 */
  conflicted: string[];
  /** 本地领先远程的 commit 数 */
  ahead: number;
  /** 本地落后远程的 commit 数 */
  behind: number;
  /** 当前分支跟踪的远程分支（如 origin/main），未跟踪则为 null */
  tracking?: string[] | null;
}

/** Git stash 请求参数 */
export interface GitStashParams extends GitTagsParams {
  /*stash 信息（push 时使用） */
  message?: string;

  // 指定暂存的文件列表（push 时使用，为空时暂存全部变更）
  files?: string[];

  /*stash 索引（pop 时使用） */
  index?: number;
}

/** Git stash pop 请求参数 */
export type GitStashPopParams = GitStashParams;

/** Git stash list 请求参数 */
export type GitStashListParams = GitTagsParams;

/** 单条 Git stash 记录 */
export interface GitStashItem {
  /** stash 索引（0 为最新） */
  index: number;
  /** stash commit hash */
  hash: string;
  /** stash 说明 */
  message: string;
  /** 创建时间 */
  date: string;
  /** 该条 stash 包含的文件路径 */
  files: string[];
}

/**
 * Git stash list 响应 data 字段
 * 对应接口 `/api/git/stash-list` 返回体中的 `data`
 */
export interface GitStashListResponse {
  /** 日志 ID */
  logId: string;
  /** stash 栈记录列表 */
  stashes: GitStashItem[];
  /** 业务是否成功 */
  success: boolean;
  /** 总条数 */
  total: number;
}

/** Git revert 请求参数 */
export interface GitRevertParams extends GitTagsParams {
  /*要撤销的 commit hash */
  target?: string;
}

/** Git reset 请求参数 */
export interface GitResetParams extends GitTagsParams {
  /*重置目标（commit hash / tag / branch） */
  target?: string;

  /*重置模式: soft / mixed / hard（默认 mixed） */
  mode?: string;
}

/** Git log 请求参数 */
export interface GitLogParams extends GitTagsParams {
  /*页码，从1开始 */
  page?: number;

  /*每页条数 */
  pageSize?: number;

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
  paths?: string[];
}

/** Git commit 请求参数 */
export interface GitCommitParams extends GitTagsParams {
  /*提交信息 */
  message?: string;

  /*提交文件列表 */
  files?: string[];
}

/** Git checkout 请求参数 */
export interface GitCheckoutParams extends GitTagsParams {
  /*检出目标（commit hash / tag / branch） */
  target?: string;
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
export type GitBranchDeleteParams = GitBranchSwitchParams;

/** Git branch create 请求参数 */
export type GitBranchCreateParams = GitBranchSwitchParams;

/** Git add 请求参数 */
export interface GitAddParams extends GitTagsParams {
  /** 添加的文件列表 */
  files?: string[];
}
