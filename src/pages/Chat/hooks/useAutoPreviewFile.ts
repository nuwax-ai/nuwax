import { parentDirectory } from '@/components/business-component/FileTreeGitSourcePanel/utils/workspaceFileList';
import { SUCCESS_CODE } from '@/constants/codes.constants';
import { LocalFileAccessError } from '@/features/client-shell/localFileService';
import { usePageModel } from '@/modelScopes/usePageModel';
import { apiGetStaticFileList } from '@/services/vncDesktop';
import { MessageTypeEnum } from '@/types/enums/agent';
import { MessageInfo } from '@/types/interfaces/conversationInfo';
import { extractLastTaskResultFile } from '@/utils';

/** 本机上下文换代竞态等待：会话刚落盘时 workspace/sandbox 常会立刻重注册一次。 */
const LOCAL_CONTEXT_RETRY_MS = 120;

/**
 * 自动预览是否应静默处理该错误。
 * expired/unavailable 是本机文件上下文代次切换的预期结果，不是接口故障。
 */
function isBenignLocalAccessError(error: unknown): boolean {
  return (
    error instanceof LocalFileAccessError &&
    (error.code === 'expired' || error.code === 'unavailable')
  );
}

/**
 * 自动预览最后一次任务生成的文件。
 * 仅做存在性检查后选中；失败不弹 toast，避免打扰主对话流。
 */
export const useAutoPreviewFile = () => {
  const {
    openPreviewView,
    setTaskAgentSelectedFileId,
    setTaskAgentSelectTrigger,
  } = usePageModel('conversationInfo');

  const handleAutoPreviewLastFile = (list: MessageInfo[], id: number) => {
    if (!list || list.length === 0) return;

    const assistantMessages = list.filter(
      (item: MessageInfo) => item.messageType === MessageTypeEnum.ASSISTANT,
    );
    const bigText = assistantMessages[assistantMessages.length - 1]?.text || '';

    const lastTaskResultFile = extractLastTaskResultFile(bigText);

    const _lastTaskResultFile = lastTaskResultFile?.split(`${id}/`).pop();

    if (!_lastTaskResultFile) return;

    // #5a 懒加载收尾：存在性检查从全量递归拉整树改为目标父目录单层查询。
    // 单层条目的 name 为工作区根起算的相对路径，匹配谓词与全量列表一致。
    const listOptions = {
      relativePath: parentDirectory(_lastTaskResultFile),
      recursive: false as const,
    };

    const tryOpenIfExists = async (attempt: number): Promise<void> => {
      try {
        const fileListRes = await apiGetStaticFileList(id, listOptions);
        if (fileListRes.code !== SUCCESS_CODE || !fileListRes.data?.files) {
          return;
        }
        const fileExists = fileListRes.data.files.some(
          (file: { name: string }) => file.name === _lastTaskResultFile,
        );
        if (!fileExists) return;
        openPreviewView(id);
        setTaskAgentSelectedFileId(_lastTaskResultFile);
        setTaskAgentSelectTrigger(Date.now());
      } catch (error) {
        // 会话加载瞬间本机 context 常因字段落定 / 电脑服务 ready 换代；
        // expired 时短延迟重试一次，仍失败则放弃自动预览（不污染控制台）。
        if (
          error instanceof LocalFileAccessError &&
          error.code === 'expired' &&
          attempt === 0
        ) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, LOCAL_CONTEXT_RETRY_MS);
          });
          return tryOpenIfExists(1);
        }
        if (isBenignLocalAccessError(error)) return;
        console.error('Fetch static file list failed:', error);
      }
    };

    void tryOpenIfExists(0);
  };

  return { handleAutoPreviewLastFile };
};
