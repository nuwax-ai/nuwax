import {
  CaretRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  LeftOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PluginHeaderProps {
  onToggleHistory: () => void;
  onTryRun: () => void;
}

/**
 * 测试插件头部组件
 */
const PluginHeader: React.FC<PluginHeaderProps> = ({
  onToggleHistory,
  onTryRun,
}) => {
  const handleBack = () => {
    history.back();
  };
  return (
    <header className={cx('flex', 'items-center', 'w-full', styles.header)}>
      <LeftOutlined
        className={cx(styles['icon-back'], 'cursor-pointer')}
        onClick={handleBack}
      />
      <img
        className={cx(styles.logo)}
        src="https://p26-flow-product-sign.byteimg.com/tos-cn-i-13w3uml6bg/ce8728aa91f74acbb7f5ddfd7dd7e861~tplv-13w3uml6bg-resize:128:128.image?rk3s=2e2596fd&x-expires=1740130702&x-signature=o423VSb8q%2F%2BZonW0xW9wIXZRi8Y%3D"
        alt=""
      />
      <section
        className={cx(
          'flex-1',
          'flex',
          'flex-col',
          'content-between',
          styles.section,
        )}
      >
        <div className={cx('flex', styles['plugin-top'])}>
          <h3 className={cx(styles['plugin-name'])}>测试插件</h3>
          <EditOutlined className={cx('cursor-pointer', 'hover-box')} />
          <CheckCircleOutlined className={cx(styles.circle)} />
        </div>
        <div className={cx(styles['plugin-bottom'], 'flex', 'items-center')}>
          <span className={cx(styles.box)}>http</span>
          <span className={cx(styles.box)}>未发布</span>
          <span className={cx(styles['update-time'])}>
            配置自动保存于17:06:32
          </span>
        </div>
      </section>
      <ClockCircleOutlined
        className={cx(styles.history, 'cursor-pointer')}
        onClick={onToggleHistory}
      />
      <Button
        className={cx(styles['try-btn'])}
        type="primary"
        icon={<CaretRightOutlined />}
        onClick={onTryRun}
      >
        试运行
      </Button>
      <Button type="primary">发布</Button>
    </header>
  );
};

export default PluginHeader;
