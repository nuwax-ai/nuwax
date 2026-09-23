import SvgIcon from '@/components/base/SvgIcon';
import { ICON_FOLDER } from '@/constants/fileTreeImages.constants';
import { dict } from '@/services/i18nRuntime';
import {
  apiBrowseFsChildren,
  apiBrowseFsRoots,
  apiFsMkdir,
  apiFsRename,
} from '@/services/vncDesktop';
import { getFileIcon } from '@/utils/fileTree';
import {
  addRecentWorkspaceDir,
  loadRecentWorkspaceDirs,
  renameRecentWorkspaceDir,
} from '@/utils/workspaceDirRecent';
import { Button, Input, Modal, Spin, message } from 'antd';
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

/** 目录写操作（默认走 fs/mkdir + fs/rename 网关端点；单测可替换） */
export interface FsDirOps {
  mkdir: (parentPath: string, dirName: string) => Promise<void>;
  rename: (path: string, newName: string) => Promise<void>;
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

/** 目录名合法：非空、非 . / ..、不含路径分隔符（后端契约兜底再拒） */
const isValidDirName = (name: string): boolean =>
  !!name && name !== '.' && name !== '..' && !/[\\/]/.test(name);

/** 由旧绝对路径与新名字拼出改后绝对路径（兼容 posix 与 windows 分隔符） */
const pathWithNewName = (oldPath: string, newName: string): string => {
  const sepIndex = Math.max(
    oldPath.lastIndexOf('/'),
    oldPath.lastIndexOf('\\'),
  );
  return sepIndex >= 0
    ? `${oldPath.slice(0, sepIndex + 1)}${newName}`
    : newName;
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
  /** 写操作注入（默认走 fs/mkdir + fs/rename 网关端点；单测/演示可替换） */
  ops?: FsDirOps;
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

const defaultOps = (sandboxId: string): FsDirOps => ({
  mkdir: async (parentPath, dirName) => {
    const res = await apiFsMkdir({ sandboxId, parentPath, dirName });
    if (!res?.success) throw new Error(res?.message || 'mkdir failed');
  },
  rename: async (path, newName) => {
    const res = await apiFsRename({ sandboxId, path, newName });
    if (!res?.success) throw new Error(res?.message || 'rename failed');
  },
});

/**
 * 工作目录选择弹窗（原型 fspicker 移植，nuwax_desktop.html「选择工作目录」）：
 * 根视图（磁盘/主目录）→ 逐级进入 + 面包屑跳转 + 上一级，目录可进、文件不可选，
 * 取消/使用此文件夹。按绝对路径浏览本机（fs/roots + fs/children，wiki 契约），
 * 仅发起会话/创建项目前使用，当前所在目录即选中目录。
 * 子目录视图支持新建目录（fs/mkdir）与目录重命名（fs/rename），行内输入编辑。
 */
const WorkspaceDirPickerModal: React.FC<WorkspaceDirPickerModalProps> = ({
  open,
  sandboxId,
  onCancel,
  onConfirm,
  browse,
  ops,
}) => {
  // 当前所在目录：'' = 根视图（尚未进入任何目录，不可确认）
  const [currentPath, setCurrentPath] = useState<string>('');
  const [entries, setEntries] = useState<FsDirEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const loadSeqRef = useRef(0);
  // 最近选择的工作目录（根视图顶部快速重选，localStorage 持久化）
  const [recentDirs, setRecentDirs] = useState<string[]>([]);
  // 行内编辑态：新建临时行 / 某行重命名，共用一个草稿输入
  const [creating, setCreating] = useState(false);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [opsBusy, setOpsBusy] = useState(false);
  // 编辑会话序号：导航/切换编辑时递增，让在飞请求的收尾动作失效
  const editSessionRef = useRef(0);

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

  const cancelEdit = useCallback(() => {
    editSessionRef.current += 1;
    setCreating(false);
    setRenamingPath(null);
    setDraftName('');
  }, []);

  // 打开时回到根视图重新加载（弹窗随开随用，每次进入都取最新目录）
  useEffect(() => {
    if (!open) return;
    setCurrentPath('');
    cancelEdit();
    setRecentDirs(loadRecentWorkspaceDirs());
    void load('');
  }, [open, load, cancelEdit]);

  const enterDir = (entry: FsDirEntry) => {
    cancelEdit();
    setCurrentPath(entry.path);
    void load(entry.path);
  };

  const navigateTo = (index: number) => {
    cancelEdit();
    const next = crumbPath(currentPath, index);
    setCurrentPath(next);
    void load(next);
  };

  const goUp = () => {
    if (!currentPath) return;
    cancelEdit();
    const next = parentPath(currentPath);
    setCurrentPath(next);
    void load(next);
  };

  const startCreate = () => {
    editSessionRef.current += 1;
    setRenamingPath(null);
    setDraftName('');
    setCreating(true);
  };

  const startRename = (entry: FsDirEntry) => {
    editSessionRef.current += 1;
    setCreating(false);
    setRenamingPath(entry.path);
    setDraftName(entry.name);
  };

  /** Enter/blur 确认新建或重命名；空名等同取消，非法名提示后保留输入 */
  const confirmEdit = async () => {
    if (opsBusy || (!creating && !renamingPath)) return;
    const session = editSessionRef.current;
    const name = draftName.trim();
    const op = ops ?? defaultOps(sandboxId);
    if (creating) {
      if (!name) {
        cancelEdit();
        return;
      }
      if (!isValidDirName(name)) {
        message.warning(dict('PC.Components.WorkspaceDir.nameInvalid'));
        return;
      }
      setOpsBusy(true);
      try {
        await op.mkdir(currentPath, name);
        if (session !== editSessionRef.current) return;
        cancelEdit();
        void load(currentPath);
      } catch {
        // 业务失败已由全局 errorHandler 提示，保留输入框供改名重试
      } finally {
        setOpsBusy(false);
      }
      return;
    }
    if (!renamingPath) return;
    const prev = entries.find((item) => item.path === renamingPath);
    if (!name || name === prev?.name) {
      cancelEdit();
      return;
    }
    if (!isValidDirName(name)) {
      message.warning(dict('PC.Components.WorkspaceDir.nameInvalid'));
      return;
    }
    setOpsBusy(true);
    try {
      await op.rename(renamingPath, name);
      // 最近目录存绝对路径，改名后前缀同步防失效
      setRecentDirs(
        renameRecentWorkspaceDir(
          renamingPath,
          pathWithNewName(renamingPath, name),
        ),
      );
      if (session !== editSessionRef.current) return;
      cancelEdit();
      void load(currentPath);
    } catch {
      // 同上：全局提示后保留输入
    } finally {
      setOpsBusy(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void confirmEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleConfirm = () => {
    // 记入最近选择（去重置顶），供下次打开快速重选
    setRecentDirs(addRecentWorkspaceDir(currentPath));
    onConfirm(currentPath);
  };

  const crumbs = toCrumbs(currentPath);
  // 展示段去掉根段（原型形态：Users/xx/yy，根由「上一级」回退）
  const displayCrumbs = crumbs.slice(1).map((name, index) => ({
    name,
    crumbIndex: index + 1,
  }));
  // 仅根视图展示最近选择（进入目录后让位给子项列表）
  const showRecent =
    !currentPath && !loading && !error && recentDirs.length > 0;
  // 新建/重命名只在子目录视图可用（根视图无合法 parentPath，盘符/home 不可改名）
  const canOperate = !!currentPath;

  const renderEditInput = (placeholderKey: string) => (
    <Input
      className={cx(styles['row-input'])}
      autoFocus
      value={draftName}
      disabled={opsBusy}
      placeholder={dict(placeholderKey)}
      onChange={(e) => setDraftName(e.target.value)}
      onKeyDown={handleEditKeyDown}
      onBlur={() => void confirmEdit()}
      onFocus={(e) => e.currentTarget.select()}
    />
  );

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={600}
      destroyOnHidden
      title={
        <div className={cx(styles.header)}>
          <ICON_FOLDER className={cx(styles['header-icon'])} />
          <span className={cx(styles['header-title'])}>
            {dict('PC.Components.WorkspaceDir.pickerTitle')}
          </span>
          <span className={cx(styles['header-path'])} title={currentPath}>
            {currentPath.replace(/^\//, '')}
          </span>
        </div>
      }
      styles={{
        content: { borderRadius: 16 },
        body: { paddingTop: 8 },
      }}
    >
      <div className={cx(styles.toolbar)}>
        <button
          type="button"
          className={cx(styles['up-button'])}
          disabled={!currentPath || loading}
          onClick={goUp}
        >
          <SvgIcon name="icons-common-caret_left" style={{ fontSize: 16 }} />
          {dict('PC.Components.WorkspaceDir.parentLevel')}
        </button>
        {canOperate && (
          <button
            type="button"
            className={cx(styles['action-button'])}
            disabled={loading || opsBusy}
            onClick={startCreate}
          >
            <SvgIcon name="icons-common-plus" style={{ fontSize: 14 }} />
            {dict('PC.Components.WorkspaceDir.newFolder')}
          </button>
        )}
        <div className={cx(styles['breadcrumb-box'])}>
          {displayCrumbs.map(({ name, crumbIndex }, index) => (
            <React.Fragment key={crumbIndex}>
              {index > 0 && <span className={cx(styles['crumb-sep'])}>/</span>}
              <span
                className={cx(styles['crumb-item'], {
                  [styles['crumb-current']]: crumbIndex === crumbs.length - 1,
                })}
                onClick={() => navigateTo(crumbIndex)}
              >
                {name}
              </span>
            </React.Fragment>
          ))}
        </div>
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
              icon={
                <SvgIcon name="icons-common-refresh" style={{ fontSize: 14 }} />
              }
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
                      <ICON_FOLDER />
                    </span>
                    <span className={cx(styles['row-name'])}>{dir}</span>
                    <SvgIcon
                      name="icons-common-caret_right"
                      className={cx(styles['row-arrow'])}
                      style={{ fontSize: 14 }}
                    />
                  </div>
                ))}
              </div>
            )}
            {creating && (
              <div className={cx(styles.row, styles['row-editing'])}>
                <span className={cx(styles['row-icon'])}>
                  <ICON_FOLDER />
                </span>
                {renderEditInput(
                  'PC.Components.WorkspaceDir.newFolderPlaceholder',
                )}
              </div>
            )}
            {entries.length === 0 && !showRecent && !creating ? (
              <div className={cx(styles.state)}>
                {dict('PC.Components.WorkspaceDir.emptyDir')}
              </div>
            ) : (
              entries.map((entry) => {
                const isRenaming = renamingPath === entry.path;
                return (
                  <div
                    key={entry.path}
                    className={cx(styles.row, {
                      [styles['row-file']]: !entry.isDir,
                      [styles['row-editing']]: isRenaming,
                    })}
                    onClick={
                      entry.isDir && !isRenaming
                        ? () => enterDir(entry)
                        : undefined
                    }
                    title={entry.path}
                  >
                    <span className={cx(styles['row-icon'])}>
                      {entry.isHome ? (
                        <SvgIcon
                          name="icons-nav-home"
                          style={{ fontSize: 18 }}
                        />
                      ) : entry.isDir ? (
                        <ICON_FOLDER />
                      ) : (
                        getFileIcon(entry.name)
                      )}
                    </span>
                    {isRenaming ? (
                      renderEditInput(
                        'PC.Components.WorkspaceDir.renamePlaceholder',
                      )
                    ) : (
                      <>
                        <span className={cx(styles['row-name'])}>
                          {entry.name}
                        </span>
                        {canOperate && entry.isDir && (
                          <button
                            type="button"
                            className={cx(styles['row-action'])}
                            title={dict('PC.Components.WorkspaceDir.rename')}
                            aria-label={dict(
                              'PC.Components.WorkspaceDir.rename',
                            )}
                            disabled={opsBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(entry);
                            }}
                          >
                            <SvgIcon
                              name="icons-common-edit"
                              style={{ fontSize: 14 }}
                            />
                          </button>
                        )}
                        {entry.isDir && (
                          <SvgIcon
                            name="icons-common-caret_right"
                            className={cx(styles['row-arrow'])}
                            style={{ fontSize: 14 }}
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })
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
