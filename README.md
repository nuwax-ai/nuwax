# README

`@umijs/max` 模板项目，更多功能参考 [Umi Max 简介](https://umijs.org/docs/max/introduce)

# agent-platform-front

## Getting started

使用 yarn 安装运行

```shell
yarn install
yarn dev
```

## Description

智能体前端

## 容器

- 需要本地安装 docker，并启动一个 k8s 单点集群，比如使用 podman 容器运行;
- 需要本地安装 devspace，参考：https://devspace.sh/cli/docs/getting-started/installation
- 需要本地安装 kubectl

### devspace 本地部署

本地容器 CI/CD 部署，参考：https://www.devspace.sh/ 进行安装使用

devspace 安装后，执行以下命令，在容器里启动，模拟生产环境运行

```shell
devspace dev
```

使用镜像部署到本地的 k8s 单点集群里

```shell
devspace deploy  --force-purge
```

## Usage

### docker 容器构建

```bash
 docker buildx build --platform linux/amd64 --load --build-arg SERVER_NAME=devagent-platform.xspace.com -t agent-nginx -f Dockerfile .

docker run -it --rm --platform linux/amd64 agent-nginx

```

本地临时启动容器

```shell
docker run -it --rm  -p 9099:80 --platform linux/amd64 agent-nginx
```
