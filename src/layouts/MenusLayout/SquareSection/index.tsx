import ConditionRender from '@/components/ConditionRender';
import {
  ICON_AGENT,
  ICON_PLUGIN_BOLD,
  ICON_WORKFLOW,
} from '@/constants/images.constants';
import SquareMenuItem from '@/layouts/MenusLayout/SquareSection/SquareMenuItem';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { SquareAgentInfo } from '@/types/interfaces/square';
import { getURLParams } from '@/utils/common';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);
/**
 * 广场第二菜单栏
 */
const SquareSection: React.FC = () => {
  const { agentInfoList, pluginInfoList, workflowInfoList } =
    useModel('squareModel');
  // active项
  const [activeKey, setActiveKey] = useState<string>('');
  // menu显隐
  const [visibleMenu, setVisibleMenu] = useState<string>('');

  useEffect(() => {
    const params = getURLParams() as {
      cate_type: string;
      cate_name: string;
    };
    const { cate_type, cate_name } = params;
    setActiveKey(cate_name ?? cate_type);
    // 控制menu显隐
    setVisibleMenu(cate_type);
  }, []);

  const handleClick = (cateType: string, cateName?: string) => {
    setActiveKey(cateName ?? cateType);
    setVisibleMenu(cateType);

    const url = cateName
      ? `/square?cate_type=${cateType}&cate_name=${cateName}`
      : `/square?cate_type=${cateType}`;
    history.push(url);
  };
  return (
    <div className={cx('h-full', 'py-12', 'overflow-y')}>
      <ConditionRender condition={agentInfoList?.length}>
        <div className={cx('py-6 px-6')}>
          <SquareMenuItem
            name="智能体"
            isDown
            icon={<ICON_AGENT />}
            isActive={activeKey === SquareAgentTypeEnum.Agent}
            onClick={() => handleClick(SquareAgentTypeEnum.Agent)}
          />
          <div
            className={cx(styles['box-hidden'], {
              [styles.visible]: visibleMenu === SquareAgentTypeEnum.Agent,
            })}
          >
            {agentInfoList?.map((item: SquareAgentInfo) => (
              <SquareMenuItem
                key={item.name}
                name={item.description}
                isActive={activeKey === item.name}
                onClick={() =>
                  handleClick(SquareAgentTypeEnum.Agent, item.name)
                }
              />
            ))}
          </div>
        </div>
      </ConditionRender>
      <ConditionRender condition={pluginInfoList?.length}>
        <div className={cx('py-6 px-6')}>
          <SquareMenuItem
            name="插件"
            icon={<ICON_PLUGIN_BOLD />}
            isDown
            isActive={activeKey === SquareAgentTypeEnum.Plugin}
            onClick={() => handleClick(SquareAgentTypeEnum.Plugin)}
          />
          <div
            className={cx(styles['box-hidden'], {
              [styles.visible]: visibleMenu === SquareAgentTypeEnum.Plugin,
            })}
          >
            {pluginInfoList?.map((item: SquareAgentInfo) => (
              <SquareMenuItem
                key={item.name}
                name={item.description}
                isActive={activeKey === item.name}
                onClick={() =>
                  handleClick(SquareAgentTypeEnum.Plugin, item.name)
                }
              />
            ))}
          </div>
        </div>
      </ConditionRender>
      <ConditionRender condition={workflowInfoList?.length}>
        <div className={cx('py-6 px-6')}>
          <SquareMenuItem
            name="工作流"
            icon={<ICON_WORKFLOW />}
            isDown
            isActive={activeKey === SquareAgentTypeEnum.Workflow}
            onClick={() => handleClick(SquareAgentTypeEnum.Workflow)}
          />
          <div
            className={cx(styles['box-hidden'], {
              [styles.visible]: visibleMenu === SquareAgentTypeEnum.Workflow,
            })}
          >
            {workflowInfoList?.map((item: SquareAgentInfo) => (
              <SquareMenuItem
                key={item.name}
                name={item.description}
                isActive={activeKey === item.name}
                onClick={() =>
                  handleClick(SquareAgentTypeEnum.Workflow, item.name)
                }
              />
            ))}
          </div>
        </div>
      </ConditionRender>
    </div>
  );
};

export default SquareSection;
