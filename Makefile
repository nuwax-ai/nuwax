.PHONY: merge-apf help

SHELL := /bin/bash
.ONESHELL:

# 可配置参数（可通过 make VAR=value 覆盖）
REMOTE ?= origin
DEV_BRANCH ?= dev
APF_BRANCH ?= agent-platform-front
TMP_BRANCH ?= apf-squashed

default: help

help:
	@echo "可用命令:"
	@echo "  make merge-apf \t从 $(REMOTE)/$(APF_BRANCH) 压成单提交并合入 $(DEV_BRANCH) 并推送"
	@echo "可覆盖变量: REMOTE, DEV_BRANCH, APF_BRANCH, TMP_BRANCH"

merge-apf:
	set -euo pipefail
	# 1) 工作区必须干净
	if [[ -n "$(shell git status --porcelain)" ]]; then
		echo "工作区存在未提交修改或未跟踪文件，请先清理/提交后再执行。" >&2
		exit 1
	fi

	# 2) 更新远程
	git fetch $(REMOTE) --prune

	# 3) 准备临时分支（基于远程 $(APF_BRANCH)）
	if git show-ref --verify --quiet refs/heads/$(TMP_BRANCH); then
		git branch -D $(TMP_BRANCH)
	fi
	git switch -c $(TMP_BRANCH) $(REMOTE)/$(APF_BRANCH)

	# 4) 软重置到本地 $(DEV_BRANCH)，把相对差异放入暂存区
	git reset --soft refs/heads/$(DEV_BRANCH)

	# 若无差异则无需提交与合并
	if git diff --cached --quiet; then
		echo "相对于 $(DEV_BRANCH) 无差异，无需合并。"
		git switch $(DEV_BRANCH)
		git branch -D $(TMP_BRANCH)
		exit 0
	fi

	# 5) 创建单一提交
	COMMIT_MSG="squash: merge $(APF_BRANCH) into $(DEV_BRANCH) as a single commit ($$(date -u +'%Y-%m-%dT%H:%M:%SZ'))"
	git commit -m "$$COMMIT_MSG"

	# 6) 回到 $(DEV_BRANCH) 并快进合并
	git switch $(DEV_BRANCH)
	git merge --ff-only $(TMP_BRANCH)

	# 7) 推送到远程
	git push $(REMOTE) $(DEV_BRANCH)

	# 8) 清理临时分支
	git branch -D $(TMP_BRANCH)

	# 9) 输出结果
	LAST_COMMIT=$$(git rev-parse --short HEAD)
	echo "完成: $(REMOTE)/$(APF_BRANCH) 已以单一提交合入 $(DEV_BRANCH) -> $$LAST_COMMIT 并已推送。"


