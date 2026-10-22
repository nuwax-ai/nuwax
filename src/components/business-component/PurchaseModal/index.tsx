import { XModalForm } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React from 'react';
import CreditPackageList from './CreditPackageList';
import styles from './index.less';

const cx = classNames.bind(styles);

interface PurchaseModalProps {
  open: boolean;
  onCancel: () => void;
}

/**
 * 增购积分弹窗
 */
const PurchaseModal: React.FC<PurchaseModalProps> = ({ open, onCancel }) => {
  return (
    <XModalForm
      title={dict('PC.Pages.MorePage.MySubscriptions.tabCredits')}
      open={open}
      onOpenChange={(visible) => !visible && onCancel()}
      modalProps={{
        destroyOnHidden: true,
        width: 640,
        centered: true,
      }}
      submitter={{ render: () => null }}
    >
      <div className={cx(styles['purchase-container'])}>
        <div className={cx(styles['modal-subtitle'])}>
          {dict('PC.Pages.MorePage.MySubscriptions.purchaseCreditsSubtitle')}
        </div>
        <CreditPackageList active={open} />
      </div>
    </XModalForm>
  );
};

export default PurchaseModal;
