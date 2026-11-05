import { dict } from '@/services/i18nRuntime';
import { getQrLoginEntryRedirect } from '@/utils/qrLoginEntry';
import { Result, Spin } from 'antd';
import { useEffect, useState } from 'react';

export default function QrLoginEntry() {
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    const target = getQrLoginEntryRedirect(window.location.href);
    if (target && target !== window.location.href) {
      try {
        window.location.replace(target);
      } catch {
        setInvalid(true);
      }
    } else setInvalid(true);
  }, []);
  return invalid ? (
    <Result status="warning" title={dict('PC.Pages.Login.qrLoadFailed')} />
  ) : (
    <Spin fullscreen />
  );
}
