# 使用 Node.js 作为基础镜像
#FROM node:22
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/node:22.10.0


# 设置工作目录
WORKDIR /app

# 复制项目文件到容器中
COPY . .
# 安装项目依赖
RUN rm -rf ./node_modules
RUN npm cache clean --force

RUN echo "安装依赖start==="
RUN npm install -g cnpm --registry=https://registry.npmmirror.com
RUN cnpm install -g yarn
RUN yarn install --registry=https://registry.npmmirror.com
RUN echo "安装依赖end==="

# 构建前端应用
ENV NODE_ENV=production
RUN yarn build:prod

# 使用 Nginx 作为服务器
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/nginx:latest
WORKDIR /usr/share/nginx/html

# 复制 Nginx 配置模板文件
COPY ./k8s/default.conf.template /etc/nginx/conf.d/default.conf.template

COPY --from=0 /app/dist .

## 使用环境变量替换模板中的变量,这里修改对应域名
ENV SERVER_NAME=p1-front.space.com
ENV URI_NAME='$uri'
RUN envsubst '${SERVER_NAME},${URI_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf


# 暴露 80 端口
EXPOSE 80
EXPOSE 443

# 启动 Nginx
CMD nginx -g 'daemon off;'