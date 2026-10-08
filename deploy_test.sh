#!/bin/bash
set -euo pipefail

# 固定在仓库根目录执行，避免从其他目录直接运行时 git/npm 落错位置
cd "$(dirname "$0")"

# 获取当前时间，格式为 yyyyMMddHHmm
# 例如: 202603282004
CURRENT_TIME=$(date "+%Y%m%d%H%M")

echo "开始执行自动化部署流程 - 时间戳: ${CURRENT_TIME}"

# 1. 更新远程 dev 代码
echo ">>> 正在更新 dev 分支..."
git checkout dev
git pull origin dev
# 接入乾坤（qiankun）微前端后分支携带子模块 gitlink（repo-web / im），
# 切分支后子模块目录可能为空或停留在旧提交，按 gitlink 初始化对齐
git submodule update --init --recursive

# 2. 更新远程 test 代码并合并 dev
echo ">>> 正在更新 test 分支并合并 dev..."
git checkout test
git pull origin test
git merge dev -X ours -m "merge: 合并 dev 分支到当前分支（冲突以本地 test 为准）"
# 合并可能改写 gitlink，再次对齐；构建前置钩子 upgrade:micro-apps 要求
# 子模块「已初始化 + HEAD 等于 gitlink + 工作区干净」，否则报子模块未初始化
git submodule update --init --recursive

# 3. 执行生产构建（DIST_RETENTION=1：构建后保留上版旧哈希资源，防发版后旧页面 404）
echo ">>> 正在执行构建: npm run build:prod:m gitlab"
DIST_RETENTION=1 npm run build:prod:m gitlab

# 4. 提交构建产物
# 构建链路 upgrade:micro-apps 会把子模块 gitlink 与 adapter.json 的升级
# 暂存进 index，随本次 dist 提交一并发布，保证 test 分支 pin 与产物一致
echo ">>> 正在提交构建产物..."
git add -f dist
if git diff --cached --quiet; then
  echo ">>> dist 无变化，跳过提交与推送"
else
  git commit -m "update ${CURRENT_TIME}" --no-verify

  # 5. 推送至远程 test
  echo ">>> 正在推送至 origin test..."
  git push origin test
fi

echo "部署流程执行完毕！"
