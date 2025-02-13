import TooltipIcon from '@/components/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import { AgentComponentInfo } from '@/types/interfaces/agent';
import { DeleteOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PluginListProps {
  list: AgentComponentInfo[];
  onSet: () => void;
  onDel: () => void;
}

const PluginList: React.FC<PluginListProps> = ({ list, onSet, onDel }) => {
  return !list?.length ? (
    <p>
      插件能够让智能体调用外部
      API，例如搜索信息、浏览网页、生成图片等，扩展智能体的能力和使用场景。
    </p>
  ) : (
    <div className={cx('flex', 'flex-col', styles['plugin-list-container'])}>
      {list.map((item) => (
        <div
          key={item.id}
          className={cx('flex', 'items-center', styles['plugin-box'])}
        >
          <img className={cx('radius-6', styles.img)} src={item.icon} alt="" />
          <div className={cx('flex-1', 'overflow-hide')}>
            <span
              className={cx('text-ellipsis', 'w-full', styles['p-name'])}
            >{`${item.name}`}</span>
            <p className={cx('text-ellipsis', styles['p-desc'])}>
              {item.description}
            </p>
          </div>
          <div className={cx(styles['extra-box'], 'flex', 'items-center')}>
            <TooltipIcon
              title="设置"
              icon={
                <ICON_SETTING
                  className={cx('cursor-pointer', styles.icon)}
                  onClick={onSet}
                />
              }
            />
            <TooltipIcon
              title="删除"
              icon={
                <DeleteOutlined
                  className={cx('cursor-pointer', styles.icon)}
                  onClick={onDel}
                />
              }
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default PluginList;
