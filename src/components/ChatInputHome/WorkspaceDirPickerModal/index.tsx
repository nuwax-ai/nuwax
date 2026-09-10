import { dict } from '@/services/i18nRuntime';
import { apiBrowseFsChildren, apiBrowseFsRoots } from '@/services/vncDesktop';
import {
  addRecentWorkspaceDir,
  loadRecentWorkspaceDirs,
} from '@/utils/workspaceDirRecent';
import {
  FileOutlined,
  FolderOutlined,
  HomeOutlined,
  LeftOutlined,
  RedoOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { Breadcrumb, Button, Modal, Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** 目录条目（弹窗内部统一形态：roots 视图与逐级子项共用） */
export interface FsDirEntry {
  name: string;
  /** 绝对路径（roots 视图为根路径，子项视图由服务端回传） */
  path: string;
  isDir: boolean;
  /** 主目录快捷入口（仅根视图出现） */
  isHome?: boolean;
}

/**
 * 面包屑分段：兼容 posix 与 windows 分隔符；'' → [根]；'/Users/apple' → ['/', 'Users', 'apple']
 */
const toCrumbs = (path: string): string[] => {
  if (!path) return ['/'];
  const segs = path.split(/[\\/]+/).filter(Boolean);
  const isWinDrive = /^[a-zA-Z]:$/.test(path.slice(0, 2));
  return isWinDrive ? [path.slice(0, 2), ...segs.slice(1)] : ['/', ...segs];
};

/** 由绝对路径还原点击面包屑第 index 段时的路径；index 0 = 根视图（''） */
const crumbPath = (path: string, index: number): string => {
  if (index <= 0) return '';
  const crumbs = toCrumbs(path);
  const segs = crumbs.slice(1, index + 1);
  const sep = /^[a-zA-Z]:$/.test(crumbs[0]) ? '\\' : '/';
  return crumbs[0] === '/'
    ? `/${segs.join('/')}`
    : [crumbs[0], ...segs].join(sep);
};

/** 上一级路径；已是顶层（'/xx' 或盘符）时回根视图（''） */
const parentPath = (path: string): string => {
  const crumbs = toCrumbs(path);
  if (crumbs.length <= 2) return '';
  return crumbPath(path, crumbs.length - 2);
};

interface WorkspaceDirPickerModalProps {
  open: boolean;
  sandboxId: string;
  onCancel: () => void;
  /** 「使用此文件夹」：返回所选目录的绝对路径 */
  onConfirm: (absolutePath: string) => void;
  /**
   * 数据源注入（默认走 fs/roots + fs/children 网关端点；单测/演示可替换）。
   * path 为空串表示取根视图（含 home 快捷项），否则取该绝对路径下的一层子项。
   */
  browse?: (path: string) => Promise<FsDirEntry[]>;
}

const defaultBrowse = async (
  path: string,
  sandboxId: string,
): Promise<FsDirEntry[]> => {
  if (!path) {
    const res = await apiBrowseFsRoots(sandboxId);
    if (!res?.success) throw new Error(res?.message || 'load failed');
    const list: FsDirEntry[] = (res.data?.roots ?? [])
      .filter((item) => item.isDir)
      .map((item) => ({ name: item.name, path: item.path, isDir: true }));
    const home = res.data?.home;
    if (home && !list.some((item) => item.path === home)) {
      list.push({
        name: dict('PC.Components.WorkspaceDir.homeDir'),
        path: home,
        isDir: true,
        isHome: true,
      });
    }
    return list;
  }
  const res = await apiBrowseFsChildren(path, sandboxId);
  if (!res?.success) throw new Error(res?.message || 'load failed');
  return (res.data?.entries ?? []).map((item) => ({
    name: item.name,
    path: item.path,
    isDir: item.isDir,
  }));
};

/**
 * 工作目录选择弹窗（原型 fspicker 移植，nuwax_desktop.html「选择工作目录」）：
 * 根视图（磁盘/主目录）→ 逐级进入 + 面包屑跳转 + 上一级，目录可进、文件不可选，
 * 取消/使用此文件夹。按绝对路径浏览本机（fs/roots + fs/children，wiki 契约），
 * 仅发起会话/创建项目前使用，当前所在目录即选中目录。
 */
const WorkspaceDirPickerModal: React.FC<WorkspaceDirPickerModalProps> = ({
  open,
  sandboxId,
  onCancel,
  onConfirm,
  browse,
}) => {
  // 当前所在目录：'' = 根视图（尚未进入任何目录，不可确认）
  const [currentPath, setCurrentPath] = useState<string>('');
  const [entries, setEntries] = useState<FsDirEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loadSeqRef = useRef(0);
  // 最近选择的工作目录（根视图顶部快速重选，localStorage 持久化）
  const [recentDirs, setRecentDirs] = useState<string[]>([]);

  const load = useCallback(
    async (nextPath: string) => {
      const seq = ++loadSeqRef.current;
      setLoading(true);
      setError(false);
      try {
        const fetcher =
          browse ?? ((path: string) => defaultBrowse(path, sandboxId));
        const list = await fetcher(nextPath);
        if (seq !== loadSeqRef.current) return; // 竞态丢弃
        // 隐藏项不进弹窗（fs/children 会返回点开头文件，由前端决定展示）
        setEntries(list.filter((item) => !item.name.startsWith('.')));
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

  // 打开时回到根视图重新加载（弹窗随开随用，每次进入都取最新目录）
  useEffect(() => {
    if (!open) return;
    setCurrentPath('');
    setRecentDirs(loadRecentWorkspaceDirs());
    void load('');
  }, [open, load]);

  const enterDir = (entry: FsDirEntry) => {
    setCurrentPath(entry.path);
    void load(entry.path);
  };

  const navigateTo = (index: number) => {
    const next = crumbPath(currentPath, index);
    setCurrentPath(next);
    void load(next);
  };

  const goUp = () => {
    if (!currentPath) return;
    const next = parentPath(currentPath);
    setCurrentPath(next);
    void load(next);
  };

  const handleConfirm = () => {
    // 记入最近选择（去重置顶），供下次打开快速重选
    setRecentDirs(addRecentWorkspaceDir(currentPath));
    onConfirm(currentPath);
  };

  const crumbs = toCrumbs(currentPath);
  // 仅根视图展示最近选择（进入目录后让位给子项列表）
  const showRecent =
    !currentPath && !loading && !error && recentDirs.length > 0;

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
          <span className={cx(styles['header-path'])} title={currentPath}>
            {currentPath}
          </span>
        </div>
      }
      styles={{ body: { paddingTop: 12 } }}
    >
      <div className={cx(styles.toolbar)}>
        <Button
          size="small"
          icon={<LeftOutlined />}
          disabled={!currentPath || loading}
          onClick={goUp}
        >
          {dict('PC.Components.WorkspaceDir.parentLevel')}
        </Button>
        <Breadcrumb
          className={cx(styles.breadcrumb)}
          items={crumbs.map((name, index) => ({
            title: name,
            onClick: () => navigateTo(index),
          }))}
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
              onClick={() => void load(currentPath)}
            >
              {dict('PC.Components.WorkspaceDir.reload')}
            </Button>
          </div>
        ) : (
          <>
            {showRecent && (
              <div className={cx(styles['recent-section'])}>
                <div className={cx(styles['recent-title'])}>
                  {dict('PC.Components.WorkspaceDir.recent')}
                </div>
                {recentDirs.map((dir) => (
                  <div
                    key={dir}
                    className={cx(styles.row)}
                    onClick={() =>
                      enterDir({ name: dir, path: dir, isDir: true })
                    }
                    title={dir}
                  >
                    <span className={cx(styles['row-icon'])}>
                      <FolderOutlined />
                    </span>
                    <span className={cx(styles['row-name'])}>{dir}</span>
                    <RightOutlined className={cx(styles['row-arrow'])} />
                  </div>
                ))}
              </div>
            )}
            {entries.length === 0 && !showRecent ? (
              <div className={cx(styles.state)}>
                {dict('PC.Components.WorkspaceDir.emptyDir')}
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.path}
                  className={cx(styles.row, {
                    [styles['row-file']]: !entry.isDir,
                  })}
                  onClick={entry.isDir ? () => enterDir(entry) : undefined}
                  title={entry.path}
                >
                  <span className={cx(styles['row-icon'])}>
                    {entry.isHome ? (
                      <HomeOutlined />
                    ) : entry.isDir ? (
                      <FolderOutlined />
                    ) : (
                      <FileOutlined />
                    )}
                  </span>
                  <span className={cx(styles['row-name'])}>{entry.name}</span>
                  {entry.isDir && (
                    <RightOutlined className={cx(styles['row-arrow'])} />
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      <div className={cx(styles.footer)}>
        <Button onClick={onCancel}>{dict('PC.Common.Global.cancel')}</Button>
        <Button
          type="primary"
          disabled={!currentPath || loading}
          onClick={handleConfirm}
        >
          {dict('PC.Components.WorkspaceDir.useThisFolder')}
        </Button>
      </div>
    </Modal>
  );
};

export default WorkspaceDirPickerModal;
