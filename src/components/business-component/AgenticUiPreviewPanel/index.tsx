import type {
  AgenticUiActionPayload,
  AgenticUiNode,
  AgenticUiSurface,
} from '@/types/interfaces/agenticUi';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
  Select,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import classNames from 'classnames';
import React, { createContext, useContext, useMemo, useState } from 'react';
import styles from './index.less';

const cx = classNames.bind(styles);

const SUPPORTED_AGENTIC_UI_COMPONENTS = new Set([
  'Page',
  'Section',
  'Card',
  'Text',
  'Markdown',
  'Statistic',
  'Table',
  'List',
  'Alert',
  'Button',
  'ButtonGroup',
  'JsonView',
  'Form',
  'Input',
  'TextArea',
  'NumberInput',
  'Select',
  'Switch',
  'Checkbox',
]);

export interface AgenticUiPreviewPanelProps {
  surface: AgenticUiSurface | null;
  surfaces?: AgenticUiSurface[];
  onSurfaceSelect?: (surface: AgenticUiSurface) => void;
  onAction?: (action: AgenticUiActionPayload) => void;
  onClear?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

interface AgenticUiRenderContextValue {
  surfaceId: string;
  onAction?: (action: AgenticUiActionPayload) => void;
}

const AgenticUiRenderContext =
  createContext<AgenticUiRenderContextValue | null>(null);

const toText = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const toNumber = (value: unknown): number | string =>
  typeof value === 'number' || typeof value === 'string' ? value : '-';

const toRecordArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) &&
  value.every((item) => item && typeof item === 'object')
    ? (value as Record<string, unknown>[])
    : [];

const getChildren = (
  node: AgenticUiNode,
  renderNode: (child: AgenticUiNode, index: number) => React.ReactNode,
) =>
  node.children?.length ? (
    <div className={cx(styles['node-children'])}>
      {node.children.map(renderNode)}
    </div>
  ) : null;

const collectSurfaceDiagnostics = (
  node: AgenticUiNode | undefined,
  messages: string[] = [],
  path = 'root',
) => {
  if (!node) {
    return messages;
  }

  if (!SUPPORTED_AGENTIC_UI_COMPONENTS.has(node.type)) {
    messages.push(`${path}: 暂不支持组件 ${node.type}`);
  }

  if (
    [
      'Input',
      'TextArea',
      'NumberInput',
      'Select',
      'Switch',
      'Checkbox',
    ].includes(node.type) &&
    !toText(node.props?.name || node.id)
  ) {
    messages.push(`${path}: 表单组件 ${node.type} 缺少 name 或 id`);
  }

  node.children?.forEach((child, index) => {
    collectSurfaceDiagnostics(child, messages, `${path}.children[${index}]`);
  });

  return messages;
};

const AgenticUiRenderer: React.FC<{ node: AgenticUiNode }> = ({ node }) => {
  const props = node.props || {};
  const context = useContext(AgenticUiRenderContext);

  const renderChild = (child: AgenticUiNode, index: number) => (
    <AgenticUiRenderer
      key={child.id || `${child.type}-${index}`}
      node={child}
    />
  );

  switch (node.type) {
    case 'Page':
      return (
        <div className={cx(styles.page)}>
          {props.title ? (
            <h2 className={cx(styles['page-title'])}>{toText(props.title)}</h2>
          ) : null}
          {getChildren(node, renderChild)}
        </div>
      );

    case 'Section':
      return (
        <section className={cx(styles.section)}>
          {props.title ? (
            <h3 className={cx(styles['section-title'])}>
              {toText(props.title)}
            </h3>
          ) : null}
          {getChildren(node, renderChild)}
        </section>
      );

    case 'Card':
      return (
        <Card
          size="small"
          title={toText(props.title)}
          bordered={props.bordered !== false}
          style={{ width: '100%' }}
        >
          {getChildren(node, renderChild)}
        </Card>
      );

    case 'Text':
      return (
        <Typography.Text
          type={props.type === 'secondary' ? 'secondary' : undefined}
        >
          {toText(props.text ?? props.children)}
        </Typography.Text>
      );

    case 'Markdown':
      return (
        <Typography.Paragraph
          style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}
        >
          {toText(props.content ?? props.text)}
        </Typography.Paragraph>
      );

    case 'Statistic':
      return (
        <Statistic
          title={toText(props.label ?? props.title)}
          value={toNumber(props.value)}
          suffix={toText(props.suffix)}
          prefix={toText(props.prefix)}
        />
      );

    case 'Alert':
      return (
        <Alert
          showIcon
          type={
            ['success', 'info', 'warning', 'error'].includes(String(props.type))
              ? (props.type as 'success' | 'info' | 'warning' | 'error')
              : 'info'
          }
          message={toText(props.message)}
          description={toText(props.description)}
        />
      );

    case 'Table': {
      const dataSource = toRecordArray(props.dataSource ?? props.data);
      const propColumns = Array.isArray(props.columns) ? props.columns : [];
      const fallbackColumnKeys = dataSource[0]
        ? Object.keys(dataSource[0])
        : [];
      const columns = (propColumns.length ? propColumns : fallbackColumnKeys)
        .map((column) => {
          if (typeof column === 'string') {
            return {
              title: column,
              dataIndex: column,
              key: column,
              ellipsis: true,
            };
          }
          if (column && typeof column === 'object') {
            const columnRecord = column as Record<string, unknown>;
            const dataIndex = toText(
              columnRecord.dataIndex ?? columnRecord.key,
            );
            return {
              title: toText(columnRecord.title, dataIndex),
              dataIndex,
              key: toText(columnRecord.key, dataIndex),
              ellipsis: true,
            };
          }
          return null;
        })
        .filter(Boolean);

      return (
        <Table
          size="small"
          style={{ width: '100%' }}
          rowKey={(_, index) => String(index)}
          pagination={dataSource.length > 8 ? { pageSize: 8 } : false}
          dataSource={dataSource}
          columns={columns as any}
          scroll={{ x: true }}
        />
      );
    }

    case 'List': {
      const items = Array.isArray(props.items)
        ? props.items
        : Array.isArray(props.dataSource)
        ? props.dataSource
        : [];
      return (
        <List
          size="small"
          bordered
          dataSource={items}
          renderItem={(item) => (
            <List.Item>
              {typeof item === 'string' || typeof item === 'number'
                ? item
                : JSON.stringify(item)}
            </List.Item>
          )}
        />
      );
    }

    case 'Button':
      return (
        <Button
          type={props.variant === 'primary' ? 'primary' : 'default'}
          onClick={() => {
            context?.onAction?.({
              type: 'agentic_ui_action',
              surfaceId: context.surfaceId,
              actionId: toText(props.actionId ?? props.id, 'button_click'),
              nodeId: node.id,
              payload:
                props.payload && typeof props.payload === 'object'
                  ? (props.payload as Record<string, unknown>)
                  : {},
            });
          }}
        >
          {toText(props.text ?? props.label, 'Action')}
        </Button>
      );

    case 'Form':
      return (
        <Form
          layout="vertical"
          onFinish={(values) => {
            context?.onAction?.({
              type: 'agentic_ui_action',
              surfaceId: context.surfaceId,
              actionId: toText(props.actionId, 'form_submit'),
              nodeId: node.id,
              payload: values,
            });
          }}
          style={{ width: '100%' }}
        >
          {getChildren(node, renderChild)}
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">
              {toText(props.submitText, '提交')}
            </Button>
          </Form.Item>
        </Form>
      );

    case 'Input':
    case 'TextArea':
    case 'NumberInput':
    case 'Select':
    case 'Switch':
    case 'Checkbox': {
      const name = toText(props.name || node.id);
      if (!name) {
        return (
          <Alert
            type="warning"
            showIcon
            message={`Form component ${node.type} requires name.`}
          />
        );
      }
      const label = toText(props.label, name);
      const placeholder = toText(props.placeholder);
      const required = props.required === true;
      const rules = required
        ? [{ required: true, message: `${label} 必填` }]
        : [];

      if (node.type === 'TextArea') {
        return (
          <Form.Item name={name} label={label} rules={rules}>
            <Input.TextArea placeholder={placeholder} rows={4} />
          </Form.Item>
        );
      }

      if (node.type === 'NumberInput') {
        return (
          <Form.Item name={name} label={label} rules={rules}>
            <InputNumber placeholder={placeholder} style={{ width: '100%' }} />
          </Form.Item>
        );
      }

      if (node.type === 'Select') {
        const options = Array.isArray(props.options)
          ? props.options.map((option) => {
              if (typeof option === 'string') {
                return { label: option, value: option };
              }
              if (option && typeof option === 'object') {
                const optionRecord = option as Record<string, unknown>;
                return {
                  label: toText(optionRecord.label ?? optionRecord.value),
                  value: toText(optionRecord.value ?? optionRecord.label),
                };
              }
              return { label: String(option), value: String(option) };
            })
          : [];
        return (
          <Form.Item name={name} label={label} rules={rules}>
            <Select placeholder={placeholder} options={options} />
          </Form.Item>
        );
      }

      if (node.type === 'Switch') {
        return (
          <Form.Item
            name={name}
            label={label}
            rules={rules}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        );
      }

      if (node.type === 'Checkbox') {
        return (
          <Form.Item name={name} valuePropName="checked" rules={rules}>
            <Checkbox>{label}</Checkbox>
          </Form.Item>
        );
      }

      return (
        <Form.Item name={name} label={label} rules={rules}>
          <Input placeholder={placeholder} />
        </Form.Item>
      );
    }

    case 'ButtonGroup':
      return (
        <div className={cx(styles['button-group'])}>
          {node.children?.map(renderChild)}
        </div>
      );

    case 'JsonView':
      return (
        <pre className={cx(styles['json-view'])}>
          {JSON.stringify(props.value ?? props.data ?? props, null, 2)}
        </pre>
      );

    default:
      return (
        <div className={cx(styles.unsupported)}>
          Unsupported component: {node.type}
        </div>
      );
  }
};

const AgenticUiPreviewPanel: React.FC<AgenticUiPreviewPanelProps> = ({
  surface,
  surfaces = [],
  onSurfaceSelect,
  onAction,
  onClear,
  onClose,
  showCloseButton = true,
}) => {
  const [showRaw, setShowRaw] = useState(false);
  const surfaceStatus = surface?.status;
  const rootTitle = toText(surface?.root?.props?.title);
  const subtitle = useMemo(() => {
    if (!surface) {
      return '';
    }
    return `${surface.surfaceId} · ${surface.status}`;
  }, [surface]);
  const selectableSurfaces = surfaces.length
    ? surfaces
    : surface
    ? [surface]
    : [];
  const diagnostics = useMemo(() => {
    if (!surface) {
      return [];
    }
    return [
      ...(surface.metadata?.validationErrors || []),
      ...collectSurfaceDiagnostics(surface.root),
    ];
  }, [surface]);

  return (
    <div className={cx(styles['preview-panel'])}>
      <div className={cx(styles['preview-header'])}>
        <div>
          <div className={cx(styles['preview-title'])}>
            {rootTitle || 'AI UI 预览'}
          </div>
          {subtitle ? (
            <div className={cx(styles['preview-subtitle'])}>{subtitle}</div>
          ) : null}
        </div>
        <div className={cx(styles['preview-actions'])}>
          {surface ? (
            <Tag
              color={
                surface.status === 'ready'
                  ? 'success'
                  : surface.status === 'error'
                  ? 'error'
                  : 'processing'
              }
            >
              {surface.status}
            </Tag>
          ) : null}
          {selectableSurfaces.length > 1 ? (
            <Select
              size="small"
              value={surface?.surfaceId}
              style={{ width: 180 }}
              options={selectableSurfaces.map((item) => ({
                label: item.root?.props?.title
                  ? toText(item.root.props.title)
                  : item.surfaceId,
                value: item.surfaceId,
              }))}
              onChange={(surfaceId) => {
                const target = selectableSurfaces.find(
                  (item) => item.surfaceId === surfaceId,
                );
                if (target) {
                  onSurfaceSelect?.(target);
                }
              }}
            />
          ) : null}
          {surface ? (
            <Button size="small" onClick={() => setShowRaw((prev) => !prev)}>
              {showRaw ? '预览' : 'JSON'}
            </Button>
          ) : null}
          {onClear ? (
            <Button size="small" onClick={onClear}>
              清空
            </Button>
          ) : null}
          {showCloseButton ? (
            <Button size="small" onClick={onClose}>
              关闭
            </Button>
          ) : null}
        </div>
      </div>
      <div className={cx(styles['preview-content'])}>
        {!surface ? (
          <Empty description="暂无 AI UI 预览" />
        ) : surfaceStatus === 'error' ? (
          <Alert
            type="error"
            showIcon
            message="AI UI 预览生成失败"
            description="MCP 返回的 Agentic UI surface 状态为 error。"
          />
        ) : showRaw ? (
          <pre className={cx(styles['json-view'])}>
            {JSON.stringify(surface, null, 2)}
          </pre>
        ) : !surface.root ? (
          <Alert
            type="info"
            showIcon
            message="AI UI 正在构建"
            description="当前 surface 暂未包含 root，等待后续 append/patch/replace 更新。"
          />
        ) : (
          <>
            {diagnostics.length ? (
              <Alert
                className={cx(styles['diagnostic-alert'])}
                type="warning"
                showIcon
                message="AI UI 预览存在可修正项"
                description={
                  <ul className={cx(styles['diagnostic-list'])}>
                    {diagnostics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}
            <div className={cx(styles['rendered-surface'])}>
              <AgenticUiRenderContext.Provider
                value={{ surfaceId: surface.surfaceId, onAction }}
              >
                <AgenticUiRenderer node={surface.root} />
              </AgenticUiRenderContext.Provider>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AgenticUiPreviewPanel;
