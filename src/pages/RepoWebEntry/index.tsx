import { t } from '@/services/i18nRuntime';
import { Spin } from 'antd';
import classNames from 'classnames';
import React, { useEffect } from 'react';

/**
 * 资料库（nuwax-repo-web）稳定入口。
 * @description 整页重定向到同域子应用 `/repo/`（构建产物由 `npm run sync:repo-web`
 * 同步到 public/repo/）。本路由 path 属集成契约的一部分，永不变更——将来若切换为
 * 布局内嵌方案，仅替换本页实现；契约细节见 docs/repo-web-integration.md。
 */
const RepoWebEntry: React.FC = () => {
  useEffect(() => {
    window.location.replace('/repo/');
  }, []);

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
