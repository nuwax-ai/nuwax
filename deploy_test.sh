#!/bin/bash

# 获取当前时间，格式为 yyyyMMddHHmm
# 例如: 202603282004
CURRENT_TIME=$(date "+%Y%m%d%H%M")

echo "开始执行自动化部署流程 - 时间戳: ${CURRENT_TIME}"

# 1. 更新远程 dev 代码
echo ">>> 正在更新 dev 分支..."
git checkout dev
git pull origin dev

# 2. 更新远程 test 代码并合并 dev
echo ">>> 正在更新 test 分支并合并 dev..."
git checkout test
git pull origin test
git merge dev -m "merge: 合并 dev 分支到当前分支"

# 3. 执行生产构建
echo ">>> 正在执行构建: npm run build:prod:m gitlab"
npm run build:prod:m gitlab

# 4. 提交构建产物
echo ">>> 正在提交构建产物..."
git add -f dist
git commit -m "update ${CURRENT_TIME}" --no-verify

# 5. 推送至远程 test
echo ">>> 正在推送至 origin test..."
git push origin test

echo "部署流程执行完毕！"
