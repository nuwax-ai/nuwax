import type { RequestResponse } from '@/types/interfaces/request';
import { request } from 'umi';
import type {
  GitBranchCreateParams,
  GitBranchDeleteParams,
  GitBranchesParams,
  GitBranchSwitchParams,
  GitCommitParams,
  GitDiffParams,
  GitDiscardParams,
  GitInitParams,
  GitLogParams,
  GitRollbackParams,
  GitStashListParams,
  GitStashParams,
  GitStashPopParams,
  GitStatusParams,
  GitTagCreateParams,
  GitTagDeleteParams,
  GitTagsParams,
  GitUnstageParams,
} from '../types/git-version-management';

// Git unstage
export function apiGitUnstage(
  data: GitUnstageParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/unstage', {
    method: 'POST',
    data,
  });
}

// Git tags
export function apiGitTags(
  data: GitTagsParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/tags', {
    method: 'POST',
    data,
  });
}

// Git tag delete
export function apiGitTagDelete(
  data: GitTagDeleteParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/tag-delete', {
    method: 'POST',
    data,
  });
}

// Git tag create
export function apiGitTagCreate(
  data: GitTagCreateParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/tag-create', {
    method: 'POST',
    data,
  });
}

// Git status
export function apiGitStatus(
  data: GitStatusParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/status', {
    method: 'POST',
    data,
  });
}

// Git stash
export function apiGitStash(
  data: GitStashParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/stash', {
    method: 'POST',
    data,
  });
}

// Git stash pop
export function apiGitStashPop(
  data: GitStashPopParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/stash-pop', {
    method: 'POST',
    data,
  });
}

// Git stash list
export function apiGitStashList(
  data: GitStashListParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/stash-list', {
    method: 'POST',
    data,
  });
}

// Git rollback
export function apiGitRollback(
  data: GitRollbackParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/rollback', {
    method: 'POST',
    data,
  });
}

// Git log
export function apiGitLogList(
  data: GitLogParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/log', {
    method: 'POST',
    data,
  });
}

// Git init
export function apiGitInit(
  data: GitInitParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/init', {
    method: 'POST',
    data,
  });
}

// Git discard
export function apiGitDiscard(
  data: GitDiscardParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/discard', {
    method: 'POST',
    data,
  });
}

// Git diff
export function apiGitDiff(
  data: GitDiffParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/diff', {
    method: 'POST',
    data,
  });
}

// Git commit
export function apiGitCommit(
  data: GitCommitParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/commit', {
    method: 'POST',
    data,
  });
}

// Git branches
export function apiGitBranches(
  data: GitBranchesParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/branches', {
    method: 'POST',
    data,
  });
}

// Git branch switch
export function apiGitBranchSwitch(
  data: GitBranchSwitchParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/branch-switch', {
    method: 'POST',
    data,
  });
}

// Git branch delete
export function apiGitBranchDelete(
  data: GitBranchDeleteParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/branch-delete', {
    method: 'POST',
    data,
  });
}

// Git branch create
export function apiGitBranchCreate(
  data: GitBranchCreateParams,
): Promise<RequestResponse<null>> {
  return request('/api/git/branch-create', {
    method: 'POST',
    data,
  });
}
