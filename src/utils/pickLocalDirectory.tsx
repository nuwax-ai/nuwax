/**
 * 选择本地目录的统一交互（原生选择器优先，手动输入兜底）。
 * @description 供「会话内打开本地目录」（5a）与「发起会话时选工作目录」
 * （wiki #17 / 5-b）共用：桌面壳内走宿主原生目录选择器；浏览器无桥时
 * 弹窗手动输入会话所在电脑上的目录绝对路径。
 */
import { dict } from '@/services/i18nRuntime';
import { localFiles } from '@/utils/nuwaClawBridge';
import { Input, Modal } from 'antd';

/** 弹手动输入框（浏览器/无原生选择器时）。返回用户确认的目录或 null。 */
export function promptForManualDirectoryPath(): Promise<string | null> {
  return new Promise((resolve) => {
    let value = '';
    Modal.confirm({
      title: dict('PC.Components.LocalFiles.openByPathTitle'),
      content: (
        <div>
          <p
            style={{ color: 'var(--ant-color-text-tertiary)', marginBottom: 8 }}
          >
            {dict('PC.Components.LocalFiles.openByPathHint')}
          </p>
          <Input
            placeholder={dict('PC.Components.LocalFiles.pathPlaceholder')}
            onChange={(event) => {
              value = event.target.value;
            }}
          />
        </div>
      ),
      okText: dict('PC.Components.LocalFiles.open'),
      cancelText: dict('PC.Components.LocalFiles.cancel'),
      onOk: () => resolve(value.trim() || null),
      onCancel: () => resolve(null),
    });
  });
}

/**
 * 选择一个目录：桌面壳内原生选择器；浏览器手动输入。
 * 用户取消返回 null。
 */
export async function pickSingleLocalDirectory(): Promise<string | null> {
  if (localFiles.hasNativePicker()) {
    const result = await localFiles.pickDirectory();
    if (!result.canceled && result.paths.length) return result.paths[0];
    return null;
  }
  return promptForManualDirectoryPath();
}
