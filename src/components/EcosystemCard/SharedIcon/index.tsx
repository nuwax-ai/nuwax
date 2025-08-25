import { EcosystemShareStatusEnum } from '@/types/interfaces/ecosystem';
import classNames from 'classnames';
import {
  ICON_EDIT,
  ICON_OFFLINED,
  ICON_PUBLISHED,
  ICON_SEAL,
} from './images.constants';
import styles from './index.less';
const cx = classNames.bind(styles);

/**
 * 分享状态图标
 * @param shareStatus 分享状态
 * @returns 分享状态图标
 */
export default function SharedIcon({
  shareStatus,
}: {
  shareStatus: EcosystemShareStatusEnum;
}) {
  const renderIcon = (shareStatus: EcosystemShareStatusEnum) => {
    switch (shareStatus) {
      case EcosystemShareStatusEnum.PUBLISHED:
        return (
          <div className={cx(styles.container)}>
            <ICON_PUBLISHED />
            <span className={styles.text}>已发布</span>
          </div>
        );
      case EcosystemShareStatusEnum.REVIEWING:
        return (
          <div className={cx(styles.container)}>
            <ICON_SEAL />
            <span className={styles.text}>审核中</span>
          </div>
        );
      case EcosystemShareStatusEnum.OFFLINE:
        return (
          <div className={cx(styles.container)}>
            <ICON_OFFLINED />
            <span className={styles.text}>已下线</span>
          </div>
        );
      case EcosystemShareStatusEnum.DRAFT:
        return (
          <div className={cx(styles.container)}>
            <ICON_EDIT />
            <span className={styles.text}>草稿</span>
          </div>
        );
      case EcosystemShareStatusEnum.REJECTED:
        return (
          <div className={cx(styles.container)}>
            <ICON_SEAL />
            <span className={styles.text}>已驳回</span>
          </div>
        );
      default:
        return null;
    }
  };

  return renderIcon(shareStatus);
}
