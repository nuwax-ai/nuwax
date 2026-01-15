import { SUCCESS_CODE } from '@/constants/codes.constants';
import { RequestResponse } from '@/types/interfaces/request';
import { message } from 'antd';
import { useCallback, useState } from 'react';

/**
 * 文件导入配置选项
 */
export interface UseFileImportOptions<T = any> {
  /** 导入 API 函数 */
  importApi: (params: T) => Promise<RequestResponse<any>>;
  /** 构建 API 调用参数的函数，接收选中的文件列表，返回 API 参数 */
  buildApiParams: (files: File[]) => T;
  /** 是否支持多选，默认为 false（单选） */
  multiple?: boolean;
  /** 接受的文件类型，默认为 '.zip' */
  accept?: string;
  /** 文件类型验证函数，返回 true 表示通过验证 */
  validateFileType?: (file: File) => boolean;
  /** 文件类型错误提示信息 */
  fileTypeErrorMsg?: string;
  /** 导入成功回调 */
  onSuccess?: (result: any) => void;
  /** 导入失败回调 */
  onError?: (error: any) => void;
  /** 成功提示信息 */
  successMessage?: string;
}

/**
 * 文件导入 Hook 返回值
 */
export interface UseFileImportReturn {
  /** 触发文件选择 */
  triggerImport: () => void;
  /** 加载状态 */
  loading: boolean;
}

/**
 * 通用文件导入 Hook
 *
 * @example
 * ```tsx
 * const { triggerImport, loading } = useFileImport({
 *   importApi: apiSkillImport,
 *   buildApiParams: (files) => ({
 *     file: files[0],
 *     targetSkillId: skillId,
 *     targetSpaceId: spaceId,
 *   }),
 *   onSuccess: () => {
 *     // 刷新列表
 *   },
 * });
 * ```
 */
export const useFileImport = <T = any>(
  options: UseFileImportOptions<T>,
): UseFileImportReturn => {
  const {
    importApi,
    buildApiParams,
    multiple = false,
    accept = '.zip,.skill,.md',
    validateFileType,
    fileTypeErrorMsg = '仅支持 .zip 压缩文件、.skill 文件或 SKILL.md 文件',
    onSuccess,
    onError,
    successMessage = '导入成功',
  } = options;

  const [loading, setLoading] = useState(false);

  /**
   * 默认文件类型验证函数
   * 支持 .zip、.skill 文件或 SKILL.md 文件（不区分大小写）
   */
  const defaultValidateFileType = useCallback(
    (file: File): boolean => {
      if (!accept) return true;

      const fileName = file.name || '';
      const fileNameLower = fileName.toLowerCase();

      // 检查是否为 .zip 文件
      if (fileNameLower.endsWith('.zip')) {
        return true;
      }

      // 检查是否为 .skill 文件
      if (fileNameLower.endsWith('.skill')) {
        return true;
      }

      // 检查是否为 SKILL.md 文件（不区分大小写）
      if (fileNameLower === 'skill.md') {
        return true;
      }

      // 如果 accept 包含其他类型，也进行匹配
      const acceptTypes = accept.split(',').map((type) => type.trim());
      return acceptTypes.some((type) => {
        if (type.startsWith('.')) {
          const typeLower = type.toLowerCase();
          // 对于 .md 文件，仅支持 SKILL.md 文件（不区分大小写）
          if (typeLower === '.md') {
            return fileNameLower === 'skill.md';
          }
          // 其他扩展名匹配，如 .zip
          return fileNameLower.endsWith(typeLower);
        }
        // MIME 类型匹配，如 application/zip
        return file.type === type;
      });
    },
    [accept],
  );

  const validateFile = validateFileType || defaultValidateFileType;

  /**
   * 触发文件导入
   */
  const triggerImport = useCallback(() => {
    // 创建一个隐藏的文件输入框
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    input.accept = accept;
    input.multiple = multiple;
    document.body.appendChild(input);

    // 等待用户选择文件
    input.click();

    input.onchange = async (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);

      if (files.length === 0) {
        document.body.removeChild(input);
        return;
      }

      // 验证文件类型
      const invalidFiles = files.filter((file) => !validateFile(file));
      if (invalidFiles.length > 0) {
        message.error(fileTypeErrorMsg);
        document.body.removeChild(input);
        return;
      }

      try {
        setLoading(true);

        // 构建 API 参数并调用导入接口
        const apiParams = buildApiParams(files);
        const result = await importApi(apiParams);

        if (result.code === SUCCESS_CODE) {
          message.success(successMessage);
          onSuccess?.(result.data);
        } else {
          throw new Error(result.message || '导入失败');
        }
      } catch (error) {
        onError?.(error);
      } finally {
        setLoading(false);
        // 清理DOM
        document.body.removeChild(input);
      }
    };

    // 如果用户取消选择，也要清理DOM
    input.oncancel = () => {
      document.body.removeChild(input);
    };
  }, [
    accept,
    multiple,
    validateFile,
    fileTypeErrorMsg,
    buildApiParams,
    importApi,
    successMessage,
    onSuccess,
    onError,
  ]);

  return {
    triggerImport,
    loading,
  };
};
