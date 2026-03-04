import SecondMenuItem from '@/components/base/SecondMenuItem';
import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import { getSquareTemplateSegmentedList } from '@/constants/square.constants';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import {
  SquareAgentInfo,
  SquareMenuComponentInfo,
} from '@/types/interfaces/square';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useLocation, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 广场第二菜单栏
 */
const SquareSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const location = useLocation();
  const { agentInfoList, pageAppInfoList, pluginInfoList, workflowInfoList } =
    useModel('squareModel');
  // 获取租户配置信息
  const { tenantConfigInfo } = useModel('tenantConfigInfo');

  // 模板模式下，目标类型tabs
  const templateListTabs = getSquareTemplateSegmentedList(
    tenantConfigInfo?.enabledSandbox,
  ).map((item) => ({
    name: item.value,
    description: item.label,
  }));

  // active项
  const [activeKey, setActiveKey] = useState<string>('');
  // 第二级active项
  const [secondActiveKey, setSecondActiveKey] = useState<string>('');
  // menu显隐
  const [visibleMenu, setVisibleMenu] = useState<string>('');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cateType = params.get('cate_type') || '';
    const cateName = params.get('cate_name') || '';

    // 设置active项
    setActiveKey(cateType);
    setSecondActiveKey(cateName);
    // 控制menu显隐
    setVisibleMenu(cateType);
  }, [location]);

  const handleClick = (cateType: string, cateName?: string) => {
    // 关闭移动端菜单
    handleCloseMobileMenu();
    // 设置active项
    setActiveKey(cateType);
    setSecondActiveKey(cateName || '');

    // 控制menu显隐
    setVisibleMenu(cateType);

    const url = cateName
      ? `/square?cate_type=${cateType}&cate_name=${cateName}`
      : `/square?cate_type=${cateType}`;
    history.push(url);
  };

  const handleToggle = (info: SquareMenuComponentInfo) => {
    if (visibleMenu === info.type) {
      setVisibleMenu('');
    } else {
      setVisibleMenu(info.type);
    }
  };

  // 菜单列表
  const dataSource = [
    {
      name: '智能体',
      icon: <SvgIcon name="icons-nav-stars" />,
      list: agentInfoList,
      type: SquareAgentTypeEnum.Agent,
    },
    {
      name: '网页应用',
      icon: <SvgIcon name="icons-common-console" />,
      list: pageAppInfoList,
      type: SquareAgentTypeEnum.PageApp,
    },
    {
      name: '插件',
      icon: <SvgIcon name="icons-nav-plugins" />,
      list: pluginInfoList,
      type: SquareAgentTypeEnum.Plugin,
    },
    {
      name: '工作流',
      icon: <SvgIcon name="icons-nav-workflow" />,
      list: workflowInfoList,
      type: SquareAgentTypeEnum.Workflow,
    },
    {
      name: '模板',
      icon: <SvgIcon name="icons-nav-template" />,
      list: templateListTabs,
      type: SquareAgentTypeEnum.Template,
    },
  ];

  return (
    <div
      className={cx('h-full', 'overflow-y', 'flex flex-col gap-4')}
      style={style}
    >
      {dataSource.map((info: SquareMenuComponentInfo, index) => (
        <ConditionRender key={index} condition={info.list?.length}>
          <SecondMenuItem
            name={info.name}
            isDown
            icon={info.icon}
            isActive={activeKey === info.type && !secondActiveKey}
            isOpen={visibleMenu === info.type}
            onClick={() => handleClick(info.type)}
            onToggle={() => handleToggle(info)}
          />
          <div
            className={cx('flex flex-col gap-4', styles['box-hidden'], {
              [styles.visible]: visibleMenu === info.type,
            })}
          >
            {info.list?.map((item: SquareAgentInfo) => (
              <SecondMenuItem.SubItem
                key={item.name}
                name={item.description}
                className={cx(styles.subItem)}
                isActive={
                  activeKey === info.type && secondActiveKey === item.name
                }
                onClick={() => handleClick(info.type, item.name)}
              />
            ))}
          </div>
        </ConditionRender>
      ))}
    </div>
  );
};

export default SquareSection;
