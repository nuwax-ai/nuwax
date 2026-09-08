import { dict } from '@/services/i18nRuntime';
import { apiBrowseSandboxDirectory } from '@/services/vncDesktop';
import {
  FileOutlined,
  FolderOutlined,
  LeftOutlined,
  RedoOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 目录条目（服务端单层返回，见 StaticFileInfo；此处只消费浏览所需字段） */
export interface SandboxDirEntry {
  name: string;
  isDir: boolean;
}

/** 相对路径 → 展示绝对路径：'' → '/'；'Users/foo' → '/Users/foo' */
const toAbsolutePath = (segments: string[]): string =>
  `/${segments.filter(Boolean).join('/')}`;

interface WorkspaceDirPickerModalProps {
  open: boolean;
  /** 当前选中的个人电脑 sandboxId（首页环境选择器的值） */
  sandboxId: string;
  onCancel: () => void;
  /** 「使用此文件夹」：返回所选目录的绝对路径 */
  onConfirm: (absolutePath: string) => void;
  /** 数据源注入（默认走 apiBrowseSandboxDirectory；单测/演示可替换） */
  browse?: (relativePath: string) => Promise<SandboxDirEntry[]>;
}

/**
 * 工作目录选择弹窗（原型 fspicker 移植，nuwax_desktop.html「选择工作目录」）：
 * 上一级 + 面包屑逐级跳转 + 目录列表（目录可进、文件不可选）+ 取消/使用此文件夹。
 * 仅首页（发起会话前）使用，当前所在目录即选中目录（与原型一致）。
 */
const WorkspaceDirPickerModal: React.FC<WorkspaceDirPickerModalProps> = ({
  open,
  sandboxId,
  onCancel,
  onConfirm,
  browse,
}) => {
  // 路径栈：index 0 为根（''）；当前所在目录 = 栈顶
  const [segments, setSegments] = useState<string[]>([]);
  const [entries, setEntries] = useState<SandboxDirEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loadSeqRef = useRef(0);

  const absolutePath = useMemo(() => toAbsolutePath(segments), [segments]);

  const load = useCallback(
    async (nextSegments: string[]) => {
      const seq = ++loadSeqRef.current;
      setLoading(true);
      setError(false);
      try {
        const fetcher =
          browse ??
          (async (rel: string) => {
            const res = await apiBrowseSandboxDirectory({
              sandboxId,
              relativePath: rel,
            });
            if (!res?.success) throw new Error(res?.message || 'load failed');
            return (res.data?.files ?? []).map((item) => ({
              name: item.name,
              isDir: item.isDir,
            }));
          });
        const list = await fetcher(nextSegments.join('/'));
        if (seq !== loadSeqRef.current) return; // 竞态丢弃
        setEntries(list);
      } catch {
        if (seq !== loadSeqRef.current) return;
        setError(true);
        setEntries([]);
      } finally {
        if (seq === loadSeqRef.current) setLoading(false);
      }
    },
    [browse, sandboxId],
  );

  // 打开时回到根目录重新加载；sandboxId 变化同样重置（Home 侧弹窗常驻、随开随用）
  useEffect(() => {
    if (!open) return;
    setSegments([]);
    void load([]);
  }, [open, sandboxId, load]);

  const enterDir = (name: string) => {
    const next = [...segments, name];
    setSegments(next);
    void load(next);
  };

  const navigateTo = (index: number) => {
    const next = segments.slice(0, index + 1);
    setSegments(next);
    void load(next);
  };

  const goUp = () => {
    if (segments.length === 0) return;
    const next = segments.slice(0, -1);
    setSegments(next);
    void load(next);
  };

  const handleConfirm = () => {
    onConfirm(absolutePath);
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden
      title={
        <div className={cx(styles.header)}>
          <FolderOutlined className={cx(styles['header-icon'])} />
          <span className={cx(styles['header-title'])}>
            {dict('PC.Components.WorkspaceDir.pickerTitle')}
          </span>
          <span className={cx(styles['header-path'])} title={absolutePath}>
            {absolutePath}
          </span>
        </div>
      }
      styles={{ body: { paddingTop: 12 } }}
    >
      <div className={cx(styles.toolbar)}>
        <Button
          size="small"
          icon={<LeftOutlined />}
          disabled={segments.length === 0 || loading}
          onClick={goUp}
        >
          {dict('PC.Components.WorkspaceDir.parentLevel')}
        </Button>
        <Breadcrumb
          className={cx(styles.breadcrumb)}
          items={[
            {
              title: '/',
              onClick: () => navigateTo(0),
            },
            ...segments.map((name, index) => ({
              title: name,
              onClick: () => navigateTo(index),
            })),
          ]}
        />
      </div>

      <div className={cx(styles.body)}>
        {loading ? (
          <div className={cx(styles.state)}>
            <Spin />
          </div>
        ) : error ? (
          <div className={cx(styles.state)}>
            <Button
              size="small"
              icon={<RedoOutlined />}
              onClick={() => void load(segments)}
            >
              {dict('PC.Components.WorkspaceDir.reload')}
            </Button>
          </div>
        ) : entries.length === 0 ? (
          <div className={cx(styles.state)}>
            {dict('PC.Components.WorkspaceDir.emptyDir')}
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.name}
              className={cx(styles.row, { [styles['row-file']]: !entry.isDir })}
              onClick={entry.isDir ? () => enterDir(entry.name) : undefined}
              title={entry.name}
            >
              <span className={cx(styles['row-icon'])}>
                {entry.isDir ? <FolderOutlined /> : <FileOutlined />}
              </span>
              <span className={cx(styles['row-name'])}>{entry.name}</span>
              {entry.isDir && (
                <RightOutlined className={cx(styles['row-arrow'])} />
              )}
            </div>
          ))
        )}
      </div>

      <div className={cx(styles.footer)}>
        <Button onClick={onCancel}>{dict('PC.Common.Global.cancel')}</Button>
        <Button type="primary" onClick={handleConfirm}>
          {dict('PC.Components.WorkspaceDir.useThisFolder')}
        </Button>
      </div>
    </Modal>
  );
};

export default WorkspaceDirPickerModal;
