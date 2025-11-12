# GitLab 源配置说明

本文档说明如何配置和使用 GitLab 作为项目的远程仓库源。

## 仓库信息

- **GitLab 地址**: `https://git.yichamao.com/agent-platform/nuwax.git`
- **GitHub 地址** (origin): `https://github.com/nuwax-ai/nuwax`

## 配置步骤

### 1. 添加 GitLab 远程源

如果项目中还没有配置 GitLab 远程源，可以通过以下命令添加：

```bash
# 添加 GitLab 远程源，命名为 gitlab
git remote add gitlab https://git.yichamao.com/agent-platform/nuwax.git
```

### 2. 验证远程源配置

查看所有已配置的远程源：

```bash
# 查看所有远程源
git remote -v
```

预期输出应该包含：

```
gitlab    https://git.yichamao.com/agent-platform/nuwax.git (fetch)
gitlab    https://git.yichamao.com/agent-platform/nuwax.git (push)
origin    https://github.com/nuwax-ai/nuwax (fetch)
origin    https://github.com/nuwax-ai/nuwax (push)
```

### 3. 修改现有 GitLab 远程源

如果 GitLab 远程源已存在但需要修改地址：

```bash
# 修改 gitlab 远程源的 URL
git remote set-url gitlab https://git.yichamao.com/agent-platform/nuwax.git
```

## 常用操作

### 推送到 GitLab

```bash
# 推送当前分支到 GitLab
git push gitlab <branch-name>

# 推送所有分支到 GitLab
git push gitlab --all

# 推送标签到 GitLab
git push gitlab --tags

# 推送当前分支并设置上游分支
git push -u gitlab <branch-name>
```

**示例**：

```bash
# 推送 main 分支到 GitLab
git push gitlab main

# 推送 dev 分支到 GitLab
git push gitlab dev
```

### 从 GitLab 拉取代码

```bash
# 从 GitLab 拉取指定分支
git fetch gitlab <branch-name>

# 从 GitLab 拉取所有分支
git fetch gitlab

# 从 GitLab 拉取并合并到当前分支
git pull gitlab <branch-name>
```

**示例**：

```bash
# 从 GitLab 拉取 main 分支
git fetch gitlab main

# 合并 GitLab 的 main 分支到本地
git merge gitlab/main
```

### 查看 GitLab 分支

```bash
# 查看 GitLab 的所有分支
git branch -r | grep gitlab

# 查看所有远程分支（包括 GitLab 和 GitHub）
git branch -a
```

### 切换分支并跟踪 GitLab 分支

```bash
# 切换到指定分支并跟踪 GitLab 的对应分支
git checkout -b <local-branch> gitlab/<remote-branch>

# 或者如果本地分支已存在
git checkout <local-branch>
git branch --set-upstream-to=gitlab/<remote-branch> <local-branch>
```

## 双远程源工作流程

由于项目同时配置了 GitHub (origin) 和 GitLab (gitlab) 两个远程源，你可以根据需要选择推送到哪个远程源。

### 同时推送到两个远程源

```bash
# 方法 1: 分别推送
git push origin <branch-name>
git push gitlab <branch-name>

# 方法 2: 使用脚本一次性推送
git push origin <branch-name> && git push gitlab <branch-name>
```

### 设置默认推送目标

如果你希望默认推送到 GitLab，可以修改分支的上游分支：

```bash
# 设置当前分支的上游分支为 GitLab
git branch --set-upstream-to=gitlab/<branch-name> <branch-name>

# 之后可以直接使用 git push，会自动推送到 GitLab
git push
```

## 认证配置

### HTTPS 认证

如果使用 HTTPS 方式，GitLab 会要求输入用户名和密码（或 Personal Access Token）。

**推荐使用 Personal Access Token**：

1. 登录 GitLab: `https://git.yichamao.com`
2. 进入 **Settings** → **Access Tokens**
3. 创建新的 Personal Access Token，勾选 `write_repository` 权限
4. 使用 Token 作为密码进行推送

### SSH 认证（推荐）

使用 SSH 方式可以避免每次输入密码：

1. **生成 SSH 密钥**（如果还没有）：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. **添加 SSH 公钥到 GitLab**：

```bash
# 复制公钥内容
cat ~/.ssh/id_ed25519.pub
```

3. 在 GitLab 中进入 **Settings** → **SSH Keys**，粘贴公钥

4. **修改远程源为 SSH 地址**：

```bash
git remote set-url gitlab git@git.yichamao.com:agent-platform/nuwax.git
```

## 常见问题

### 1. 如何删除 GitLab 远程源？

```bash
git remote remove gitlab
```

### 2. 如何重命名远程源？

```bash
# 将 gitlab 重命名为 gitlab-backup
git remote rename gitlab gitlab-backup
```

### 3. 推送时提示权限不足

- 检查 GitLab 账号是否有仓库的写入权限
- 确认使用的是 Personal Access Token 而不是密码
- 如果使用 SSH，确认 SSH 密钥已添加到 GitLab

### 4. 如何查看远程源的详细信息？

```bash
# 查看 gitlab 远程源的详细信息
git remote show gitlab
```

### 5. 如何同步两个远程源的代码？

```bash
# 从 GitHub 拉取最新代码
git fetch origin

# 从 GitLab 拉取最新代码
git fetch gitlab

# 合并两个远程源的更新
git merge origin/main gitlab/main
```

## 配置文件说明

Git 远程源配置保存在 `.git/config` 文件中，相关配置如下：

```ini
[remote "gitlab"]
    url = https://git.yichamao.com/agent-platform/nuwax.git
    fetch = +refs/heads/*:refs/remotes/gitlab/*
```

你也可以直接编辑 `.git/config` 文件来修改配置，但不推荐手动编辑，建议使用 `git remote` 命令。

## 最佳实践

1. **使用 SSH 认证**：更安全且无需每次输入密码
2. **明确推送目标**：在团队协作时，明确约定使用哪个远程源
3. **定期同步**：保持两个远程源的代码同步，避免冲突
4. **分支管理**：为不同远程源使用不同的分支命名规范（可选）

## 相关命令速查

```bash
# 查看远程源
git remote -v

# 添加远程源
git remote add <name> <url>

# 删除远程源
git remote remove <name>

# 修改远程源 URL
git remote set-url <name> <new-url>

# 重命名远程源
git remote rename <old-name> <new-name>

# 查看远程源详细信息
git remote show <name>

# 推送到指定远程源
git push <remote> <branch>

# 从指定远程源拉取
git fetch <remote>
git pull <remote> <branch>
```

## 参考链接

- [GitLab 官方文档](https://docs.gitlab.com/)
- [Git 远程仓库文档](https://git-scm.com/book/zh/v2/Git-基础-远程仓库的使用)
- [GitLab Personal Access Tokens](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
