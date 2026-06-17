import { SUCCESS_CODE } from '@/constants/codes.constants';
import { UploadFileStatus } from '@/types/enums/common';
import { UploadFileInfo } from '@/types/interfaces/common';

/** 仅保留服务端返回的可访问 URL，忽略 blob/base64 等本地预览地址 */
const resolveRemoteFileUrl = (data: Record<string, any>, item: any) => {
  const candidates = [data?.url, item.url, item.thumbUrl];
  return (
    candidates.find(
      (url) =>
        typeof url === 'string' &&
        (url.startsWith('http://') || url.startsWith('https://')),
    ) || ''
  );
};

export const handleUploadFileList = (fileList: any[], modifyPercent = 99) => {
  return fileList
    .filter((item) => item.status !== UploadFileStatus.removed)
    .map((item) => {
      const { data = {}, code } = item.response || {};
      let status = item.status as UploadFileStatus;
      let percent = item.percent;
      if (code && code !== SUCCESS_CODE) {
        // 修正接口返回状态
        status = UploadFileStatus.error;
      }
      if (item?.percent === 100 && status === UploadFileStatus.uploading) {
        //修正
        percent = modifyPercent;
      }
      return {
        key: data?.key || '',
        name: data?.fileName || item.name || '',
        size: data?.size || item.size || 0,
        url: resolveRemoteFileUrl(data, item),
        type: data?.mimeType || item.type || '',
        uid: item.uid,
        status: status,
        percent: percent,
        response: item.response,
      } as UploadFileInfo;
    });
};

// 获取上传进度状态
export const getProgressStatus = (fileInfo: UploadFileInfo) => {
  if (fileInfo?.status === UploadFileStatus.error) {
    return 'exception';
  }
  if (fileInfo?.status === UploadFileStatus.uploading) {
    return 'active';
  }

  if (fileInfo?.status === UploadFileStatus.done) {
    return 'success';
  }

  if (Math.floor(fileInfo?.percent || 0) === 100) {
    return 'success';
  }

  return 'active';
};
