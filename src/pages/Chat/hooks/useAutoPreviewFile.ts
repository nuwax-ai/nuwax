import { SUCCESS_CODE } from '@/constants/codes.constants';
import { apiGetStaticFileList } from '@/services/vncDesktop';
import { MessageTypeEnum } from '@/types/enums/agent';
import { MessageInfo } from '@/types/interfaces/conversationInfo';
import { extractLastTaskResultFile } from '@/utils';
import { useModel } from 'umi';

import { parentDirectory } from '../utils/fileDataSource';

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

    const assistantMessages = list.filter(
      (item: MessageInfo) => item.messageType === MessageTypeEnum.ASSISTANT,
    );
    const bigText = assistantMessages[assistantMessages.length - 1]?.text || '';

    const lastTaskResultFile = extractLastTaskResultFile(bigText);

    const _lastTaskResultFile = lastTaskResultFile?.split(`${id}/`).pop();

    if (_lastTaskResultFile) {
      // #5a 懒加载收尾：存在性检查从全量递归拉整树改为目标父目录单层查询。
      // 单层条目的 name 为工作区根起算的相对路径，匹配谓词与全量列表一致。
      apiGetStaticFileList(id, {
        relativePath: parentDirectory(_lastTaskResultFile),
        recursive: false,
      })
        .then((fileListRes) => {
          if (fileListRes.code === SUCCESS_CODE && fileListRes.data?.files) {
            // 遍历文件列表，判断文件是否存在
            const fileExists = fileListRes.data.files.some(
              (file: any) => file.name === _lastTaskResultFile,
            );
            // 如果文件存在，打开文件预览，并选中文件
            if (fileExists) {
              openPreviewView(id);
              setTaskAgentSelectedFileId(_lastTaskResultFile);
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
