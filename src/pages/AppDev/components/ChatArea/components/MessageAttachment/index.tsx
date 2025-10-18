import type {
  AudioAttachment,
  DocumentAttachment,
  ImageAttachment,
  TextAttachment,
} from '@/types/interfaces/appDev';
import { Image } from 'antd';
import React from 'react';
import styles from './index.less';

/**
 * 消息附件组件属性
 */
interface MessageAttachmentProps {
  /** 附件数据 */
  attachment:
    | ImageAttachment
    | TextAttachment
    | DocumentAttachment
    | AudioAttachment;
  /** 附件类型 */
  type: 'Image' | 'Text' | 'Document' | 'Audio';
  /** 图片尺寸（仅对图片类型有效） */
  size?: number;
  /** 是否显示预览（仅对图片类型有效） */
  showPreview?: boolean;
  /** 自定义样式类名 */
  className?: string;
  /** 点击回调 */
  onClick?: () => void;
}

/**
 * 消息附件组件
 * 用于在聊天消息中显示各种类型的附件（图片、文件等）
 */
const MessageAttachment: React.FC<MessageAttachmentProps> = ({
  attachment,
  type,
  size = 120,
  showPreview = true,
  className,
  onClick,
}) => {
  // 渲染图片附件
  const renderImageAttachment = (imageAttachment: ImageAttachment) => {
    const imageSrc = `data:${imageAttachment.mime_type};base64,${imageAttachment.source.data.data}`;

    return (
      <div className={`${styles.messageImageAttachment} ${className || ''}`}>
        <Image
          src={imageSrc}
          alt={imageAttachment.filename}
          width={size}
          height={size}
          style={{
            objectFit: 'cover',
            borderRadius: 8,
          }}
          preview={
            showPreview
              ? {
                  mask: false,
                }
              : false
          }
        />
      </div>
    );
  };

  // 渲染文件附件
  const renderFileAttachment = (
    fileAttachment: TextAttachment | DocumentAttachment | AudioAttachment,
  ) => {
    // 获取文件类型显示文本
    const getFileTypeText = (
      fileType: 'Text' | 'Document' | 'Audio',
    ): string => {
      switch (fileType) {
        case 'Text':
          return '文本文件';
        case 'Document':
          return '文档';
        case 'Audio':
          return '音频文件';
        default:
          return '文件';
      }
    };

    // 获取文件图标
    const getFileIcon = (fileType: 'Text' | 'Document' | 'Audio'): string => {
      switch (fileType) {
        case 'Text':
          return '📄';
        case 'Document':
          return '📋';
        case 'Audio':
          return '🎵';
        default:
          return '📁';
      }
    };

    return (
      <div
        className={`${styles.messageFileAttachment} ${className || ''}`}
        onClick={onClick}
      >
        <div className={styles.fileAttachmentIcon}>
          {getFileIcon(type as 'Text' | 'Document' | 'Audio')}
        </div>
        <div className={styles.fileAttachmentInfo}>
          <div className={styles.fileAttachmentName}>
            {fileAttachment.filename}
          </div>
          <div className={styles.fileAttachmentType}>
            {getFileTypeText(type as 'Text' | 'Document' | 'Audio')}
          </div>
        </div>
      </div>
    );
  };

  // 根据类型渲染不同的附件
  switch (type) {
    case 'Image':
      return renderImageAttachment(attachment as ImageAttachment);
    case 'Text':
    case 'Document':
    case 'Audio':
      return null;
    // return renderFileAttachment(
    //   attachment as TextAttachment | DocumentAttachment | AudioAttachment,
    // );
    default:
      return null;
  }
};

export default MessageAttachment;
