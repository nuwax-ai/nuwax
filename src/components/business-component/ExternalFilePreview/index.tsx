import CopyIconButton from '@/components/base/CopyIconButton';
import SvgIcon from '@/components/base/SvgIcon';
import FilePreview from '@/components/business-component/FilePreview';
import TooltipIcon from '@/components/custom/TooltipIcon';
import { t } from '@/services/i18nRuntime';
import classNames from 'classnames';
import React, { useMemo } from 'react';
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

/** 拆出末段文件名与其上级相对目录（relativePath 形如 Desktop/sub/a.md） */
const splitRelativePath = (relativePath: string) => {
  const slashIndex = relativePath.lastIndexOf('/');
  return slashIndex === -1
    ? { fileName: relativePath, parentDir: '' }
    : {
        fileName: relativePath.slice(slashIndex + 1),
        parentDir: relativePath.slice(0, slashIndex),
      };
};

/**
 * 工作区外沙箱文件独立预览面板（V2 工具渲染文件徽标点击的新链路）：
 * 直接拼静态代理地址
 * `/api/computer/static/{cId}/{fileName}?t=…&customTargetDir={文件所在父目录绝对路径}`
 * 交 FilePreview 按类型渲染，加载/失败/重试均由 FilePreview 自带状态承担。
 * 注意：网关当前仅个人电脑会话放行 customTargetDir，云端会话放开为后端契约，
 * 未放开或文件不存在时表现为预览加载失败。
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
  // 沙箱内绝对路径（头部完整展示 + 一键复制）
  const absolutePath = `/${targetDir}/${relativePath}`.replace(/\/{2,}/g, '/');

  // 静态代理直连：customTargetDir 锚定文件所在父目录，URL 段只带文件名；
  // t 为防缓存时间戳，随挂载生成（重拉缓存由 FilePreview 刷新按钮同 URL 复现）
  const fileProxyUrl = useMemo(() => {
    const { fileName, parentDir } = splitRelativePath(relativePath);
    const dir = parentDir ? `${targetDir}/${parentDir}` : targetDir;
    return `/api/computer/static/${cId}/${encodeURIComponent(
      fileName,
    )}?t=${Date.now()}&customTargetDir=${encodeURIComponent(dir)}`;
  }, [cId, targetDir, relativePath]);

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
        <FilePreview src={fileProxyUrl} showRefresh height="100%" />
      </div>
    </div>
  );
};

export default ExternalFilePreview;
