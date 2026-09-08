import FilePreview from '@/components/business-component/FilePreview';
import {
  FilePathPreviewError,
  loadFilePathPreview,
} from '@/services/filePathPreview';
import { dict } from '@/services/i18nRuntime';
import { FileSearchOutlined } from '@ant-design/icons';
import { Alert, Button, Input, Modal, Space, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';

interface Props {
  conversationId: number;
  sourceId: string;
  currentPath: string;
  customTargetDir?: string;
}

export default function OpenFileByPath({
  conversationId,
  sourceId,
  currentPath,
  customTargetDir,
}: Props) {
  const [open, setOpen] = useState(false);
  const [path, setPath] = useState('');
  const [file, setFile] = useState<File>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const requestRef = useRef<AbortController>();

  const reset = () => {
    requestRef.current?.abort();
    requestRef.current = undefined;
    setOpen(false);
    setFile(undefined);
    setError('');
    setLoading(false);
  };

  useEffect(() => {
    reset();
    return () => requestRef.current?.abort();
  }, [conversationId, sourceId, customTargetDir]);

  const load = async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError('');
    setFile(undefined);
    try {
      const result = await loadFilePathPreview(
        { conversationId, path, customTargetDir },
        controller.signal,
      );
      if (!controller.signal.aborted) setFile(result);
    } catch (cause) {
      if (!controller.signal.aborted) {
        const reason =
          cause instanceof FilePathPreviewError ? cause.reason : 'load';
        setError(dict(`PC.Components.PathPreview.error.${reason}`));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  // 无扩展名的点文件（如 .gitignore）及 .env.* 按文本展示，其他类型由预览器识别。
  const hiddenText =
    file && (/^\.[^.]+$/.test(file.name) || /^\.env\./.test(file.name));
  return (
    <>
      <Button
        type="text"
        size="small"
        icon={<FileSearchOutlined />}
        onClick={() => {
          setPath(currentPath ? `${currentPath}/` : '');
          setOpen(true);
        }}
      >
        {dict('PC.Components.PathPreview.open')}
      </Button>
      <Modal
        open={open}
        title={dict('PC.Components.PathPreview.open')}
        onCancel={reset}
        footer={null}
        width={960}
        destroyOnHidden
      >
        <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
          <Input
            aria-label={dict('PC.Components.PathPreview.path')}
            placeholder={dict('PC.Components.PathPreview.hint')}
            value={path}
            onChange={(event) => setPath(event.target.value)}
            onPressEnter={() => void load()}
          />
          <Button type="primary" loading={loading} onClick={() => void load()}>
            {dict('PC.Components.PathPreview.preview')}
          </Button>
        </Space.Compact>
        {error && <Alert type="error" showIcon message={error} />}
        {loading && <Spin />}
        {file && (
          <FilePreview
            key={`${file.name}-${file.lastModified}`}
            src={file}
            fileType={hiddenText ? 'text' : undefined}
            height="60vh"
            downloadFileName={file.name}
          />
        )}
      </Modal>
    </>
  );
}
