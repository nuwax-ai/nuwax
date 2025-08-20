import { EcosystemShareStatusEnum } from '@/types/interfaces/ecosystem';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

interface EcoShareStatusProps {
  status: EcosystemShareStatusEnum;
}

const EcoShareStatusMap = {
  [EcosystemShareStatusEnum.DRAFT]: {
    title: '草稿',
  },
  [EcosystemShareStatusEnum.REVIEWING]: {
    title: '审核中',
  },
  [EcosystemShareStatusEnum.PUBLISHED]: {
    title: '已发布',
  },
  [EcosystemShareStatusEnum.OFFLINE]: {
    title: '已下线',
  },
  [EcosystemShareStatusEnum.REJECTED]: {
    title: '已驳回',
  },
};

/**
 * 生态市场分享状态
 * @param status 状态
 * @returns
 */
const EcoShareStatus: React.FC<EcoShareStatusProps> = ({ status }) => {
  const { title } = EcoShareStatusMap[status];

  return <div className={cx(styles.container)}>{title}</div>;
};

export default EcoShareStatus;
