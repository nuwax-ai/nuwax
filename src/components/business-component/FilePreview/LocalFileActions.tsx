import {
  openLocalFile,
  revealLocalFile,
  type LocalFileReference,
} from '@/features/client-shell/localFileService';
import { t } from '@/services/i18nRuntime';
import { ExportOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { Button, message, Tooltip } from 'antd';

/** 只接收已验证的本机引用；在操作入口消费异步失败。 */
export default function LocalFileActions({
  reference,
}: {
  reference?: LocalFileReference;
}) {
  if (!reference) return null;
  const run = (operation: typeof openLocalFile) => {
    void operation(reference).catch((error) =>
      message.error(error instanceof Error ? error.message : String(error)),
    );
  };
  return (
    <>
      <Tooltip title={t('PC.Components.FilePreview.openInSystem')}>
        <Button
          type="text"
          aria-label={t('PC.Components.FilePreview.openInSystem')}
          icon={<ExportOutlined />}
          onClick={() => run(openLocalFile)}
        />
      </Tooltip>
      <Tooltip title={t('PC.Components.FilePreview.revealInFolder')}>
        <Button
          type="text"
          aria-label={t('PC.Components.FilePreview.revealInFolder')}
          icon={<FolderOpenOutlined />}
          onClick={() => run(revealLocalFile)}
        />
      </Tooltip>
    </>
  );
}
