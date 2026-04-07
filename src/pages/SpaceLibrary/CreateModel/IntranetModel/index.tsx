import { dict } from '@/services/i18nRuntime';
import type { IntranetModelProps } from '@/types/interfaces/library';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 内网模型
 */
const IntranetModel: React.FC<IntranetModelProps> = ({ onOpen }) => {
  return (
    <div className={cx(styles['internal-network'])}>
      <p>{dict('PC.Pages.SpaceLibrary.IntranetModel.description')}</p>
      <Button onClick={onOpen}>
        {dict('PC.Pages.SpaceLibrary.IntranetModel.viewCommand')}
      </Button>
      <span className={cx(styles.state)}>
        {dict('PC.Pages.SpaceLibrary.IntranetModel.offlineStatus')}
      </span>
      <Button type="link">
        {dict('PC.Pages.SpaceLibrary.IntranetModel.refreshStatus')}
      </Button>
    </div>
  );
};

export default IntranetModel;
