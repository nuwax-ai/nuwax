import type {
  AudioAttachment,
  DataSourceAttachment,
  DocumentAttachment,
  ImageAttachment,
  TextAttachment,
} from '@/types/interfaces/appDev';
import {
  ApiOutlined,
  FileOutlined,
  FileTextOutlined,
  SoundOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
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
    | AudioAttachment
    | DataSourceAttachment;
  /** 附件类型 */
  type: 'Image' | 'Text' | 'Document' | 'Audio' | 'DataSource';
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
    // 根据数据源类型获取图片地址
    const getImageSrc = (): string => {
      const { source_type, data } = imageAttachment.source;

      switch (source_type) {
        case 'Base64':
          // Base64 格式
          return `data:${imageAttachment.mime_type};base64,${data.data}`;
        case 'Url':
          // URL 格式
          return data.url || '';
        case 'FilePath':
          // 文件路径格式
          return data.path || '';
        default:
          return '';
      }
    };

    const imageSrc = getImageSrc();

    return (
      <div className={`${styles.messageImageAttachment} ${className || ''}`}>
        <Image
          src={imageSrc}
          alt={imageAttachment.filename || '图片'}
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
    const getFileIcon = (
      fileType: 'Text' | 'Document' | 'Audio',
    ): React.ReactNode => {
      switch (fileType) {
        case 'Text':
          return <FileTextOutlined />;
        case 'Document':
          return <FileOutlined />;
        case 'Audio':
          return <SoundOutlined />;
        default:
          return <FileOutlined />;
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

  // 渲染数据源附件
  const renderDataSourceAttachment = (
    dataSourceAttachment: DataSourceAttachment,
  ) => {
    // 获取数据源类型显示文本
    const getDataSourceTypeText = (type: 'plugin' | 'workflow'): string => {
      switch (type) {
        case 'plugin':
          return '插件';
        case 'workflow':
          return '工作流';
        default:
          return '数据源';
      }
    };

    // 获取数据源图标
    const getDataSourceIcon = (
      type: 'plugin' | 'workflow',
    ): React.ReactNode => {
      switch (type) {
        case 'plugin':
          return <ApiOutlined />;
        case 'workflow':
          return <ThunderboltOutlined />;
        default:
          return <ApiOutlined />;
      }
    };

    // 处理数据源附件点击事件
    const handleDataSourceClick = () => {
      // 如果有自定义点击回调，优先执行
      if (onClick) {
        onClick();
        return;
      }

      // 根据数据源类型在新页面中打开对应页面
      const { type, dataSourceId } = dataSourceAttachment;

      if (type === 'plugin') {
        // 在新页面中打开插件详情页面
        window.open(
          `/square/publish/plugin/${dataSourceId}`,
          '_blank',
          'noopener,noreferrer',
        );
      } else if (type === 'workflow') {
        // 在新页面中打开工作流详情页面
        window.open(
          `/square/publish/workflow/${dataSourceId}`,
          '_blank',
          'noopener,noreferrer',
        );
      }
    };

    return (
      <div
        className={`${styles.messageDataSourceAttachment} ${className || ''}`}
        onClick={handleDataSourceClick}
        style={{ cursor: 'pointer' }}
      >
        <div className={styles.dataSourceAttachmentIcon}>
          {getDataSourceIcon(dataSourceAttachment.type)}
        </div>
        <div className={styles.dataSourceAttachmentInfo}>
          <div className={styles.dataSourceAttachmentName}>
            {dataSourceAttachment.name}
          </div>
          <div className={styles.dataSourceAttachmentType}>
            {getDataSourceTypeText(dataSourceAttachment.type)}
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
      return renderFileAttachment(
        attachment as TextAttachment | DocumentAttachment | AudioAttachment,
      );
    case 'Audio':
      return null;
    case 'DataSource':
      return renderDataSourceAttachment(attachment as DataSourceAttachment);
    default:
      return null;
  }
};

export default MessageAttachment;
