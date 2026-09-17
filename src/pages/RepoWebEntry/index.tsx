import { ACCESS_TOKEN } from '@/constants/home.constants';
import { useNavigate } from '@umijs/max';
import { t } from '@/services/i18nRuntime';
import { Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';

/**
 * 资料库（nuwax-repo-web）稳定入口。
 * @description SPA 跳转到 qiankun 布局内嵌路由 `/repo/*`（路由侧经 microApp 挂载子应用）。
 * 本路由 path 属集成契约的一部分，永不变更——形态切换仅替换本页实现（v0 为整页重定向，
 * 现为 qiankun 内嵌跳转）；契约细节见 docs/repo-web-integration.md。
 */
const RepoWebEntry: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // dev 桥：dev 下主应用登录走跨域绝对地址（BASE_URL），后端 set-cookie 的 ticket
    // 落不到本地域，而 ticket 与登录 token 等值（见契约 §2.2）——把 token 镜像成同源
    // cookie 供子应用携带。生产 BASE_URL 为空（登录同源、cookie 由后端原生种植），不介入。
    if (process.env.BASE_URL) {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        document.cookie = `ticket=${token}; path=/`;
      }
    }
    navigate('/repo', { replace: true });
  }, [navigate]);

  return (
    <div
      className={classNames(
        'flex',
        'h-full',
        'w-full',
        'flex-col',
        'items-center',
        'justify-center',
      )}
      style={{ gap: 12 }}
    >
      <Spin />
      <span>{t('PC.Pages.RepoWeb.entering')}</span>
    </div>
  );
};

export default RepoWebEntry;
