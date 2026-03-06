import { Button, Result } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

const NoPermissionPage: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <Result
        status="403"
        title="403"
        subTitle="抱歉，您没有权限访问该页面。"
        extra={
          <Button type="primary" onClick={() => history.push('/')}>
            返回首页
          </Button>
        }
      />
    </div>
  );
};

export default NoPermissionPage;
