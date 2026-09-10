import React, { useEffect, useMemo, useState } from 'react';
import PopupList from './PopupList';
import type {
  FileMentionItem,
  MentionPopupHandle,
  MentionPopupProps,
} from './types';

/** 每次打开获取当前会话文件；输入搜索仅本地过滤，不重复请求。 */
const MentionPopup = React.forwardRef<MentionPopupHandle, MentionPopupProps>(
  (props, ref) => {
    const { visible, onFetchMentionFiles, searchText = '' } = props;
    const [files, setFiles] = useState<FileMentionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    useEffect(() => {
      if (!visible || !onFetchMentionFiles) return;
      let cancelled = false;
      setFiles([]);
      setLoading(true);
      setError(false);
      Promise.resolve()
        .then(onFetchMentionFiles)
        .then((items) => {
          if (!cancelled) setFiles(items);
        })
        .catch(() => {
          if (!cancelled) setError(true);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, [visible, onFetchMentionFiles]);
    // 没有可提及的文件时不弹：打开且无搜索词时列表加载完为空，直接收起
    // （搜索态无结果保留空态提示，不打断用户输入）
    useEffect(() => {
      if (!visible || loading || error || searchText) return;
      if (files.length === 0) {
        props.onClose();
      }
    }, [visible, loading, error, searchText, files, props]);
    const items = useMemo(() => {
      const query = searchText.toLowerCase();
      // 先过滤再截断，确保大列表中的后部文件仍可搜索到。
      return files
        .filter(
          (file) =>
            file.name.toLowerCase().includes(query) ||
            file.relativePath.toLowerCase().includes(query),
        )
        .slice(0, 100);
    }, [files, searchText]);
    return (
      <PopupList
        {...props}
        ref={ref}
        items={items}
        loading={loading}
        error={error}
        onSelect={(item) => {
          if (item.kind === 'file') props.onSelect(item);
        }}
      />
    );
  },
);
export default MentionPopup;
