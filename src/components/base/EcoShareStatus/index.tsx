import { dict } from '@/services/i18nRuntime';
import { EcosystemShareStatusEnum } from '@/types/interfaces/ecosystem';
import classNames from 'classnames';
import styles from './index.less';

const cx = classNames.bind(styles);

interface EcoShareStatusProps {
  status: EcosystemShareStatusEnum;
}

const EcoShareStatusMap = {
  [EcosystemShareStatusEnum.DRAFT]: {
    title: dict('PC.Components.EcoShareStatus.draft'),
  },
  [EcosystemShareStatusEnum.REVIEWING]: {
    title: dict('PC.Components.EcoShareStatus.reviewing'),
  },
  [EcosystemShareStatusEnum.PUBLISHED]: {
    title: dict('PC.Components.EcoShareStatus.published'),
  },
  [EcosystemShareStatusEnum.OFFLINE]: {
    title: dict('PC.Components.EcoShareStatus.offline'),
  },
  [EcosystemShareStatusEnum.REJECTED]: {
    title: dict('PC.Components.EcoShareStatus.rejected'),
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
