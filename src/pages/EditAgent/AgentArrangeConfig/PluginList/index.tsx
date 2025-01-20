import TooltipIcon from '@/components/TooltipIcon';
import { ICON_SETTING } from '@/constants/images.constants';
import { DeleteOutlined } from '@ant-design/icons';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PluginListProps {
  // todo 待修改类型
  list: any[];
  onSet: () => void;
  onDel: () => void;
}

const PluginList: React.FC<PluginListProps> = ({ list, onSet, onDel }) => {
  return (
    <div className={cx('flex', 'flex-col', styles['plugin-list-container'])}>
      {list.map((item) => (
        <div
          key={item.id}
          className={cx('flex', 'items-center', styles['plugin-box'])}
        >
          <img className={cx('radius-6', styles.img)} src={item.img} alt="" />
          <div className={cx('flex-1', 'overflow-hide')}>
            <span
              className={cx('text-ellipsis', 'w-full', styles['p-name'])}
            >{`${item.pluginName} / ${item.pluginEsName}`}</span>
            <p className={cx('text-ellipsis', styles['p-desc'])}>{item.desc}</p>
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
