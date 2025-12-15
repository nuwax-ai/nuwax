import CardWrapper from '@/components/business-component/CardWrapper';
import CustomPopover from '@/components/CustomPopover';
import { ICON_MORE } from '@/constants/images.constants';
import { SKILL_MORE_ACTION } from '@/constants/library.constants';
import type { SkillItemProps } from '@/types/interfaces/library';
import { Button } from 'antd';
import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import SkillStatus from '../SkillStatus';
import styles from './index.less';

const cx = classNames.bind(styles);

// 单个资源组件
const ComponentItem: React.FC<SkillItemProps> = ({
  skillInfo,
  onClick,
  onClickMore,
}) => {
  console.log(skillInfo);

  return (
    <CardWrapper
      title={skillInfo.name}
      // avatar={skillInfo.creatorName}
      avatar={''}
      name={skillInfo.creatorName}
      content={skillInfo.description}
      icon={skillInfo.icon}
      // defaultIcon={info?.defaultImage || ''}
      defaultIcon={''}
      onClick={onClick}
      extra={
        <>
          <span className={cx('text-ellipsis', 'flex-1', styles.time)}>
            最近编辑 {dayjs(skillInfo.modified).format('MM-DD HH:mm')}
          </span>
        </>
      }
      footer={
        <footer className={cx('flex', 'items-center', 'content-between')}>
          {/* 技能状态 */}
          <SkillStatus publishStatus={skillInfo.publishStatus} />
          {/*更多操作*/}
          <CustomPopover list={SKILL_MORE_ACTION} onClick={onClickMore}>
            <Button size="small" type="text" icon={<ICON_MORE />}></Button>
          </CustomPopover>
        </footer>
      }
    />
  );
};

export default ComponentItem;
