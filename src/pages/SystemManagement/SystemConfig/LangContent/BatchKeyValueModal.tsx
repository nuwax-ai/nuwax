import CodeEditor from '@/components/CodeEditor';
import { apiI18nConfigBatchAddOrUpdate } from '@/services/i18n';
import { dict } from '@/services/i18nRuntime';
import { CodeLangEnum } from '@/types/enums/plugin';
import type { I18nConfigBatchAddOrUpdateParams } from '@/types/interfaces/i18n';
import { Modal, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

interface BatchKeyValueModalProps {
  lang: string;
  open: boolean;
  sideList?: string[];
  onCancel: () => void;
  onSuccess: () => void;
}

// 批量新增或更新键值对默认代码
const DefaultBatchCode = `
/**
 * Batch add or update key-value pairs
 * JSON format: { "key": "value" }
 * Key format: "Client.Module.Page.Component.textKey"
 * - textKey should use lowerCamelCase
 * - other segments should use PascalCase
 * Note:
 * - The key must be separated by dots (.)
 * - It must start with an uppercase English letter
 * - It can only contain uppercase/lowercase English letters, underscores (_), and dots (.)
 * - Chinese characters and special symbols are not allowed
 * Example:
 * {
 *   "PC.Pages.SystemConfig.LangContent.title": "Key-Value Management"
 * }
 */
{
  "key": "value"
}`;

// 默认端列表
const DefaultSideList: string[] = ['PC', 'Mobile', 'Claw', 'Backend'];

/**
 * 批量新增或更新键值对弹窗
 */
const BatchKeyValueModal: React.FC<BatchKeyValueModalProps> = ({
  lang,
  open,
  onCancel,
  sideList = DefaultSideList,
  onSuccess,
}) => {
  // JSON 代码
  const [batchCode, setBatchCode] = useState<string>('');

  // 批量新增或更新多语言配置
  const { run: runBatchAddOrUpdate, loading } = useRequest(
    apiI18nConfigBatchAddOrUpdate,
    {
      manual: true,
    },
  );

  useEffect(() => {
    setBatchCode(DefaultBatchCode);
  }, [open]);

  // 从编辑器内容中提取 JSON 主体，忽略前后注释说明
  const extractJsonText = (code: string): string => {
    // 先移除块注释（/* ... */）与行注释（//...）
    const withoutBlockComments = code.replace(/\/\*[\s\S]*?\*\//g, '');
    const withoutComments = withoutBlockComments.replace(/^\s*\/\/.*$/gm, '');
    const cleaned = withoutComments.trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return cleaned;
    return cleaned.slice(start, end + 1).trim();
  };

  // 清理 JSON 尾随逗号，如 {"a":1,} 或 [1,2,]
  const removeTrailingCommas = (jsonText: string): string =>
    jsonText.replace(/,\s*([}\]])/g, '$1');

  // 处理确定按钮点击事件
  const handleOk = async () => {
    let parsed: Record<string, string>;
    try {
      // 从编辑器内容中提取 JSON 主体，忽略前后注释说明
      const jsonText = extractJsonText(batchCode);
      // 清理 JSON 尾随逗号，如 {"a":1,} 或 [1,2,]
      const normalizedJsonText = removeTrailingCommas(jsonText);

      parsed = JSON.parse(normalizedJsonText);
    } catch {
      message.warning(
        dict('PC.Pages.SystemConfig.LangContent.jsonFormatError'),
      );
      return;
    }

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      message.warning(
        dict('PC.Pages.SystemConfig.LangContent.jsonObjectRequired'),
      );
      return;
    }

    // 构建批量新增或更新多语言配置的请求参数
    const entries = Object.entries(parsed as Record<string, string>);
    const payload: I18nConfigBatchAddOrUpdateParams[] = [];

    for (const [key, value] of entries) {
      const firstDotIndex = key.indexOf('.');
      if (firstDotIndex <= 0) {
        message.warning(
          dict('PC.Pages.SystemConfig.LangContent.keyPrefixMissingError', key),
        );
        return;
      }

      const side = key.slice(0, firstDotIndex);
      if (!sideList.includes(side)) {
        message.warning(
          dict(
            'PC.Pages.SystemConfig.LangContent.keyPrefixInvalidError',
            key,
            sideList.join(', '),
          ),
        );
        return;
      }

      payload.push({
        lang,
        side,
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      });
    }

    if (!payload.length) {
      message.warning(dict('PC.Pages.SystemConfig.LangContent.atLeastOnePair'));
      return;
    }

    await runBatchAddOrUpdate(payload);
    message.success(
      dict('PC.Pages.SystemConfig.LangContent.batchProcessSuccess'),
    );
    onSuccess();
  };

  return (
    <Modal
      title={dict('PC.Pages.SystemConfig.LangContent.batchAddOrUpdateTitle')}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={dict('PC.Common.Global.confirm')}
      cancelText={dict('PC.Common.Global.cancel')}
      confirmLoading={loading}
      width={820}
      destroyOnHidden
    >
      <CodeEditor
        codeLanguage={CodeLangEnum.JSON}
        height="400px"
        codeOptimizeVisible={false}
        value={batchCode}
        onChange={(code) => setBatchCode(code || '')}
        editorOptions={{
          wordWrap: 'bounded',
          wrappingStrategy: 'advanced', // 更智能的换行算法
          wrappingIndent: 'indent', // 换行后保持缩进
          scrollBeyondLastLine: false, // 禁止滚动到空白区域
          minimap: { enabled: false },
        }}
      />
    </Modal>
  );
};

export default BatchKeyValueModal;
