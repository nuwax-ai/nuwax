import { dict } from '@/services/i18nRuntime';
import { getDshLauncherBridge } from '@/utils/hostBridge';
import { RobotOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { useEffect, useState } from 'react';
import styles from './DshLauncher.less';

export default function DshLauncher() {
  const [enabled, setEnabled] = useState(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let active = true;
    let refreshing = false;
    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const state = await getDshLauncherBridge()?.getState();
        if (active) setEnabled(state?.enabled === true);
      } catch {
        if (active) setEnabled(false);
      } finally {
        refreshing = false;
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  if (!enabled) return null;

  const open = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const result = await getDshLauncherBridge()?.open();
      if (!result?.ok) throw new Error('DS-Bot unavailable');
    } catch {
      message.error(dict('PC.Common.Global.operationFailed'));
    } finally {
      setOpening(false);
    }
  };

  return (
    <Button
      type="text"
      className={styles.launcher}
      icon={<RobotOutlined />}
      loading={opening}
      onClick={() => void open()}
    >
      DS Bot
    </Button>
  );
}
