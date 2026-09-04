import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiConnectorSpaceImport,
  apiConnectorSpaceImportApply,
} from '@/services/systemManage';
import type { ConnectorImportDiff } from '@/types/interfaces/systemManage';
import { UploadOutlined } from '@ant-design/icons';
import {
  Button,
  Drawer,
  Input,
  Table,
  Tag,
  Tooltip,
  Upload,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import styles from './index.less';

export interface ConnectorImportDrawerProps {
  open: boolean;
  onClose: () => void;
  /** 导入目标空间 ID（接口 spaceId 挂 query） */
  spaceId: number;
  /** 导入成功回调（父组件用它刷新连接器列表） */
  onImported?: () => void;
}

/** diff 条目操作列文案映射（op → 中文标签） */
const OP_LABEL_MAP: Record<string, string> = {
  add: '新增',
  update: '更新',
  unchanged: '不变',
  skip: '跳过',
};

/** diff 条目操作列颜色映射（antd Tag 预设色） */
const OP_COLOR_MAP: Record<string, string> = {
  add: 'green',
  update: 'default',
  unchanged: 'default',
  skip: 'orange',
};

/** 表格行：diff 条目 + 展开后的「对象」展示值与行 key */
interface ConnectorImportDiffItemRow {
  key: string;
  type: string;
  object: string;
  op: string;
  reason?: string | null;
}

/** diff 明细列：类型（连接器/工具）、对象（service / actionKey）、操作（op 标签） */
const DIFF_COLUMNS: ColumnsType<ConnectorImportDiffItemRow> = [
  {
    title: '类型',
    dataIndex: 'type',
    width: 88,
    render: (type: string) =>
      type === 'provider' ? '连接器' : type === 'action' ? '工具' : type ?? '-',
  },
  {
    title: '对象',
    dataIndex: 'object',
    render: (object: string) => (
      <span className={styles.diffObject}>{object}</span>
    ),
  },
  {
    title: '操作',
    dataIndex: 'op',
    width: 88,
    render: (op: string, row) => {
      const tag = (
        <Tag color={OP_COLOR_MAP[op] ?? 'default'}>
          {OP_LABEL_MAP[op] ?? op ?? '-'}
        </Tag>
      );
      // skip 时展示跳过原因（Tooltip 悬浮查看）
      return row.reason ? <Tooltip title={row.reason}>{tag}</Tooltip> : tag;
    },
  },
];

/** diff.items → 表格行（对象 = service 或 service / actionKey） */
const toDiffRows = (
  items: ConnectorImportDiff['items'],
): ConnectorImportDiffItemRow[] =>
  (items ?? []).map((item, index) => ({
    key: `${item.type ?? ''}-${item.service ?? ''}-${
      item.actionKey ?? ''
    }-${index}`,
    type: item.type ?? '',
    object: item.actionKey
      ? `${item.service ?? ''} / ${item.actionKey}`
      : item.service ?? '-',
    op: item.op ?? '',
    reason: item.reason,
  }));

/**
 * 空间连接器导入抽屉（工作空间连接器页「导入」入口）
 *
 * 交互与管理端 ConnectorImportDrawer 一致，差异仅在接口：
 *   - 预览 diff：POST /api/connector/import/space?spaceId=
 *   - 确认导入：POST /api/connector/import/space/apply?spaceId=
 */
const ConnectorImportDrawer: React.FC<ConnectorImportDrawerProps> = ({
  open,
  onClose,
  spaceId,
  onImported,
}) => {
  // 导入包 JSON 内容（粘贴或选择文件自动带入）
  const [content, setContent] = useState<string>('');
  // 已选择的文件名（未选择时展示「未选择任何文件」）
  const [fileName, setFileName] = useState<string>('');
  // 预览结果（含 importId，确认导入时引用；内容变更后失效需重新预览）
  const [diff, setDiff] = useState<ConnectorImportDiff | null>(null);
  // 预览中：给「预览导入 diff」按钮加 loading，防止重复提交
  const [previewing, setPreviewing] = useState<boolean>(false);
  // 导入中：给「确认导入」按钮加 loading，防止重复提交
  const [importing, setImporting] = useState<boolean>(false);

  const drawerWidth = useMemo(() => {
    if (typeof window === 'undefined') return 720;
    const w = window.innerWidth || 720;
    return Math.min(720, Math.max(360, Math.floor(w * 0.92)));
  }, []);

  useEffect(() => {
    if (!open) {
      setContent('');
      setFileName('');
      setDiff(null);
    }
  }, [open]);

  /** 选择文件：读取文本内容自动粘贴到输入框（不上传）；内容变了旧 diff 失效 */
  const handleFileSelected = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      setContent(text);
      setFileName(file.name);
      setDiff(null);
    } catch {
      message.error('读取文件失败');
    }
  }, []);

  /**
   * 预览导入 diff：POST /api/connector/import/space?spaceId=
   * 入参即输入框中的导入包 JSON（解析后提交），响应返回 importId +
   * 四类变更计数 + items 明细，不执行导入
   */
  const handlePreviewDiff = useCallback(async () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(content.trim());
    } catch {
      message.error('导入内容不是有效的 JSON');
      return;
    }

    try {
      setPreviewing(true);
      const response = await apiConnectorSpaceImport(spaceId, parsed);
      if (response?.code !== SUCCESS_CODE || !response.data) {
        throw new Error(response?.message || 'preview import failed');
      }
      setDiff(response.data);
    } catch {
      message.error('预览导入 diff 失败');
    } finally {
      setPreviewing(false);
    }
  }, [content, spaceId]);

  /**
   * 确认导入：POST /api/connector/import/space/apply?spaceId=，
   * 入参仅预览返回的 importId；成功后关闭抽屉并触发 onImported ——
   * 父组件刷新空间连接器列表（GET /api/connector/providers?scope=space）
   */
  const handleConfirmImport = useCallback(async () => {
    const importId = diff?.importId;
    if (!importId) return;

    try {
      setImporting(true);
      const response = await apiConnectorSpaceImportApply(spaceId, {
        importId,
      });
      if (response?.code !== SUCCESS_CODE) {
        throw new Error(response?.message || 'apply import failed');
      }
      message.success('导入成功');
      onClose();
      onImported?.();
    } catch {
      message.error('确认导入失败');
    } finally {
      setImporting(false);
    }
  }, [diff, onClose, onImported, spaceId]);

  /** 内容变更（粘贴/编辑/重新选文件）：已预览的 diff 与 importId 失效，清掉 */
  const handleContentChange = useCallback((text: string) => {
    setContent(text);
    setDiff(null);
  }, []);

  return (
    <Drawer
      className={styles.drawer}
      title="导入连接器"
      placement="right"
      open={open}
      onClose={onClose}
      width={drawerWidth}
      destroyOnHidden
      rootStyle={{ overflow: 'hidden' }}
      styles={{ body: { padding: 0 }, footer: { padding: '12px 24px 16px' } }}
      footer={
        /* 原生 footer 插槽：结构上位于滚动区之外，diff 明细再长按钮也吸底常驻 */
        <div className={styles.footer}>
          {/* 输入框无内容时禁用预览 */}
          <Button
            disabled={!content.trim()}
            loading={previewing}
            onClick={handlePreviewDiff}
          >
            预览导入 diff
          </Button>
          {/* importId 来自预览结果：未预览（或内容已变更）时不可确认 */}
          <Button
            type="primary"
            disabled={!diff?.importId}
            loading={importing}
            onClick={handleConfirmImport}
          >
            确认导入
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        <div className={styles.fieldLabel}>
          导入包（「导出」生成的 JSON；粘贴或选择文件）
        </div>
        <Input.TextArea
          className={styles.jsonInput}
          value={content}
          onChange={(event) => handleContentChange(event.target.value)}
          rows={8}
          placeholder={
            '{"source":"open_connector","providers":[\n  {"service":"...","authType":"...","baseUrl":"...","actions":[\n    {"actionKey":"...","httpSpec":{...}}]}]}'
          }
          autoComplete="off"
        />
        {/* 选择文件：读取内容自动填入上方输入框（beforeUpload 返回 false 阻止上传） */}
        <div className={styles.fileRow}>
          <Upload
            accept=".json,application/json"
            showUploadList={false}
            beforeUpload={(file) => {
              void handleFileSelected(file);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <span className={styles.fileHint}>
            {fileName || '未选择任何文件'}
          </span>
        </div>
        {/* 预览结果：四类变更计数 chips + 明细表格 */}
        {diff ? (
          <div className={styles.diffSection}>
            <div className={styles.diffStats}>
              <span className={styles.statPill}>新增 {diff.addCount ?? 0}</span>
              <span className={styles.statPill}>
                更新 {diff.updateCount ?? 0}
              </span>
              <span className={styles.statPill}>
                不变 {diff.unchangedCount ?? 0}
              </span>
              {/* 受保护跳过以警示色区分 */}
              <span className={`${styles.statPill} ${styles.statPillWarning}`}>
                跳过 {diff.skipProtectedCount ?? 0}
              </span>
            </div>
            <Table<ConnectorImportDiffItemRow>
              className={styles.diffTable}
              columns={DIFF_COLUMNS}
              dataSource={toDiffRows(diff.items)}
              size="small"
              pagination={{ pageSize: 10, showSizeChanger: false }}
            />
          </div>
        ) : null}
      </div>
    </Drawer>
  );
};

export default memo(ConnectorImportDrawer);
