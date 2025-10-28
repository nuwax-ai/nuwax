import SecondMenuItem from '@/components/base/SecondMenuItem';
import { ECOSYSTEM_MARKET_LIST } from '@/constants/ecosystem.constants';
import { EcosystemMarketEnum } from '@/types/enums/ecosystemMarket';
import React from 'react';
import { history, useLocation, useModel } from 'umi';

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
    <div style={style}>
      {ECOSYSTEM_MARKET_LIST.map((item) => (
        <SecondMenuItem
          key={item.type}
          name={item.text}
          isActive={handleActive(item.type)}
          icon={item.icon}
          onClick={() => handlerApplication(item.type)}
        />
      ))}
    </div>
  );
};
export default SystemSection;
