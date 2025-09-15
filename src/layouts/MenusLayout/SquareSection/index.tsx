import SecondMenuItem from '@/components/base/SecondMenuItem';
import SvgIcon from '@/components/base/SvgIcon';
import ConditionRender from '@/components/ConditionRender';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import {
  SquareAgentInfo,
  SquareMenuComponentInfo,
} from '@/types/interfaces/square';
import { getURLParams } from '@/utils/common';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

/**
 * 广场第二菜单栏
 */
const SquareSection: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const { agentInfoList, pluginInfoList, workflowInfoList, templateList } =
    useModel('squareModel');
  // active项
  const [activeKey, setActiveKey] = useState<string>('');
  // menu显隐
  const [visibleMenu, setVisibleMenu] = useState<string>('');
  // 关闭移动端菜单
  const { handleCloseMobileMenu } = useModel('layout');

  // url search参数
  const params = getURLParams() as {
    cate_type: string;
    cate_name: string;
  };

  useEffect(() => {
    const { cate_type, cate_name } = params;
    setActiveKey(cate_name ?? cate_type);
    // 控制menu显隐
    setVisibleMenu(cate_type);
  }, []);

  const handleClick = (cateType: string, cateName?: string) => {
    setActiveKey(cateName ?? cateType);
    if (visibleMenu) {
      setVisibleMenu(visibleMenu === cateType ? '' : cateType);
    } else {
      setVisibleMenu(cateType);
    }
    // 关闭移动端菜单
    handleCloseMobileMenu();

    const url = cateName
      ? `/square?cate_type=${cateType}&cate_name=${cateName}`
      : `/square?cate_type=${cateType}`;
    history.push(url);
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
      list: templateList,
      type: SquareAgentTypeEnum.Template,
    },
  ];

  return (
    <div className={cx('h-full', 'overflow-y')} style={style}>
      {dataSource.map((info: SquareMenuComponentInfo, index) => (
        <ConditionRender key={index} condition={info.list?.length}>
          <SecondMenuItem
            name={info.name}
            isDown
            isFirst={index === 0}
            icon={info.icon}
            isActive={activeKey === info.type}
            isOpen={visibleMenu === info.type}
            onClick={() => handleClick(info.type)}
          />
          <div
            className={cx(styles['box-hidden'], {
              [styles.visible]: visibleMenu === info.type,
            })}
          >
            {info.list?.map((item: SquareAgentInfo) => (
              <SecondMenuItem.SubItem
                key={item.name}
                name={item.description}
                isActive={activeKey === item.name}
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
