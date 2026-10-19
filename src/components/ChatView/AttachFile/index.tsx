import docImage from '@/assets/images/doc_image.jpg';
import type { AttachFileProps } from '@/types/interfaces/agentConfig';
import { EyeOutlined } from '@ant-design/icons';
import { Image } from 'antd';
import classNames from 'classnames';
import React from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

/** mimeType 判定图片附件：后端历史记录可能返回空 mimeType，缺省时以文件名扩展兜底 */
const isImageAttachment = (mimeType?: string, fileName?: string) => {
  if (mimeType?.includes('image/')) return true;
  if (mimeType) return false;
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif)$/i.test(fileName || '');
};

/**
 * 会话消息附件列表组件：用户气泡与 AI 回复共用（V1 ChatView 与 V2 用户
 * 气泡同走此处）。图片附件点击放大预览（NW-121/U-NA12/U-DK9）——沿用仓库
 * antd Image 预览惯例（MarkdownRenderer.OptimizedImage 同口径），同一条
 * 消息多图经 PreviewGroup 串联翻页；非图片附件仍是文档占位图，不参与预览。
 */
const AttachFile: React.FC<AttachFileProps> = ({ files }) => {
  const renderFile = (file: AttachFileProps['files'][number]) =>
    isImageAttachment(file.mimeType, file.fileName) ? (
      <div
        key={file.fileKey}
        className={cx(styles['file-box'], 'flex', 'items-center')}
      >
        <Image
          src={file.fileUrl}
          alt={file.fileName}
          // 50px 缩略图放不下默认 mask 文案，仅保留眼睛图标作放大提示
          preview={{ mask: <EyeOutlined /> }}
        />
        <div className={cx('flex-1', 'overflow-hide')}>
          <h4 className={cx('text-ellipsis')}>{file.fileName}</h4>
        </div>
      </div>
    ) : (
      <div
        key={file.fileKey}
        className={cx(styles['file-box'], 'flex', 'items-center')}
      >
        {/* 非图片附件统一展示文档占位图（不可预览） */}
        <img src={docImage as string} alt="" />
        <div className={cx('flex-1', 'overflow-hide')}>
          <h4 className={cx('text-ellipsis')}>{file.fileName}</h4>
        </div>
      </div>
    );

  const hasImage = files?.some((file) =>
    isImageAttachment(file.mimeType, file.fileName),
  );

  return (
    <div className={cx(styles['files-container'])}>
      {/* PreviewGroup 只包图片场景：纯文档消息不套组，避免空组预览壳 */}
      {hasImage ? (
        <Image.PreviewGroup>{files?.map(renderFile)}</Image.PreviewGroup>
      ) : (
        files?.map(renderFile)
      )}
    </div>
  );
};

export default AttachFile;
