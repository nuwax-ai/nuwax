import CopyIconButton from '@/components/base/CopyIconButton';
import SvgIcon from '@/components/base/SvgIcon';
import FilePreview from '@/components/business-component/FilePreview';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { t } from '@/services/i18nRuntime';
import { apiGetStaticFileList } from '@/services/vncDesktop';
import { Button, Spin } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

export interface ExternalFilePreviewProps {
  /** 会话 ID（沙箱定位） */
  cId: number;
  /** 锚定根目录（沙箱家目录绝对路径） */
  targetDir: string;
  /** 相对 targetDir 的文件路径（如 Desktop/a.md） */
  relativePath: string;
  /** 返回工作区文件树预览（缺省时不渲染返回入口） */
  onBack?: () => void;
  className?: string;
}

/**
 * 工作区外沙箱文件独立预览面板（V2 工具渲染文件徽标点击的新链路）：
 * 以 customTargetDir 锚定沙箱家目录、列出文件所在一层目录换取 fileProxyUrl，
 * 交 FilePreview 按类型渲染。
 * 注意：网关当前仅个人电脑会话放行 customTargetDir，云端会话放开为后端契约，
 * 未放开或文件不存在（含隐藏文件，file-server 列目录不回隐藏项）时呈现失败态。
 * 本面板整块顶替文件树面板（文件树/终端/云电脑均不可见），故须由 onBack
 * 给出一条回到工作区文件树的显式出口。
 */
const ExternalFilePreview: React.FC<ExternalFilePreviewProps> = ({
  cId,
  targetDir,
  relativePath,
  onBack,
  className,
}) => {
  const [loading, setLoading] = useState(false);
  const [fileProxyUrl, setFileProxyUrl] = useState('');
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    // 列目录取文件代理地址：条目名相对 targetDir，故按完整 relativePath 匹配
    const segments = relativePath.split('/');
    segments.pop();
    const parentDir = segments.join('/');
    setLoading(true);
    setFailed(false);
    setFileProxyUrl('');
    try {
      const response = await apiGetStaticFileList(cId, {
        relativePath: parentDir,
        recursive: false,
        customTargetDir: targetDir,
      });
      const entries = response.data?.files ?? [];
      const matched = entries.find(
        (entry) => !entry.isDir && entry.name === relativePath,
      );
      if (response.code !== SUCCESS_CODE || !matched?.fileProxyUrl) {
        setFailed(true);
        return;
      }
      setFileProxyUrl(matched.fileProxyUrl);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [cId, targetDir, relativePath]);

  useEffect(() => {
    void load();
  }, [load]);

  // 沙箱内绝对路径（头部完整展示 + 一键复制）
  const absolutePath = `/${targetDir}/${relativePath}`.replace(/\/{2,}/g, '/');

  return (
    <div className={cx(styles['external-file-preview'], className)}>
      <div className={cx(styles['external-file-header'])}>
        {onBack && (
          <TooltipIcon
            title={t('PC.Pages.Chat.externalFilePreviewBack')}
            className={cx(styles['external-file-back'])}
            onClick={onBack}
            icon={
              <SvgIcon
                name="icons-common-caret_left"
                style={{ fontSize: 15 }}
              />
            }
          />
        )}
        <span
          className={cx(styles['external-file-header-path'])}
          title={absolutePath}
        >
          {absolutePath}
        </span>
        <CopyIconButton text={absolutePath} buttonSize="small" />
      </div>
      <div className={cx(styles['external-file-body'])}>
        {loading ? (
          <div className={cx(styles['external-file-state'])}>
            <Spin />
          </div>
        ) : failed ? (
          <div className={cx(styles['external-file-state'])}>
            <div className={cx(styles['external-file-failed-text'])}>
              {t('PC.Pages.Chat.externalFilePreviewFailed')}
            </div>
            <Button size="small" onClick={() => void load()}>
              {t('PC.Components.FilePreview.retry')}
            </Button>
          </div>
        ) : fileProxyUrl ? (
          <FilePreview src={fileProxyUrl} showRefresh height="100%" />
        ) : null}
      </div>
    </div>
  );
};

export default ExternalFilePreview;
