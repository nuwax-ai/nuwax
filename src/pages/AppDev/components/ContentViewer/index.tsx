import AppDevEmptyState from '@/components/business-component/AppDevEmptyState';
import { VERSION_CONSTANTS } from '@/constants/appDevConstants';
import { ProjectDetailData } from '@/types/interfaces/appDev';
import {
  isImageFile,
  isPreviewableFile,
  processImageContent,
} from '@/utils/appDevUtils';
import { Button, Spin } from 'antd';
import React, { useMemo } from 'react';
import CodeViewer from '../CodeViewer';
import FilePathHeader from '../FilePathHeader';
import ImageViewer from '../ImageViewer';
import Preview, { type PreviewRef } from '../Preview';
import styles from './index.less';

interface ContentViewerProps {
  projectInfo?: ProjectDetailData | null;
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
  /** 白屏且 iframe 内错误时触发 AI Agent 自动处理回调
   * @param errorMessage 错误消息，为空字符串表示只有白屏没有错误
   * @param errorType 错误类型，用于区分不同的错误场景
   */
  onWhiteScreenOrIframeError?: (
    errorMessage: string,
    errorType?: 'whiteScreen' | 'iframe',
  ) => void;
}

/**
 * 内容查看器组件
 * 统一的内容查看器容器，根据不同模式和文件类型渲染对应的子组件
 * 优化：使用条件渲染和组件缓存来避免 iframe 重新加载
 */
const ContentViewer: React.FC<ContentViewerProps> = ({
  projectInfo,
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
  onWhiteScreenOrIframeError,
}) => {
  // 使用 useMemo 缓存 Preview 组件，避免重新创建
  const previewComponent = useMemo(
    () => (
      <Preview
        ref={previewRef}
        projectInfo={projectInfo}
        devServerUrl={
          devServerUrl ? `${process.env.BASE_URL}${devServerUrl}` : undefined
        }
        isStarting={isStarting}
        isDeveloping={isChatLoading}
        isRestarting={isRestarting}
        isProjectUploading={isProjectUploading}
        startError={startError}
        serverMessage={serverMessage}
        serverErrorCode={serverErrorCode}
        onStartDev={onStartDev}
        onRestartDev={onRestartDev}
        onWhiteScreenOrIframeError={onWhiteScreenOrIframeError}
      />
    ),
    [
      previewRef,
      devServerUrl,
      isStarting,
      isChatLoading,
      isRestarting,
      isProjectUploading,
      startError,
      serverMessage,
      serverErrorCode,
      onStartDev,
      onRestartDev,
      onWhiteScreenOrIframeError,
    ],
  );

  // 使用 useMemo 缓存代码编辑器组件
  const codeEditorComponent = useMemo(() => {
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
    const isPreviewable = isPreviewableFile(selectedFileId);

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
          {!isPreviewable && !hasContents ? (
            // 不支持预览的文件类型
            <AppDevEmptyState
              type="error"
              title="无法预览此文件类型"
              description={`当前不支持预览 ${
                selectedFileId.split('.').pop() || selectedFileId
              } 格式的文件。`}
            />
          ) : isImage ? (
            <ImageViewer
              imageUrl={processImageContent(
                hasContents ? currentFileNode.content : '',
                devServerUrl
                  ? `${devServerUrl}/${selectedFileId}`
                  : `/${selectedFileId}`,
              )}
              alt={selectedFileId}
              onRefresh={() => {
                if (previewRef.current) {
                  previewRef.current.refresh();
                }
              }}
            />
          ) : hasContents ? (
            <CodeViewer
              fileId={selectedFileId}
              fileName={selectedFileId.split('/').pop() || selectedFileId}
              filePath={`app/${selectedFileId}`}
              content={currentFileNode.content}
              readOnly={isComparing || isChatLoading}
              onContentChange={onContentChange}
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
            <AppDevEmptyState
              type="error"
              title="无法预览此文件类型"
              description={`当前不支持预览 ${
                selectedFileId.split('.').pop() || selectedFileId
              } 格式的文件。`}
            />
          )}
        </div>
      </div>
    );
  }, [
    isLoadingFileContent,
    fileContentError,
    selectedFileId,
    findFileNode,
    isFileModified,
    isSavingFile,
    isComparing,
    isChatLoading,
    devServerUrl,
    fileContent,
    onContentChange,
    onSaveFile,
    onCancelEdit,
    onRefreshFile,
    previewRef,
  ]);

  // 使用 useMemo 缓存版本对比模式下的代码编辑器组件
  const versionCompareCodeComponent = useMemo(() => {
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
    const isPreviewable = isPreviewableFile(selectedFileId);

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
          {!isPreviewable && !hasContents ? (
            <AppDevEmptyState
              type="error"
              title="无法预览此文件类型"
              description={`当前不支持预览 ${
                selectedFileId.split('.').pop() || selectedFileId
              } 格式的文件。`}
            />
          ) : hasContents ? (
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
              imageUrl={processImageContent(
                fileNode.content,
                devServerUrl
                  ? `${devServerUrl}/${selectedFileId}`
                  : `/${selectedFileId}`,
              )}
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
  }, [selectedFileId, fileNode, devServerUrl, isChatLoading, previewRef]);

  // 版本对比模式 + preview标签页：显示禁用提示
  if (isComparing && mode === 'preview') {
    return (
      <div className={styles.emptyState}>
        <p>{VERSION_CONSTANTS.PREVIEW_DISABLED_MESSAGE}</p>
        <p>请恢复或切换到最新版本以查看预览</p>
      </div>
    );
  }

  // 版本对比模式 + code标签页：使用缓存的版本对比代码组件
  if (isComparing && mode === 'code') {
    return versionCompareCodeComponent;
  }

  // 正常模式：同时渲染两个组件，通过 CSS 控制显示/隐藏
  return (
    <div className={styles.contentViewerContainer}>
      {/* 预览组件 - 始终存在，通过 CSS 控制显示 */}
      <div
        className={`${styles.previewContainer} ${
          mode === 'preview' ? styles.visible : styles.hidden
        }`}
      >
        {previewComponent}
      </div>

      {/* 代码编辑器组件 - 始终存在，通过 CSS 控制显示 */}
      <div
        className={`${styles.codeContainer} ${
          mode === 'code' ? styles.visible : styles.hidden
        }`}
      >
        {codeEditorComponent}
      </div>
    </div>
  );
};

export default ContentViewer;
