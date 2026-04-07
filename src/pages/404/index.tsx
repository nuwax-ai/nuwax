import { dict } from '@/services/i18nRuntime';
import { Button, Result } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 404页面组件
 * @description 显示404错误页面，包含图片、提示信息和返回按钮
 */
const Index: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <Result
        status="404"
        title="404"
        subTitle={dict('PC.Pages.Error404.pageNotFound')}
        extra={
          <Button type="primary" onClick={() => history.push('/')}>
            {dict('PC.Common.Global.backHome')}
          </Button>
        }
      />
    </div>
  );
};

export default Index;
