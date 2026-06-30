import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type {
  GitAddParams,
  GitBranchCreateParams,
  GitBranchDeleteParams,
  GitBranchesParams,
  GitBranchSwitchParams,
  GitCheckoutParams,
  GitCommitParams,
  GitDiffParams,
  GitDiffResponseData,
  GitDiscardParams,
  GitFileContentParams,
  GitFileContentResponseData,
  GitInitParams,
  GitLogParams,
  GitLogResponseData,
  GitResetParams,
  GitRevertParams,
  GitStashListParams,
  GitStashListResponse,
  GitStashParams,
  GitStashPopParams,
  GitStatusParams,
  GitStatusResponse,
  GitTagCreateParams,
  GitTagDeleteParams,
  GitTagsParams,
  GitUnstageParams,
} from '../types/git-version-management';

/**
 * Git unstage - 取消暂存
 * 将文件从暂存区移回工作区（变为 unstaged），不丢弃文件内容。对应 git restore --staged ，files 为空时取消全部暂存。
 */
export function apiGitUnstage(
  data: GitUnstageParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/unstage', {
    method: 'POST',
    data,
  });
}

// Git tags - 查看标签列表
export function apiGitTags(
  data: GitTagsParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/tags', {
    method: 'POST',
    data,
  });
}

// Git tag delete - 删除标签
export function apiGitTagDelete(
  data: GitTagDeleteParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/tag-delete', {
    method: 'POST',
    data,
  });
}

// Git tag create - 创建标签
export function apiGitTagCreate(
  data: GitTagCreateParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/tag-create', {
    method: 'POST',
    data,
  });
}

/**
 * Git status - 查看工作区状态
 * 返回当前 staged / modified / untracked 文件列表，对应 git status
 */
export function apiGitStatus(
  data: GitStatusParams,
): Promise<RequestResponse<GitStatusResponse>> {
  return request('/api/git/status', {
    method: 'POST',
    data,
  });
}

/**
 * Git stash - 暂存当前更改
 * 将工作区和暂存区的修改临时保存到 stash 栈（git stash push），工作区恢复到干净状态。适合切换分支前临时保存未完成的改动。
 */
export function apiGitStash(
  data: GitStashParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/stash', {
    method: 'POST',
    data,
  });
}

/**
 * Git stash pop - 恢复暂存的更改
 * 从 stash 栈中恢复暂存记录到工作区。指定 files 时只恢复指定文件（stash 条目保留）；不指定 files 时恢复全部并从栈中移除。index 为空时恢复最新一条。
 */
export function apiGitStashPop(
  data: GitStashPopParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/stash-pop', {
    method: 'POST',
    data,
  });
}

/**
 * Git stash list - 查看暂存列表
 * 返回 stash 栈中所有暂存记录，每条包含 index、hash、message 和日期
 */
export function apiGitStashList(
  data: GitStashListParams,
): Promise<RequestResponse<GitStashListResponse>> {
  return request('/api/git/stash-list', {
    method: 'POST',
    data,
  });
}

/**
 * Git revert - 撤销指定 commit
 * 针对某个 commit 创建一个反向新提交（git revert），不修改历史记录。适合撤销已推送的提交。
 */
export function apiGitRevert(
  data: GitRevertParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/revert', {
    method: 'POST',
    data,
  });
}

/**
 * Git reset - 重置到指定版本
 * 移动 HEAD 到 target 版本。
 * soft: 后续 commit 的改动保留在暂存区；mixed（默认）: 改动变为 unstaged；hard: 暂存区和工作区全部恢复到 target，后续改动丢失。
 * 返回 previousHead 可用于再次 reset 回原版本。
 */
export function apiGitReset(
  data: GitResetParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/reset', {
    method: 'POST',
    data,
  });
}

/**
 * Git log - 查看提交历史
 * 分页返回 commit 列表，每条包含 hash、message、author、date。page 从 1 开始，默认 pageSize=50。
 */
export function apiGitLogList(
  data: GitLogParams,
): Promise<RequestResponse<GitLogResponseData>> {
  return request('/api/git/log', {
    method: 'POST',
    data,
  });
}

/**
 * Git init - 初始化 Git 仓库
 * 在项目目录中执行 git init，并生成 .gitignore。通常无需手动调用，首次 Git 操作时会自动初始化。
 */
export function apiGitInit(
  data: GitInitParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/init', {
    method: 'POST',
    data,
  });
}

//
/**
 * Git discard - 丢弃文件更改
 * 丢弃工作区中未提交的修改，将文件恢复到最近一次 commit 的状态，不可恢复。对应 git restore ，files 为空时丢弃全部修改。
 */
export function apiGitDiscard(
  data: GitDiscardParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/discard', {
    method: 'POST',
    data,
  });
}

/**
 * Git diff - 查看文件差异
 * 对比两个版本间的文件内容差异。from / to 为 commit hash，paths 指定文件范围，均可为空。
 */
export function apiGitDiff(
  data: GitDiffParams,
): Promise<RequestResponse<GitDiffResponseData>> {
  return request('/api/git/diff', {
    method: 'POST',
    data,
  });
}

/**
 * Git file content - 获取指定版本的文件内容
 * 对比两个版本间的文件内容差异。from / to 为 commit hash，paths 指定文件范围，均可为空。
 */
export function apiGitFileContent(
  data: GitFileContentParams,
): Promise<RequestResponse<GitFileContentResponseData>> {
  return request('/api/git/file-content', {
    method: 'POST',
    data,
  });
}

/**
 * Git commit - 提交更改
 * 将暂存区的文件提交为新版本。files 为空时提交全部暂存文件；authorName / authorEmail 由后端自动从登录信息获取，无需前端传递。
 */
export function apiGitCommit(
  data: GitCommitParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/commit', {
    method: 'POST',
    data,
  });
}

/**
 * Git checkout - 检出目标版本文件
 * 将 target 版本的文件内容恢复到工作区和暂存区，HEAD 不移动（commit 历史不变）。暂存区中的变更是后续 commit 改动的反向，可直接 commit 生成一个回滚提交。
 */
export function apiGitCheckout(
  data: GitCheckoutParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/checkout', {
    method: 'POST',
    data,
  });
}

/**
 * Git branches - 查看分支列表
 * 返回所有本地分支名称，标注当前所在分支
 */
export function apiGitBranches(
  data: GitBranchesParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/branches', {
    method: 'POST',
    data,
  });
}

//
/**
 * Git branch switch - 切换分支
 * 切换到指定分支，工作区必须干净（无未提交修改）才能切换
 */
export function apiGitBranchSwitch(
  data: GitBranchSwitchParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/branch-switch', {
    method: 'POST',
    data,
  });
}

/**
 * Git branch delete - 删除分支
 * 删除指定分支，force=true 强制删除未合并的分支
 */
export function apiGitBranchDelete(
  data: GitBranchDeleteParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/branch-delete', {
    method: 'POST',
    data,
  });
}

/**
 * Git branch create - 创建分支
 * 基于 startPoint（commit hash / tag / 分支名）创建新分支，startPoint 为空时基于当前 HEAD
 */
export function apiGitBranchCreate(
  data: GitBranchCreateParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/branch-create', {
    method: 'POST',
    data,
  });
}

/**
 * Git branch add - 暂存文件
 * 将文件加入暂存区（git add）。files 为空时暂存全部变更。文件写入/创建后可调用此接口让 Git 跟踪变更。
 */
export function apiGitAdd(data: GitAddParams): Promise<RequestResponse<null>> {
  return request('/api/git/add', {
    method: 'POST',
    data,
  });
}
