import agentImage from '@/assets/images/agent_image.png';
import ConditionRender from '@/components/ConditionRender';
import { PermissionsEnum } from '@/types/enums/common';
import { FormOutlined, LeftOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { history, useParams } from 'umi';
import styles from './index.less';

const cx = classNames.bind(styles);

// 技能详情顶部header组件
export interface SkillHeaderProps {
  skillInfo?: any;
  onEditAgent: () => void;
  onPublish: () => void;
}

/**
 * 技能详情顶部header
 */
const SkillHeader: React.FC<SkillHeaderProps> = ({
  skillInfo,
  onEditAgent,
  onPublish,
}) => {
  const { spaceId } = useParams();

  // 发布按钮是否禁用
  const disabledBtn = useMemo(() => {
    if (skillInfo) {
      return !skillInfo?.permissions?.includes(PermissionsEnum.Publish);
    } else {
      return false;
    }
  }, [skillInfo]);

  return (
    <header className={cx('flex', 'items-center', 'relative', styles.header)}>
      <Button
        type="text"
        icon={<LeftOutlined />}
        onClick={() => {
          history.push(`/space/${spaceId}/skill-manage`);
        }}
      />
      <img
        className={cx(styles.avatar)}
        src={skillInfo?.icon || (agentImage as string)}
        alt=""
      />
      <div
        className={cx(
          'flex',
          'flex-col',
          'items-center',
          styles['header-info'],
        )}
      >
        <h3 className={cx(styles['h-title'], 'text-ellipsis')}>
          {skillInfo?.name}
        </h3>

        <div className={cx('flex', 'items-center', styles['rel-info'])}>
          <ConditionRender condition={skillInfo?.icon}>
            <img src={skillInfo?.icon} alt="" />
          </ConditionRender>
        </div>

        <FormOutlined
          className={cx(styles['edit-ico'])}
          onClick={onEditAgent}
        />
      </div>
      <div className={cx(styles['right-box'], 'flex', 'items-center')}>
        <Button
          type="primary"
          className={cx(styles['publish-btn'])}
          onClick={onPublish}
          disabled={disabledBtn}
        >
          发布
        </Button>
      </div>
    </header>
  );
};

export default SkillHeader;
