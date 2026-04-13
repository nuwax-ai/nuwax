import { dict } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

interface SiteProtocolProps {
  onToggle?: () => void;
}

const SiteProtocol: React.FC<SiteProtocolProps> = ({ onToggle }) => {
  return (
    <div>
      <span className={cx(styles.span, styles.pointer)} onClick={onToggle}>
        {dict('PC.Pages.Login.readAndAgree')}
      </span>
      <a
        href={dict('PC.Pages.Login.userAgreementLink')}
        target="_blank"
        rel="noreferrer"
        className={cx(styles.a)}
      >
        {dict('PC.Pages.Login.serviceAgreement')}
      </a>
      <span className={cx(styles.span)}>{dict('PC.Pages.Login.and')}</span>
      <a
        href={dict('PC.Pages.Login.privacyAgreementLink')}
        target="_blank"
        rel="noreferrer"
        className={cx(styles.a)}
      >
        {dict('PC.Pages.Login.privacyAgreement')}
      </a>
    </div>
  );
};

export default SiteProtocol;
