import {
  openLocalFile,
  revealLocalFile,
  type LocalFileReference,
} from '@/features/client-shell/localFileService';
import { t } from '@/services/i18nRuntime';
import { ExportOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { localFileActionErrorKey } from './localFileActionMessages';

/** 只接收已验证的本机引用；在操作入口消费异步失败。 */
export default function LocalFileActions({
  reference,
}: {
  reference?: LocalFileReference;
}) {
  type Job = { key: string; kind: 'open' | 'reveal' };
  const key = reference
    ? JSON.stringify([reference.cId, reference.contextId, reference.path])
    : '';
  const currentKey = useRef(key);
  currentKey.current = key;
  const active = useRef(true);
  const pending = useRef<Job | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  if (!reference) return null;
  const busy = job?.key === key;
  const run = (operation: typeof openLocalFile, kind: Job['kind']) => {
    if (pending.current?.key === key) return;
    const ticket = { key, kind };
    pending.current = ticket;
    setJob(ticket);
    void (async () => {
      try {
        if ((await operation(reference)) === false)
          throw new Error('File action unavailable');
      } catch (error) {
        if (active.current && currentKey.current === ticket.key)
          message.error(t(localFileActionErrorKey(error)));
      } finally {
        // 切换文件后，旧请求不能撤掉新文件的等待状态。
        if (pending.current === ticket) {
          pending.current = null;
          if (active.current) setJob(null);
        }
      }
    })();
  };
  return (
    <>
      <Tooltip
        title={t('PC.Components.FilePreview.openInSystem')}
        trigger={['hover', 'focus']}
      >
        <Button
          type="text"
          aria-label={t('PC.Components.FilePreview.openInSystem')}
          icon={<ExportOutlined />}
          disabled={busy}
          loading={busy && job?.kind === 'open'}
          onClick={() => run(openLocalFile, 'open')}
        />
      </Tooltip>
      <Tooltip
        title={t('PC.Components.FilePreview.revealInFolder')}
        trigger={['hover', 'focus']}
      >
        <Button
          type="text"
          aria-label={t('PC.Components.FilePreview.revealInFolder')}
          icon={<FolderOpenOutlined />}
          disabled={busy}
          loading={busy && job?.kind === 'reveal'}
          onClick={() => run(revealLocalFile, 'reveal')}
        />
      </Tooltip>
    </>
  );
}
