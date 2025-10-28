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
      <p>
        选择“内网模型”可以把你局域网内的模型通过配置暴露给平台使用，你只需要在内网服务器执行一行命令，即可在下面的接口配置URL中配置你的内网地址
      </p>
      <Button onClick={onOpen}>查看内网服务器执行命令</Button>
      <span className={cx(styles.state)}>当前状态为离线</span>
      <Button type="link">刷新状态</Button>
    </div>
  );
};

export default IntranetModel;
