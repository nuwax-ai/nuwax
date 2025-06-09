import ConditionRender from '@/components/ConditionRender';
import {
  ICON_AGENT,
  ICON_PLUGIN_BOLD,
  ICON_TEMPLATE,
  ICON_WORKFLOW_SQUARE,
} from '@/constants/images.constants';
import SquareMenuItem from '@/layouts/MenusLayout/SquareSection/SquareMenuItem';
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
  }, [params]);

  const handleClick = (cateType: string, cateName?: string) => {
    setActiveKey(cateName ?? cateType);
    setVisibleMenu(cateType);

    const url = cateName
      ? `/square?cate_type=${cateType}&cate_name=${cateName}`
      : `/square?cate_type=${cateType}`;
    history.push(url);
  };

  // 菜单列表
  const dataSource = [
    {
      name: '智能体',
      icon: <ICON_AGENT />,
      list: agentInfoList,
      type: SquareAgentTypeEnum.Agent,
    },
    {
      name: '插件',
      icon: <ICON_PLUGIN_BOLD />,
      list: pluginInfoList,
      type: SquareAgentTypeEnum.Plugin,
    },
    {
      name: '工作流',
      icon: <ICON_WORKFLOW_SQUARE />,
      list: workflowInfoList,
      type: SquareAgentTypeEnum.Workflow,
    },
    {
      name: '模板',
      icon: <ICON_TEMPLATE />,
      list: templateList,
      type: SquareAgentTypeEnum.Template,
    },
  ];

  return (
    <div className={cx('h-full', 'py-16', 'overflow-y')} style={style}>
      {dataSource.map((info: SquareMenuComponentInfo, index) => (
        <ConditionRender key={index} condition={info.list?.length}>
          <div className={cx('py-6 px-6')}>
            <SquareMenuItem
              name={info.name}
              isDown
              icon={info.icon}
              isActive={activeKey === info.type}
              onClick={() => handleClick(info.type)}
            />
            <div
              className={cx(styles['box-hidden'], {
                [styles.visible]: visibleMenu === info.type,
              })}
            >
              {info.list?.map((item: SquareAgentInfo) => (
                <SquareMenuItem
                  key={item.name}
                  name={item.description}
                  isActive={activeKey === item.name}
                  onClick={() => handleClick(info.type, item.name)}
                />
              ))}
            </div>
          </div>
        </ConditionRender>
      ))}
    </div>
  );
};

export default SquareSection;
