import { dict } from '@/services/i18nRuntime';
import { parseAppProRoute } from '@/utils/appProRoute';
import { getWorkbenchBridge } from '@/utils/hostBridge';
import { AppstoreOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { useState } from 'react';
import { useLocation } from 'umi';
import styles from './DshLauncher.less';

export default function WorkbenchLauncher() {
  const location = useLocation();
  const [opening, setOpening] = useState(false);
  const bridge = getWorkbenchBridge();
  const appRoute = parseAppProRoute(location.pathname);
  const conversationId =
    appRoute?.conversationId?.toString() ||
    new URLSearchParams(location.search).get('conversationId');
  if (!bridge || !conversationId || !/^\d+$/.test(conversationId)) return null;

  const open = async () => {
    if (opening) return;
    setOpening(true);
    try {
      const result = await bridge.open(conversationId);
      if (!result.ok) throw new Error(result.error);
    } catch (error) {
      message.error(
        `${dict('PC.Common.Global.operationFailed')}${
          error instanceof Error && error.message ? ` · ${error.message}` : ''
        }`,
      );
    } finally {
      setOpening(false);
    }
  };
  return (
    <Button
      type="text"
      className={styles.launcher}
      icon={<AppstoreOutlined />}
      loading={opening}
      onClick={() => void open()}
    >
      {dict('PC.Workbench.open')}
    </Button>
  );
}
