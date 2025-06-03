import SharedRelease from '@/assets/ecosystem/shared-release.png';
import { EcosystemShareStatusEnum } from '@/types/interfaces/ecosystem';
// import SharedDraft from '@/assets/ecosystem/shared-draft.png';
import SharedOffline from '@/assets/ecosystem/shared-offline.png';
import SharedReviewing from '@/assets/ecosystem/shared-reviewing.png';
import { Image } from 'antd';
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
        return <Image preview={false} src={SharedRelease} alt="已发布" />;
      case EcosystemShareStatusEnum.REVIEWING:
        return <Image preview={false} src={SharedReviewing} alt="审核中" />;
      case EcosystemShareStatusEnum.OFFLINE:
        return <Image preview={false} src={SharedOffline} alt="已下线" />;
      case EcosystemShareStatusEnum.DRAFT:
        return '草稿';
      case EcosystemShareStatusEnum.REJECTED:
        return '驳回';
      default:
        return null;
    }
  };
  return <div className={cx(styles.sharedIcon)}>{renderIcon(shareStatus)}</div>;
}
