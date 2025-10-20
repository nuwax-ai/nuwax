import { VERSION_CONSTANTS } from '@/constants/appDevConstants';
import { isImageFile } from '@/utils/appDevUtils';
import { Button, Spin } from 'antd';
import React from 'react';
import CodeViewer from '../CodeViewer';
import FilePathHeader from '../FilePathHeader';
import ImageViewer from '../ImageViewer';
import Preview, { type PreviewRef } from '../Preview';
import styles from './index.less';

interface ContentViewerProps {
  /** 显示模式 */
  mode: 'preview' | 'code';
  /** 是否在版本对比模式 */
  isComparing: boolean;
  /** 选中的文件ID */
  selectedFileId: string | null;
  /** 文件节点数据 */
  fileNode: any;
  /** 文件内容 */
  fileContent: string;
  /** 是否正在加载文件内容 */
  isLoadingFileContent: boolean;
  /** 文件内容错误信息 */
  fileContentError: string | null;
  /** 文件是否被修改 */
  isFileModified: boolean;
  /** 是否正在保存文件 */
  isSavingFile: boolean;
  /** 开发服务器URL */
  devServerUrl: string | null;
  /** 是否正在启动 */
  isStarting: boolean;
  /** 是否正在重启 */
  isRestarting?: boolean; // 新增
  /** 是否正在导入项目 */
  isProjectUploading?: boolean; // 新增
  /** 启动错误 */
  startError?: string | null;
  /** 服务器接口返回的消息 */
  serverMessage?: string | null;
  /** 服务器错误码 */
  serverErrorCode?: string | null;
  /** Preview组件ref */
  previewRef: React.RefObject<PreviewRef>;
  /** 内容变化回调 */
  onContentChange: (fileId: string, content: string) => void;
  /** 保存文件回调 */
  onSaveFile: () => void;
  /** 取消编辑回调 */
  onCancelEdit: () => void;
  /** 刷新文件回调 */
  onRefreshFile: () => void;
  /** 查找文件节点方法 */
  findFileNode: (fileId: string) => any;
  /** 是否正在AI聊天加载中 */
  isChatLoading?: boolean;
  /** 启动开发服务器回调 */
  onStartDev?: () => void;
  /** 重启开发服务器回调 */
  onRestartDev?: () => void;
  /** 白屏检测回调 */
  onWhiteScreen?: () => void;
}

/**
 * 内容查看器组件
 * 统一的内容查看器容器，根据不同模式和文件类型渲染对应的子组件
 */
const ContentViewer: React.FC<ContentViewerProps> = ({
  mode,
  isComparing,
  selectedFileId,
  fileNode,
  fileContent,
  isLoadingFileContent,
  fileContentError,
  isFileModified,
  isSavingFile,
  devServerUrl,
  isStarting,
  isRestarting, // 新增
  isProjectUploading, // 新增
  startError,
  serverMessage,
  serverErrorCode,
  previewRef,
  onContentChange,
  onSaveFile,
  onCancelEdit,
  onRefreshFile,
  findFileNode,
  isChatLoading = false,
  onStartDev,
  onRestartDev,
  onWhiteScreen,
}) => {
  // 版本对比模式 + preview标签页：显示禁用提示
  if (isComparing && mode === 'preview') {
    return (
      <div className={styles.emptyState}>
        <p>{VERSION_CONSTANTS.PREVIEW_DISABLED_MESSAGE}</p>
        <p>请恢复或切换到最新版本以查看预览</p>
      </div>
    );
  }

  // 版本对比模式 + code标签页：显示FilePathHeader + CodeViewer/ImageViewer
  if (isComparing && mode === 'code') {
    if (!selectedFileId) {
      return (
        <div className={styles.emptyState}>
          <p>请从左侧文件树选择一个文件进行预览</p>
        </div>
      );
    }

    const hasContents =
      fileNode && fileNode.content && fileNode.content.trim() !== '';
    const isImage = isImageFile(selectedFileId);

    return (
      <>
        {/* 文件路径显示 */}
        <FilePathHeader
          filePath={fileNode?.path || selectedFileId}
          isModified={false}
          isLoading={false}
          isSaving={false}
          readOnly={true}
          onSave={() => {}}
          onCancel={() => {}}
          onRefresh={() => {}}
        />

        {/* 文件内容显示区域 */}
        <div className={styles.fileContentPreview}>
          {hasContents ? (
            <CodeViewer
              fileId={selectedFileId}
              fileName={selectedFileId.split('/').pop() || selectedFileId}
              filePath={`app/${selectedFileId}`}
              content={fileNode.content}
              readOnly={true || isChatLoading}
              onContentChange={() => {}}
            />
          ) : isImage ? (
            <ImageViewer
              imagePath={selectedFileId}
              imageUrl={
                devServerUrl
                  ? `${devServerUrl}/${selectedFileId}`
                  : `/${selectedFileId}`
              }
              alt={selectedFileId}
              onRefresh={() => {
                if (previewRef.current) {
                  previewRef.current.refresh();
                }
              }}
            />
          ) : (
            <div className={styles.emptyState}>
              <p>无法预览此文件类型: {selectedFileId}</p>
            </div>
          )}
        </div>
      </>
    );
  }

  // 正常模式 + preview标签页：显示ImageViewer（图片）或Preview组件（应用预览）
  if (mode === 'preview') {
    if (selectedFileId && isImageFile(selectedFileId)) {
      return (
        <ImageViewer
          imagePath={selectedFileId}
          imageUrl={
            devServerUrl
              ? `${devServerUrl}/${selectedFileId}`
              : `/${selectedFileId}`
          }
          alt={selectedFileId}
          onRefresh={() => {
            if (previewRef.current) {
              previewRef.current.refresh();
            }
          }}
        />
      );
    }

    return (
      <Preview
        ref={previewRef}
        devServerUrl={
          devServerUrl ? `${process.env.BASE_URL}${devServerUrl}` : undefined
        }
        isStarting={isStarting}
        isRestarting={isRestarting} // 新增
        isProjectUploading={isProjectUploading} // 新增
        startError={startError}
        serverMessage={serverMessage}
        serverErrorCode={serverErrorCode}
        onStartDev={onStartDev}
        onRestartDev={onRestartDev}
        onWhiteScreen={onWhiteScreen}
        onResourceError={(error) => {
          // 记录错误日志
          console.error('[AppDev] Preview 资源错误:', error);

          // 根据错误类型进行不同的处理
          switch (error.type) {
            case 'script':
              console.warn(
                `[AppDev] 脚本加载失败: ${error.url}`,
                error.message,
              );
              break;
            case 'style':
              console.warn(
                `[AppDev] 样式加载失败: ${error.url}`,
                error.message,
              );
              break;
            case 'fetch':
              if (error.networkError?.code) {
                const statusCode = error.networkError.code;
                if (statusCode >= 500) {
                  console.error(
                    `[AppDev] 服务器错误 (${statusCode}): ${error.url}`,
                  );
                } else if (statusCode >= 400) {
                  console.warn(
                    `[AppDev] 客户端错误 (${statusCode}): ${error.url}`,
                  );
                }
              }
              break;
            case 'image':
              console.info(`[AppDev] 图片加载失败: ${error.url}`);
              break;
            default:
              console.warn(
                `[AppDev] 资源加载失败: ${error.type} - ${error.url}`,
              );
          }
        }}
      />
    );
  }

  // 正常模式 + code标签页：显示FilePathHeader + CodeViewer/ImageViewer
  if (mode === 'code') {
    if (isLoadingFileContent) {
      return (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>正在加载文件内容...</p>
        </div>
      );
    }

    if (fileContentError) {
      return (
        <div className={styles.errorContainer}>
          <p>{fileContentError}</p>
          <Button size="small" onClick={onRefreshFile}>
            重试
          </Button>
        </div>
      );
    }

    if (!selectedFileId) {
      return (
        <div className={styles.emptyState}>
          <p>请从左侧文件树选择一个文件进行预览</p>
        </div>
      );
    }

    const currentFileNode = findFileNode(selectedFileId);
    const hasContents =
      currentFileNode &&
      currentFileNode.content &&
      currentFileNode.content.trim() !== '';
    const isImage = isImageFile(selectedFileId);

    return (
      <div className={styles.codeEditorContainer}>
        {/* 文件路径显示 */}
        <FilePathHeader
          filePath={currentFileNode?.path || selectedFileId}
          isModified={isFileModified}
          isLoading={isLoadingFileContent}
          isSaving={isSavingFile}
          readOnly={isComparing || isChatLoading}
          onSave={onSaveFile}
          onCancel={onCancelEdit}
          onRefresh={onRefreshFile}
        />

        {/* 文件内容预览 */}
        <div className={styles.fileContentPreview}>
          {hasContents ? (
            <CodeViewer
              fileId={selectedFileId}
              fileName={selectedFileId.split('/').pop() || selectedFileId}
              filePath={`app/${selectedFileId}`}
              content={currentFileNode.content}
              readOnly={isComparing || isChatLoading}
              onContentChange={onContentChange}
            />
          ) : isImage ? (
            <ImageViewer
              imagePath={selectedFileId}
              imageUrl={
                devServerUrl
                  ? `${devServerUrl}/${selectedFileId}`
                  : `/${selectedFileId}`
              }
              alt={selectedFileId}
              onRefresh={() => {
                if (previewRef.current) {
                  previewRef.current.refresh();
                }
              }}
            />
          ) : fileContent ? (
            <CodeViewer
              fileId={selectedFileId}
              fileName={selectedFileId.split('/').pop() || selectedFileId}
              filePath={`app/${selectedFileId}`}
              content={fileContent}
              readOnly={isComparing || isChatLoading}
              onContentChange={onContentChange}
            />
          ) : (
            <div className={styles.emptyState}>
              <p>无法预览此文件类型: {selectedFileId}</p>
              <Button size="small" onClick={onRefreshFile}>
                重新加载
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};

export default ContentViewer;
