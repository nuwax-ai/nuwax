import { CheckOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Button, Modal } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface AgentMoveProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const AgentMove: React.FC<AgentMoveProps> = ({
  open,
  title,
  onCancel,
  onConfirm,
}) => {
  const [teamId, setTeamId] = useState<number>(0);

  const spaceList = [
    {
      img: 'https://lf6-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736819936&x-signature=aJULoDj7yjvagaC8zjjBp6Ph7ac%3D',
      teamId: 0,
      teamName: '星际争霸',
    },
    {
      img: 'https://lf6-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736819936&x-signature=aJULoDj7yjvagaC8zjjBp6Ph7ac%3D',
      teamId: 1,
      teamName: '魔兽世界',
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <div>
          <span>{`迁移智能体至团队空间 - ${title}`}</span>
          <InfoCircleOutlined />
        </div>
      }
      footer={() => (
        <Button type="primary" block onClick={onConfirm}>
          下一步
        </Button>
      )}
      width={475}
    >
      <div className={cx(styles['analyze-wrapper'])}>
        <div className={cx(styles['row-line'])} />
        <span className={cx(styles.label)}>个人空间</span>
        <div className={cx('flex', 'items-center', styles.box)}>
          <img
            className={cx(styles.img)}
            src="https://lf6-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_ICON/default_bot_icon4.png?lk3s=ca44e09c&x-expires=1736819936&x-signature=aJULoDj7yjvagaC8zjjBp6Ph7ac%3D"
            alt=""
          />
          <span>个人空间</span>
        </div>
        <span className={cx(styles.label)}>选择要迁移到的团队空间</span>
        {spaceList.map((item) => (
          <div
            key={item.teamId}
            className={cx(
              'flex',
              'items-center',
              'hover-box',
              'cursor-pointer',
              styles.box,
            )}
            onClick={() => setTeamId(item.teamId)}
          >
            <img className={cx(styles.img)} src={item.img} alt="" />
            <span className={cx('flex-1')}>{item.teamName}</span>
            {teamId === item.teamId && (
              <CheckOutlined className={cx(styles['selected-ico'])} />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default AgentMove;
