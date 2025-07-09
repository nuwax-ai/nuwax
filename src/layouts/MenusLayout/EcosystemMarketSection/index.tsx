import { ECOSYSTEM_MARKET_LIST } from '@/constants/ecosystem.constants';
import { EcosystemMarketEnum } from '@/types/enums/ecosystemMarket';
import classNames from 'classnames';
import React from 'react';
import { history, useLocation, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const SystemSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const location = useLocation();
  const { pathname } = location;
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  const handlerApplication = (type: EcosystemMarketEnum) => {
    // 关闭移动端菜单
    handleCloseMobileMenu();

    switch (type) {
      // 插件
      case EcosystemMarketEnum.Plugin:
        history.push('/ecosystem/plugin');
        break;
      // 模板
      case EcosystemMarketEnum.Template:
        history.push('/ecosystem/template');
        break;
      // MCP
      case EcosystemMarketEnum.MCP:
        history.push('/ecosystem/mcp');
        break;
    }
  };

  // 判断是否active
  const handleActive = (type: EcosystemMarketEnum) => {
    return (
      (type === EcosystemMarketEnum.Plugin && pathname.includes('plugin')) ||
      (type === EcosystemMarketEnum.Template &&
        pathname.includes('template')) ||
      (type === EcosystemMarketEnum.MCP && pathname.includes('mcp'))
    );
  };

  return (
    <div className={cx('px-6', 'py-16')} style={style}>
      <h3 className={cx(styles.title)}>生态市场</h3>
      <ul>
        {ECOSYSTEM_MARKET_LIST.map((item) => (
          <li
            key={item.type}
            onClick={() => handlerApplication(item.type)}
            className={cx(
              styles.row,
              'hover-deep',
              'flex',
              'items-center',
              'cursor-pointer',
              { [styles.active]: handleActive(item.type) },
            )}
          >
            {item.icon}
            <span className={cx(styles.text)}>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default SystemSection;
