import ConditionRender from '@/components/ConditionRender';
import SquareMenuItem from '@/layouts/MenusLayout/SquareSection/SquareMenuItem';
import { SquareAgentTypeEnum } from '@/types/enums/square';
import { getURLParams } from '@/utils/common';
import { AppstoreOutlined, SettingOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';
import { history, useModel } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);
/**
 * 广场第二菜单栏
 */
const SquareSection: React.FC = () => {
  const { agentInfoList, pluginInfoList } = useModel('squareModel');
  // active项
  const [activeKey, setActiveKey] = useState<string>(localStorage.getItem('ActiveKey') || '');
  // menu显隐
  const [visibleMenu, setVisibleMenu] = useState<string>(localStorage.getItem('VisibleMenu') || '');

  useEffect(() => {
    const params = getURLParams();
    const { cate_type, cate_name } = params;
    setActiveKey(cate_name ?? cate_type);
    // 控制menu显隐
    setVisibleMenu(cate_type);
  }, []);

  const handleClick = (cateType: string, cateName?: string) => {
    localStorage.setItem('ActiveKey', cateName ?? cateType)
    localStorage.setItem('VisibleMenu', cateType)

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
            icon={<AppstoreOutlined />}
            isActive={activeKey === SquareAgentTypeEnum.Agent}
            onClick={() => handleClick(SquareAgentTypeEnum.Agent)}
          />
          <div
            className={cx(styles['box-hidden'], {
              [styles.visible]: visibleMenu === SquareAgentTypeEnum.Agent,
            })}
          >
            {agentInfoList?.map((item) => (
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
            isDown
            icon={<SettingOutlined />}
            isActive={activeKey === SquareAgentTypeEnum.Plugin}
            onClick={() => handleClick(SquareAgentTypeEnum.Plugin)}
          />
          <div
            className={cx(styles['box-hidden'], {
              [styles.visible]: visibleMenu === SquareAgentTypeEnum.Plugin,
            })}
          >
            {pluginInfoList?.map((item) => (
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
    </div>
  );
};

export default SquareSection;
