import personal from '@/assets/images/personal.png';
import { CheckOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Divider } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PersonalSpaceContentType {
  onCreateTeam: () => void;
}

const PersonalSpaceContent: React.FC<PersonalSpaceContentType> = ({
  onCreateTeam,
}) => {
  return (
    <div className={styles.container}>
      <div className={cx(styles['p-header'], 'flex')}>
        <CheckOutlined className={styles.icon} />
        <img
          className={cx(styles.img, 'radius-6')}
          src={personal as string}
          alt=""
        />
        <span className={cx('flex-1', styles.title)}>个人空间</span>
      </div>
      <Divider className={styles['divider']} />
      <div className={cx(styles['p-footer'])}>
        <span className={cx(styles['team-title'])}>团队</span>
        <ul>
          <li className={cx(styles['team-info'], 'flex', 'items-center')}>
            <img
              className={cx(styles['team-logo'])}
              src="https://lf6-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_SPACE/team.png?lk3s=68e6b6b5&x-expires=1736421344&x-signature=feRn%2FUKrlhov%2FGKxCGf8b4r69w4%3D"
              alt=""
            />
            <span className={cx('text-ellipsis')}>第二空间</span>
          </li>
          <li className={cx(styles['team-info'], 'flex', 'items-center')}>
            <img
              className={cx(styles['team-logo'])}
              src="https://lf6-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_SPACE/team.png?lk3s=68e6b6b5&x-expires=1736421344&x-signature=feRn%2FUKrlhov%2FGKxCGf8b4r69w4%3D"
              alt=""
            />
            <span className={cx('text-ellipsis')}>盗梦空间</span>
          </li>
          <li className={cx(styles['team-info'], 'flex', 'items-center')}>
            <img
              className={cx(styles['team-logo'])}
              src="https://lf6-appstore-sign.oceancloudapi.com/ocean-cloud-tos/FileBizType.BIZ_BOT_SPACE/team.png?lk3s=68e6b6b5&x-expires=1736421344&x-signature=feRn%2FUKrlhov%2FGKxCGf8b4r69w4%3D"
              alt=""
            />
            <span className={cx('text-ellipsis')}>成都花舞人间</span>
          </li>
        </ul>
        <div
          className={cx(styles['create-team'], 'flex', 'cursor-pointer')}
          onClick={onCreateTeam}
        >
          <PlusCircleOutlined />
          <span className={cx('flex-1', 'text-ellipsis')}>创建新团队</span>
        </div>
      </div>
    </div>
  );
};

export default PersonalSpaceContent;
