import { dict } from '@/services/i18nRuntime';
import { Button, Result } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { history } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 403页面组件
 * @description 显示403错误页面，包含图片、提示信息和返回按钮
 */
const LicenseExpiredPage: React.FC = () => {
  return (
    <div className={cx(styles.container)}>
      <Result
        status="403"
        title="403"
        subTitle={dict('PC.Pages.Error403.licenseExpired')}
        extra={
          <Button type="primary" onClick={() => history.push('/')}>
            {dict('PC.Common.Global.backHome')}
          </Button>
        }
      />
    </div>
  );
};

export default LicenseExpiredPage;
