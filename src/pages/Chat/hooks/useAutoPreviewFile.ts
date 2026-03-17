import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiGetStaticFileList } from '@/services/vncDesktop';
import { MessageTypeEnum } from '@/types/enums/agent';
import { MessageInfo } from '@/types/interfaces/conversationInfo';
import { extractLastTaskResultFile } from '@/utils';
import { useModel } from 'umi';

/**
 * 自动预览最后一次任务生成的文件
 */
export const useAutoPreviewFile = () => {
  const {
    openPreviewView,
    setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger,
  } = useModel('conversationInfo');

  const handleAutoPreviewLastFile = (list: MessageInfo[], id: number) => {
    if (!list || list.length === 0) return;

    const bigText = list
      .filter(
        (item: MessageInfo) => item.messageType === MessageTypeEnum.ASSISTANT,
      )
      .map((item: MessageInfo) => item.text)
      .join('');

    const lastTaskResultFile = extractLastTaskResultFile(bigText);

    if (lastTaskResultFile) {
      // 异步查询文件列表，判断文件是否存在
      apiGetStaticFileList(id)
        .then((fileListRes) => {
          if (fileListRes.code === SUCCESS_CODE && fileListRes.data?.files) {
            // 遍历文件列表，判断文件是否存在
            const fileExists = fileListRes.data.files.some(
              (file: any) => file.name === lastTaskResultFile,
            );
            // 如果文件存在，打开文件预览，并选中文件
            if (fileExists) {
              openPreviewView(id);
              setTaskAgentSelectedFileId(lastTaskResultFile);
              setTaskAgentSelectTrigger(Date.now());
            }
          }
        })
        .catch((error) => {
          console.error('Fetch static file list failed:', error);
        });
    }
  };

  return { handleAutoPreviewLastFile };
};
