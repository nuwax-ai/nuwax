import ConditionRender from '@/components/ConditionRender';
import classNames from 'classnames';
import type { PropsWithChildren } from 'react';
import React from 'react';
import { useModel } from 'umi';
import styles from './index.less';
const cx = classNames.bind(styles);

const BasicLayout: React.FC<PropsWithChildren> = ({ children }) => {
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  return (
    <div className={cx(styles.container)}>
      <div className={cx(styles['left-box'])}>
        <div className={cx(styles.icon)}>
          <ConditionRender condition={!!tenantConfigInfo?.siteLogo}>
            <img
              src={tenantConfigInfo?.siteLogo}
              className={cx(styles.logo)}
              alt=""
            />
          </ConditionRender>
        </div>
        <div className={cx(styles['left-title-box'])}>
          {/*<p>轻松构建部署您</p>*/}
          {/*<p className={cx(styles.title)}>私有的 Agentic AI 解决方案</p>*/}
          {/*<p className={cx(styles['sub-title'])}>*/}
          {/*  提供完善的工作流、插件开发能力，RAG*/}
          {/*  知识库与数据表存储能力，MCP接入以及开放能力*/}
          {/*</p>*/}

          <p
            className={cx(styles.title, styles['flex-item'])}
            dangerouslySetInnerHTML={{
              __html: tenantConfigInfo?.loginPageText,
            }}
          />
          <p
            className={cx(styles['sub-title'], styles['flex-item'])}
            dangerouslySetInnerHTML={{
              __html: tenantConfigInfo?.loginPageSubText,
            }}
          />
        </div>
      </div>
      <div className={cx(styles['right-box'])}>{children}</div>
    </div>
  );
};

export default BasicLayout;
