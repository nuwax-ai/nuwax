import { EcosystemShareStatusEnum } from '@/types/interfaces/ecosystem';
// import SharedDraft from '@/assets/ecosystem/shared-draft.png';
import classNames from 'classnames';
import styles from './index.less';
const cx = classNames.bind(styles);
export default function SharedIcon({
  shareStatus,
}: {
  shareStatus: EcosystemShareStatusEnum;
}) {
  const renderIcon = (shareStatus: EcosystemShareStatusEnum) => {
    switch (shareStatus) {
      case EcosystemShareStatusEnum.PUBLISHED:
        return <span style={{ color: 'green' }}>已发布</span>;
      case EcosystemShareStatusEnum.REVIEWING:
        return <span style={{ color: 'red' }}>审核中</span>;
      case EcosystemShareStatusEnum.OFFLINE:
        return <span>已下线</span>;
      case EcosystemShareStatusEnum.DRAFT:
        return <span>草稿</span>;
      case EcosystemShareStatusEnum.REJECTED:
        return <span style={{ color: 'red' }}>已驳回</span>;
      default:
        return <span>未知</span>;
    }
  };
  return <div className={cx(styles.sharedIcon)}>{renderIcon(shareStatus)}</div>;
}
