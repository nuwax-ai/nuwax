import { XModalForm } from '@/components/ProComponents';
import { dict } from '@/services/i18nRuntime';
import { DevPaymentTypeEnum } from '@/types/interfaces/subscription';
import {
  BankFilled,
  CloseOutlined,
  CreditCardOutlined,
} from '@ant-design/icons';
import { Tag } from 'antd';
import cx from 'classnames';
import React from 'react';
import styles from './index.less';

export interface PaymentDetailModalProps {
  open: boolean;
  record: any;
  onCancel: () => void;
}

const PaymentDetailModal: React.FC<PaymentDetailModalProps> = ({
  open,
  record,
  onCancel,
}) => {
  if (!record) return null;

  return (
    <XModalForm
      title={`${dict(
        'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.modalTitle',
      )} - ${record.developerName}`}
      open={open}
      onOpenChange={(v) => !v && onCancel()}
      submitter={{
        render: () => null,
      }}
      width={640}
      className={cx(styles['payment-detail-modal'])}
      modalProps={{
        centered: true,
        closeIcon: <CloseOutlined />,
      }}
    >
      <div className={cx(styles['section-title'])}>
        {dict(
          'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.sectionDevInfo',
        )}
      </div>
      <div className={cx(styles['divider'])} />

      <div className={cx(styles['info-grid'])}>
        <div className={cx(styles['info-item'])}>
          <div className={cx(styles['label'])}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colDeveloperId',
            )}
          </div>
          <div className={cx(styles['value'])}>{record.developerId}</div>
        </div>
        <div className={cx(styles['info-item'])}>
          <div className={cx(styles['label'])}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colEmail',
            )}
          </div>
          <div className={cx(styles['value'])}>{record.email || '-'}</div>
        </div>
        <div className={cx(styles['info-item'])}>
          <div className={cx(styles['label'])}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.settlementMethod',
            )}
          </div>
          <div className={cx(styles['value'])}>
            <Tag color="blue" style={{ borderRadius: 4, padding: '0 8px' }}>
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.settlementManual',
              )}
            </Tag>
          </div>
        </div>
      </div>

      <div className={cx(styles['section-title'])} style={{ marginTop: 32 }}>
        {dict(
          'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.sectionAccountInfo',
        )}
      </div>
      <div className={cx(styles['divider'])} />

      <div className={cx(styles['account-card'])}>
        <div className={cx(styles['card-header'])}>
          <div className={cx(styles['icon-wrapper'])}>
            {record.accountType === DevPaymentTypeEnum.BankCard ? (
              <BankFilled />
            ) : (
              <CreditCardOutlined />
            )}
          </div>
          <div className={cx(styles['title-info'])}>
            <div className={cx(styles['name'])}>
              {record.bankName || record.realName}
            </div>
            <div className={cx(styles['type'])}>
              {record.accountType === DevPaymentTypeEnum.BankCard
                ? dict(
                    'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.typeBankCard',
                  )
                : dict(
                    'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.typeAlipay',
                  )}
            </div>
          </div>
          <Tag className={cx(styles['default-tag'])}>
            {dict(
              'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.tagDefault',
            )}
          </Tag>
        </div>

        <div className={cx(styles['card-grid'])}>
          <div className={cx(styles['grid-item'])}>
            <div className={cx(styles['label'])}>
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colBankName',
              )}
            </div>
            <div className={cx(styles['value'])}>{record.bankName || '-'}</div>
          </div>
          <div className={cx(styles['grid-item'])}>
            <div className={cx(styles['label'])}>
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colAccountNo',
              )}
            </div>
            <div className={cx(styles['value'])}>{record.accountNo}</div>
          </div>
          <div className={cx(styles['grid-item'])}>
            <div className={cx(styles['label'])}>
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colRealName',
              )}
            </div>
            <div className={cx(styles['value'])}>{record.realName}</div>
          </div>
          <div className={cx(styles['grid-item'])}>
            <div className={cx(styles['label'])}>
              {dict(
                'PC.Pages.SystemManagement.PaymentEarnings.DevPayment.colPhone',
              )}
            </div>
            <div className={cx(styles['value'])}>{record.phone || '-'}</div>
          </div>
        </div>
      </div>
    </XModalForm>
  );
};

export default PaymentDetailModal;
