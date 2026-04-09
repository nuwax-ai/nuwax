import CodeEditor from '@/components/CodeEditor';
import { apiI18nConfigBatchAddOrUpdate } from '@/services/i18n';
import { CodeLangEnum } from '@/types/enums/plugin';
import type { I18nConfigBatchAddOrUpdateParams } from '@/types/interfaces/i18n';
import { Modal, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useRequest } from 'umi';

interface BatchKeyValueModalProps {
  lang: string;
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// 批量新增或更新键值对默认代码
const DefaultBatchCode = `
/**
 * 批量新增或更新键值对
 * JSON格式：{ "key": "value" }
 * key格式："端.模块.页面.组件.文本key", 文本key为小驼峰，其他为大驼峰
 * 注意：key值必须要由点号（.）分割，由英文大写字母开头，可以使用英文大写字母、下划线（_）、点号（.）组成，不能使用中文、特殊字符等
 * 示例：
 * {
 *   "PC.Pages.SystemConfig.LangContent.title": "键值对管理"
 * }
 */
{
  "key": "value"
}`;

/**
 * 批量新增或更新键值对弹窗
 */
const BatchKeyValueModal: React.FC<BatchKeyValueModalProps> = ({
  lang,
  open,
  onCancel,
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
      message.error('JSON 格式错误，请检查后重试');
      return;
    }

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      message.error('请输入对象格式的键值对 JSON');
      return;
    }

    // 构建批量新增或更新多语言配置的请求参数
    const payload = Object.entries(parsed as Record<string, string>).map(
      ([key, value]) =>
        ({
          lang,
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        } as I18nConfigBatchAddOrUpdateParams),
    );

    if (!payload.length) {
      message.error('请至少填写一条键值对');
      return;
    }

    await runBatchAddOrUpdate(payload);
    message.success('批量处理成功');
    onSuccess();
  };

  return (
    <Modal
      title="批量新增或更新键值对"
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText="确定"
      cancelText="取消"
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
