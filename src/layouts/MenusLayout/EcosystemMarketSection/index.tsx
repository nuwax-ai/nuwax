import SecondMenuItem from '@/components/base/SecondMenuItem';
import ConditionRender from '@/components/ConditionRender';
import { ECOSYSTEM_MARKET_LIST } from '@/constants/ecosystem.constants';
import { AgentComponentTypeEnum } from '@/types/enums/agent';
import { EcosystemMarketEnum } from '@/types/enums/ecosystemMarket';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 主页二级菜单栏
 */
const EcosystemMarketSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const location = useLocation();
  const { pathname } = location;
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  // 模板menu显隐，默认打开模板menu
  const [visibleMenu, setVisibleMenu] = useState<boolean>(true);
  // 模板active项
  const [activeKey, setActiveKey] = useState<string>('');

  useEffect(() => {
    const searchParams = location.search;
    if (searchParams) {
      const searchParamsObj = new URLSearchParams(searchParams);
      const targetType = searchParamsObj.get('targetType');
      setActiveKey(targetType || '');
    }
  }, [location]);

  // 点击菜单项
  const handlerApplication = (type: EcosystemMarketEnum) => {
    // 关闭移动端菜单
    handleCloseMobileMenu();
    setActiveKey('');

    switch (type) {
      // MCP
      case EcosystemMarketEnum.MCP:
        history.push('/ecosystem/mcp');
        break;
      // 插件
      case EcosystemMarketEnum.Plugin:
        history.push('/ecosystem/plugin');
        break;
      // 模板
      case EcosystemMarketEnum.Template:
        history.push('/ecosystem/template');
        break;
    }
  };

  // 点击模板列表项
  const handleClickTemplate = (type: AgentComponentTypeEnum) => {
    setActiveKey(type);
    history.push(`/ecosystem/template?targetType=${type}`);
  };

  // 判断是否active
  const handleActive = (type: EcosystemMarketEnum) => {
    return (
      (type === EcosystemMarketEnum.Plugin && pathname.includes('plugin')) ||
      // 如果是模板，且没有搜索参数，则active, 有搜索参数，表示当前页面是模板的子项
      (type === EcosystemMarketEnum.Template &&
        pathname.includes('template') &&
        !location.search) ||
      (type === EcosystemMarketEnum.MCP && pathname.includes('mcp'))
    );
  };

  return (
    <div style={style}>
      {ECOSYSTEM_MARKET_LIST.map((info) => (
        <React.Fragment key={info.type}>
          <SecondMenuItem
            name={info.text}
            isDown={!!info.list?.length}
            isActive={handleActive(info.type)}
            isOpen={visibleMenu}
            icon={info.icon}
            onClick={() => handlerApplication(info.type)}
            onToggle={() => setVisibleMenu(!visibleMenu)}
          />
          {/* 模板列表项 */}
          <ConditionRender condition={!!info.list?.length}>
            <div
              className={cx(styles['box-hidden'], {
                [styles.visible]: visibleMenu,
              })}
            >
              {info.list?.map((item: any) => (
                <SecondMenuItem.SubItem
                  key={item.type}
                  name={item.text}
                  isActive={activeKey === item.type}
                  onClick={() => handleClickTemplate(item.type)}
                />
              ))}
            </div>
          </ConditionRender>
        </React.Fragment>
      ))}
    </div>
  );
};
export default EcosystemMarketSection;
