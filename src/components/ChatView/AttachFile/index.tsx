import docImage from '@/assets/images/doc_image.jpg';
import { dict } from '@/services/i18nRuntime';
import type { AttachFileProps } from '@/types/interfaces/agentConfig';
import { openRemoteFileUrl } from '@/utils/authProtectedFileUrl';
import { Image, message } from 'antd';
import classNames from 'classnames';
import React, { useState } from 'react';
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
 * 消息多图经 PreviewGroup 串联翻页；卡片双击打开图片预览或远程文件。
 */
const AttachFile: React.FC<AttachFileProps> = ({ files }) => {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const imageFiles =
    files?.filter((file) => isImageAttachment(file.mimeType, file.fileName)) ??
    [];
  const openFile = (file: AttachFileProps['files'][number]) => {
    if (!file.fileUrl) return;
    if (isImageAttachment(file.mimeType, file.fileName)) {
      setPreviewIndex(imageFiles.indexOf(file));
      setPreviewVisible(true);
    } else {
      void openRemoteFileUrl(file.fileUrl, file.fileName).catch(() => {
        message.error(dict('PC.Common.Global.operationFailed'));
      });
    }
  };
  const renderFile = (file: AttachFileProps['files'][number]) =>
    isImageAttachment(file.mimeType, file.fileName) ? (
      <div
        key={file.fileKey}
        className={cx(styles['file-box'], 'flex', 'items-center')}
        onDoubleClick={(event) => {
          event.stopPropagation();
          openFile(file);
        }}
      >
        <Image
          src={file.fileUrl}
          alt={file.fileName}
          preview={false}
          onClick={() => openFile(file)}
        />
        <div className={cx('flex-1', 'overflow-hide')}>
          <h4 className={cx('text-ellipsis')}>{file.fileName}</h4>
        </div>
      </div>
    ) : (
      <div
        key={file.fileKey}
        className={cx(styles['file-box'], 'flex', 'items-center')}
        onDoubleClick={(event) => {
          event.stopPropagation();
          openFile(file);
        }}
      >
        {/* 文档沿用现有受保护文件打开链路，不加入图片预览组。 */}
        <img src={docImage as string} alt="" />
        <div className={cx('flex-1', 'overflow-hide')}>
          <h4 className={cx('text-ellipsis')}>{file.fileName}</h4>
        </div>
      </div>
    );

  return (
    <div className={cx(styles['files-container'])}>
      {files?.map(renderFile)}
      {imageFiles.length > 0 && (
        <Image.PreviewGroup
          items={imageFiles.map((file) => file.fileUrl)}
          preview={{
            visible: previewVisible,
            current: previewIndex,
            onVisibleChange: setPreviewVisible,
            onChange: setPreviewIndex,
          }}
        />
      )}
    </div>
  );
};

export default AttachFile;
