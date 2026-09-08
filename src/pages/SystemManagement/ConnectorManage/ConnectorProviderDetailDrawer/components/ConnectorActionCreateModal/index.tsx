import { SUCCESS_CODE } from '@/constants/codes.constants';
import {
  apiConnectorBindable,
  apiSystemConnectorActionCreate,
  apiSystemConnectorActionUpdate,
} from '@/services/systemManage';
import { apiSpaceList } from '@/services/workspace';
import type { RequestResponse } from '@/types/interfaces/request';
import type {
  ConnectorActionBindSpec,
  ConnectorActionBodyField,
  ConnectorActionBodyItem,
  ConnectorActionHttpSpec,
  ConnectorActionInputArg,
  ConnectorBindableArg,
  ConnectorBindableItem,
  ConnectorProviderAction,
  ConnectorProviderInfo,
  CreateConnectorActionParams,
} from '@/types/interfaces/systemManage';
import type { SpaceInfo } from '@/types/interfaces/workspace';
import { CloseOutlined, PlusOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd';
import {
  Button,
  Checkbox,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
} from 'antd';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styles from './index.less';

/**
 * 新增工具弹窗
 *
 * 触发场景：连接器提供方详情抽屉
 *   - 工具栏「+ 添加工具」（新增模式：表单空白，标题「新增工具」）
 *   - 工具卡片「编辑」按钮（编辑模式：传 editAction 回填该工具定义，
 *     标题「编辑工具」，ACTIONKEY 禁改）
 *
 * 表单结构（与设计稿一致）：
 *   1. 基础信息：ACTIONKEY / 工具名称 / 工具说明（选填）/ 标签 / 执行类型
 *   2. HTTP 请求声明（仅执行类型 = HTTP 接口时展示）：
 *      方法（默认 GET）+ 路径 / 超时步进 + 响应提取路径 / 原样请求体
 *      + QUERY 参数映射 / HEADER 映射 / BODY 字段 三个映射卡片（行可增删）。
 *      BODY 字段支持递归嵌套：object 加子字段、array 声明元素结构（见 BodyFieldRow）
 *   3. 绑定声明区（仅执行类型 = 绑定插件 / 绑定工作流时展示）：
 *      空间（GET /api/space/list，默认第一个空间）+
 *      可绑定列表（GET /api/connector/bindable?type=plugin|workflow&spaceId=xxx，
 *      默认不选中，value = id、label = name）+「刷新列表」按钮重新拉取；
 *      选中后其 inputArgs 递归回填输入参数声明（只读展示，空则「暂无输入参数」）
 *   4. 输入参数声明（类型化 Arg 树，行可增删；Object / Array_Object
 *      可加下级参数，任意层级嵌套，见 ArgRow）
 *   5. 底部「保存工具」按钮
 *
 * 保存流程（「保存工具」按钮）：
 *   1. form.validateFields() 校验必填项（actionKey / 工具名称 / 请求路径等）
 *   2. 新增：POST /api/system/connector/providers/{service}/actions；
 *      编辑：PUT /api/system/connector/providers/{service}/actions/{actionKey}
 *      （两者 body 一致，编辑按 actionKey 寻址）
 *   3. 成功后关闭弹窗并触发 onCreated —— 父组件刷新抽屉内工具列表，
 *      并重新拉取连接器列表（GET /api/system/connector/providers）
 *
 * 提交契约：绑定声明区选中项 id 提交为 execRef；输入参数嵌套提交
 * children → subArgs（见 toInputArgNode）；BODY 字段嵌套提交 value →
 * mapping、children → children、element → item（见 toBodyFieldNode）。
 */

/**
 * 执行类型选项：HTTP 接口 / 绑定插件 / 绑定工作流
 * 表单值为页面层语义（HTTP / PLUGIN / WORKFLOW）；
 * 提交时再映射为后端枚举：HTTP → DECLARATIVE，其余原样
 */
const EXECUTION_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'HTTP 接口', value: 'HTTP' },
  { label: '绑定插件', value: 'PLUGIN' },
  { label: '绑定工作流', value: 'WORKFLOW' },
];

/** HTTP 方法选项 */
const HTTP_METHOD_OPTIONS: Array<{ label: string; value: string }> = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
].map((method) => ({ label: method, value: method }));

/** BODY 字段类型选项（object 可加子字段；array 指向值为整个数组的输入参数） */
const BODY_FIELD_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  'string',
  'number',
  'boolean',
  'object',
  'array',
].map((type) => ({ label: type, value: type }));

/**
 * 输入参数类型选项：5 个基本类型 + 6 个 Array_* 数组类型
 * （Object 与 Array_Object 可加下级参数，子参数编辑待后续实现）
 */
const ARG_TYPE_OPTIONS: Array<{ label: string; value: string }> = [
  'String',
  'Integer',
  'Number',
  'Boolean',
  'Object',
  'Array_File',
  'Array_String',
  'Array_Integer',
  'Array_Number',
  'Array_Boolean',
  'Array_Object',
].map((type) => ({ label: type, value: type }));

export interface ConnectorActionCreateModalProps {
  /** 是否打开 */
  open: boolean;
  /** 当前连接器行（新增提交时用 record.service 拼创建接口的 URL path） */
  record: ConnectorProviderInfo | null;
  /**
   * 编辑模式：要回填的工具定义（详情接口 actions 列表项）
   * 不传 / 传 null = 新增模式；传入时回填表单、标题变为「编辑工具」、
   * ACTIONKEY 禁改（更新接口按 actionKey 寻址）、
   * 保存走 PUT /api/system/connector/providers/{service}/actions/{actionKey}
   */
  editAction?: ConnectorProviderAction | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 创建/编辑成功回调（父组件用它刷新工具列表与连接器列表） */
  onCreated?: () => void;
  /**
   * 自定义工具更新接口（工作空间连接器页传）：
   * POST /api/connector/actions/{id}，按工具 id 寻址，body 与创建一致。
   * 不传则编辑走管理端
   * PUT /api/system/connector/providers/{service}/actions/{actionKey}。
   * 仅编辑模式调用。
   */
  updateAction?: (
    params: CreateConnectorActionParams & { id: string | number },
  ) => Promise<RequestResponse<null>>;
  /**
   * 自定义工具创建接口（工作空间连接器页传）：
   * POST /api/connector/providers/{service}/actions，body 与管理端一致。
   * 不传则新增走管理端
   * POST /api/system/connector/providers/{service}/actions。
   * 仅新增模式调用。
   */
  createAction?: (
    params: CreateConnectorActionParams & { service: string },
  ) => Promise<RequestResponse<null>>;
}

/**
 * BODY 字段表单节点（递归结构，仅用于页面交互展示）
 * - type = object：value 由子字段组成（无映射值输入框），children 为子字段列表
 * - type = array：value 指向「值为整个数组」的输入参数，element 声明元素结构；
 *   元素为 object 时可加 element.children 子字段，元素为 array 时
 *   element.element 继续嵌套（每层都是完整的元素声明节点，层级不限）
 */
interface BodyFieldFormRow {
  name?: string;
  type?: string;
  value?: string;
  /** type = object 时的子字段（每个又是完整节点，可任意层级嵌套） */
  children?: BodyFieldFormRow[];
  /** type = array 时的元素声明（一层元素结构，可继续嵌套） */
  element?: BodyFieldElementFormNode;
}

/**
 * array 的元素声明节点（递归结构，仅用于页面交互展示）
 * - type = object：children 为元素的子字段（完整字段行，可继续嵌套）
 * - type = array：element 指向下一层元素声明（如 string[][] 的二维数组）
 */
interface BodyFieldElementFormNode {
  /** 元素类型（与字段类型一致的 5 个选项） */
  type?: string;
  /** 元素类型 = object 时的元素子字段 */
  children?: BodyFieldFormRow[];
  /** 元素类型 = array 时的下一层元素声明 */
  element?: BodyFieldElementFormNode;
}

/**
 * BODY 字段行是否有可提交内容（字段名或映射值）
 * object 行没有映射值输入框，填了字段名即视为有内容；完全没填的行不提交
 */
const hasBodyFieldContent = (row: BodyFieldFormRow): boolean =>
  Boolean(row?.name?.trim() || row?.value?.trim());

/**
 * 表单字段行 → 提交的 bodyFields 节点（递归）
 *
 * - mapping：object 的值由子字段组成，不传；其余类型没填就不传（「没填就不传」）
 * - children / item：仅在对应类型下序列化；中途切换类型残留在表单
 *   store 里的嵌套数据会被自然丢弃（按 type 决定走哪个分支）
 * - 表单 element → 提交 item；表单 value → 提交 mapping
 */
const toBodyFieldNode = (row: BodyFieldFormRow): ConnectorActionBodyField => {
  const node: ConnectorActionBodyField = {
    name: row.name?.trim() ?? '',
    type: row.type ?? 'string',
  };
  if (row.type !== 'object') {
    const mapping = row.value?.trim();
    if (mapping) {
      node.mapping = mapping;
    }
  }
  if (row.type === 'object') {
    const children = (row.children ?? [])
      .filter(hasBodyFieldContent)
      .map(toBodyFieldNode);
    if (children.length) {
      node.children = children;
    }
  }
  if (row.type === 'array' && row.element?.type) {
    // 与 toBodyElementNode 相互递归（元素 children 又是完整字段节点），无法避免前置引用
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    node.item = toBodyElementNode(row.element);
  }
  return node;
};

/**
 * 表单元素声明节点 → 提交的 item 节点（递归）
 * 元素仅声明结构：只有 type / children / item，没有 name / mapping
 */
const toBodyElementNode = (
  element: BodyFieldElementFormNode,
): ConnectorActionBodyItem => {
  const node: ConnectorActionBodyItem = {
    type: element.type ?? 'string',
  };
  if (element.type === 'object') {
    const children = (element.children ?? [])
      .filter(hasBodyFieldContent)
      .map(toBodyFieldNode);
    if (children.length) {
      node.children = children;
    }
  }
  if (element.type === 'array' && element.element?.type) {
    node.item = toBodyElementNode(element.element);
  }
  return node;
};

/**
 * 提交的 bodyFields 节点 → BODY 字段表单行（递归回填，编辑用）
 * - mapping → value（object 无映射值，不回填）
 * - children / item 仅在对应类型下回填（与序列化分支对称）
 */
const fromBodyFieldNode = (
  node: ConnectorActionBodyField,
): BodyFieldFormRow => {
  const row: BodyFieldFormRow = {
    name: node.name ?? '',
    type: node.type ?? 'string',
  };
  if (node.type !== 'object') {
    row.value = node.mapping ?? '';
  }
  if (node.type === 'object' && node.children?.length) {
    row.children = node.children.map(fromBodyFieldNode);
  }
  if (node.type === 'array' && node.item) {
    // 与 fromBodyItemNode 相互递归（元素的 object 子字段又是完整字段节点），
    // 无法避免前置引用
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    row.element = fromBodyItemNode(node.item);
  }
  return row;
};

/** 提交的 item 元素声明节点 → 元素表单节点（递归回填，编辑用） */
const fromBodyItemNode = (
  item: ConnectorActionBodyItem,
): BodyFieldElementFormNode => ({
  type: item.type ?? 'string',
  children:
    item.type === 'object' && item.children?.length
      ? item.children.map(fromBodyFieldNode)
      : undefined,
  element:
    item.type === 'array' && item.item
      ? fromBodyItemNode(item.item)
      : undefined,
});

/**
 * 输入参数表单节点（递归结构，仅用于页面交互展示）
 * - type = Object / Array_Object：可通过「添加下级参数」加 children，
 *   子参数又是完整节点，可任意层级嵌套
 * - Array_Object 的下级参数描述数组元素（object）的字段结构
 */
interface InputArgFormRow {
  name?: string;
  description?: string;
  type?: string;
  required?: boolean;
  /** type = Object / Array_Object 时的下级参数 */
  children?: InputArgFormRow[];
}

/** 输入参数行是否有可提交内容：填了参数名即视为有内容，完全没填的行不提交 */
const hasInputArgContent = (row: InputArgFormRow): boolean =>
  Boolean(row?.name?.trim());

/**
 * 表单输入参数行 → 提交的 inputArgs 节点（递归）
 *
 * - description：没填就不传（「没填就不传」）
 * - subArgs：仅 dataType = Object / Array_Object 时序列化表单 children；
 *   中途切换类型残留在表单 store 里的下级参数会被自然丢弃（按类型决定分支）
 * - 表单 children → 提交 subArgs；表单 type → 提交 dataType
 */
const toInputArgNode = (row: InputArgFormRow): ConnectorActionInputArg => {
  const arg: ConnectorActionInputArg = {
    name: row.name?.trim() ?? '',
    dataType: row.type ?? 'String',
  };
  const description = row.description?.trim();
  if (description) {
    arg.description = description;
  }
  if (row.required) {
    arg.require = true;
  }
  if (row.type === 'Object' || row.type === 'Array_Object') {
    const subArgs = (row.children ?? [])
      .filter(hasInputArgContent)
      .map(toInputArgNode);
    if (subArgs.length) {
      arg.subArgs = subArgs;
    }
  }
  return arg;
};

/**
 * bindable 返回的参数节点 → 输入参数表单行（递归回填，只读展示用）
 * - dataType → type、require → required 勾选
 * - 嵌套取 subArgs（null 时回退 children，两者后端都可能返回 null）
 */
const fromBindableArg = (arg: ConnectorBindableArg): InputArgFormRow => {
  const subs = arg.subArgs?.length ? arg.subArgs : arg.children ?? [];
  return {
    name: arg.name ?? '',
    description: arg.description ?? '',
    type: arg.dataType ?? 'String',
    required: arg.require === true,
    children: subs.length ? subs.map(fromBindableArg) : undefined,
  };
};

/** 详情返回的输入参数节点 → 输入参数表单行（递归回填，编辑用） */
const fromActionArg = (arg: ConnectorActionInputArg): InputArgFormRow => ({
  name: arg.name ?? '',
  description: arg.description ?? '',
  type: arg.dataType ?? 'String',
  required: arg.require === true,
  children: arg.subArgs?.length ? arg.subArgs.map(fromActionArg) : undefined,
});

/** 新增工具表单值（form.validateFields 的返回结构） */
interface ConnectorActionFormValues {
  actionKey: string;
  name: string;
  description?: string;
  /** 标签：逗号分隔字符串（提交前拆成数组） */
  tags?: string;
  /** 执行类型（页面层语义；提交时映射为后端枚举 DECLARATIVE / PLUGIN / WORKFLOW） */
  executionType: 'HTTP' | 'PLUGIN' | 'WORKFLOW';
  method?: string;
  path?: string;
  timeoutMs?: number;
  responsePath?: string;
  rawBodyParam?: string;
  queryMappings?: Array<{ name?: string; value?: string }>;
  headerMappings?: Array<{ name?: string; value?: string }>;
  bodyFields?: BodyFieldFormRow[];
  inputArgs?: InputArgFormRow[];
  /** 绑定插件/工作流：筛选空间（默认第一个空间；提交时不透传后端） */
  bindSpaceId?: number | string;
  /** 绑定插件/工作流：选中的插件/工作流标识（提交时作 execRef） */
  bindRef?: string;
}

/** 映射对象（{ 参数名: 值来源 }）→ 映射行数组（编辑回填用） */
const recordToMappingRows = (
  record?: Record<string, string>,
): Array<{ name: string; value: string }> =>
  Object.entries(record ?? {}).map(([name, value]) => ({
    name,
    value: value ?? '',
  }));

/**
 * 详情接口返回的工具定义 → 编辑回填表单值
 *
 * - execType 映射回页面层语义：DECLARATIVE → HTTP，其余原样
 * - httpSpec 按执行类型二选一解读：
 *   DECLARATIVE → HTTP 请求声明（query / headers 对象拆成映射行、
 *   bodyFields 递归回填、bodyRaw / timeoutMs / response.extract 原样回填）；
 *   PLUGIN / WORKFLOW → 绑定声明快照（spaceId → 空间下拉、execRef → 绑定下拉）
 * - inputArgs 递归回填输入参数声明（绑定类型且选中项在可绑定列表中时，
 *   会再被回填 effect 按最新 inputArgs 覆盖为只读展示）
 */
const toEditFormValues = (
  action: ConnectorProviderAction,
): Partial<ConnectorActionFormValues> => {
  const execType = action.execType;
  const executionType: ConnectorActionFormValues['executionType'] =
    execType === 'PLUGIN' || execType === 'WORKFLOW' ? execType : 'HTTP';
  const httpSpec = (action.httpSpec ?? undefined) as
    | ConnectorActionHttpSpec
    | undefined;
  const bindSpec = (action.httpSpec ?? undefined) as
    | ConnectorActionBindSpec
    | undefined;

  const values: Partial<ConnectorActionFormValues> = {
    actionKey: action.actionKey ?? '',
    name: action.name ?? '',
    description: action.description ?? '',
    tags: (action.tags ?? []).join(', '),
    executionType,
    inputArgs: (action.inputArgs ?? []).map(fromActionArg),
  };

  if (executionType === 'HTTP') {
    values.method = httpSpec?.method ?? 'GET';
    values.path = httpSpec?.path ?? '';
    values.timeoutMs = httpSpec?.timeoutMs;
    values.responsePath = httpSpec?.response?.extract ?? '';
    values.rawBodyParam = httpSpec?.bodyRaw ?? '';
    values.queryMappings = recordToMappingRows(httpSpec?.query);
    values.headerMappings = recordToMappingRows(httpSpec?.headers);
    values.bodyFields = (httpSpec?.bodyFields ?? []).map(fromBodyFieldNode);
  } else {
    values.bindSpaceId = bindSpec?.spaceId;
    values.bindRef = action.execRef ?? bindSpec?.bindId ?? undefined;
  }
  return values;
};

/**
 * 映射声明卡片
 *
 * 结构：Header（标题 + 添加按钮）+ 列表区（空态文案 / 映射行堆叠）
 */
const MappingCard: React.FC<{
  title: string;
  addText: string;
  emptyText: string;
  /** 是否为空列表（控制展示空态文案还是行列表） */
  isEmpty: boolean;
  /** 行列表容器类名（输入参数行用 argRows，带嵌套树指示竖线） */
  rowsClassName?: string;
  /** 只读展示（绑定项回填时）：隐藏右上角「添加」按钮 */
  readOnly?: boolean;
  onAdd: () => void;
  children?: React.ReactNode;
}> = ({
  title,
  addText,
  emptyText,
  isEmpty,
  rowsClassName,
  readOnly,
  onAdd,
  children,
}) => (
  <div className={styles.mappingCard}>
    <div className={styles.mappingCardHeader}>
      <span className={styles.mappingCardTitle}>{title}</span>
      {/* 与项目其他"添加行"按钮保持一致：dashed + PlusOutlined（只读态隐藏） */}
      {!readOnly ? (
        <Button
          type="dashed"
          size="small"
          icon={<PlusOutlined />}
          onClick={onAdd}
        >
          {addText}
        </Button>
      ) : null}
    </div>
    {isEmpty ? (
      <div className={styles.mappingCardEmpty}>{emptyText}</div>
    ) : (
      <div className={rowsClassName ?? styles.mappingRows}>{children}</div>
    )}
  </div>
);

/**
 * 单条映射行：名称 — 值 — 删除（QUERY / HEADER 行使用）
 *
 * BODY 字段行已拆到 BodyFieldRow（支持 object / array 嵌套声明），
 * typePath 参数保留供简单类型化场景复用，当前无调用方传入
 * - 删除按钮与项目 Form.List 惯例一致：text + CloseOutlined
 */
const MappingRow: React.FC<{
  namePath: Array<string | number>;
  valuePath: Array<string | number>;
  /** 传入则渲染类型下拉（仅 BODY 字段行使用） */
  typePath?: Array<string | number>;
  namePlaceholder: string;
  valuePlaceholder: string;
  onRemove: () => void;
}> = ({
  namePath,
  valuePath,
  typePath,
  namePlaceholder,
  valuePlaceholder,
  onRemove,
}) => (
  <div className={styles.mappingRow}>
    <div className={styles.mappingRowName}>
      <Form.Item name={namePath} noStyle>
        <Input placeholder={namePlaceholder} allowClear />
      </Form.Item>
    </div>
    {typePath ? (
      <div className={styles.mappingRowType}>
        <Form.Item name={typePath} noStyle>
          <Select options={BODY_FIELD_TYPE_OPTIONS} />
        </Form.Item>
      </div>
    ) : null}
    <span className={styles.mappingRowDash}>—</span>
    <div className={styles.mappingRowValue}>
      <Form.Item name={valuePath} noStyle>
        <Input placeholder={valuePlaceholder} allowClear />
      </Form.Item>
    </div>
    <Button
      type="text"
      size="small"
      className={styles.mappingRowDelete}
      icon={<CloseOutlined />}
      onClick={onRemove}
    />
  </div>
);

/**
 * 单条 BODY 字段行（递归渲染，支持任意层级嵌套）
 *
 * 行本体：字段名 + 类型 +（非 object 时）— 映射值 + 删除
 * - type = object：隐藏映射值（值由子字段组成），下方展示子字段列表 +
 *   「+ 添加子字段」按钮；子字段里再选 object / array 时同样递归处理
 * - type = array：映射值指向「值为整个数组」的输入参数，下方展示
 *   「元素结构」说明条 + 元素类型声明（见 BodyFieldElementArea）
 *
 * 嵌套坐标说明：
 * - Form.Item / Form.List 用相对 name（借助 Form.List 的上下文前缀）
 * - Form.useWatch 需要绝对路径，由 listPath + field.name 拼出
 */
const BodyFieldRow: React.FC<{
  /** 表单实例（useWatch 监听本行类型用） */
  form: FormInstance;
  /** 本行所属 Form.List 的绝对 name 路径 */
  listPath: Array<string | number>;
  /** 本行在所属 Form.List 中的 field */
  field: { name: number; key: number };
  onRemove: () => void;
}> = ({ form, listPath, field, onRemove }) => {
  const type = Form.useWatch([...listPath, field.name, 'type'], form);
  const isObject = type === 'object';
  const isArray = type === 'array';

  return (
    <div className={styles.bodyFieldItem}>
      <div className={styles.mappingRow}>
        <div className={styles.mappingRowName}>
          <Form.Item name={[field.name, 'name']} noStyle>
            <Input placeholder="字段名" allowClear />
          </Form.Item>
        </div>
        <div className={styles.mappingRowType}>
          <Form.Item name={[field.name, 'type']} noStyle>
            <Select options={BODY_FIELD_TYPE_OPTIONS} />
          </Form.Item>
        </div>
        {/* object 的值由子字段组成，不展示映射值输入框 */}
        {!isObject ? (
          <>
            <span className={styles.mappingRowDash}>—</span>
            <div className={styles.mappingRowValue}>
              <Form.Item name={[field.name, 'value']} noStyle>
                <Input
                  placeholder={
                    isArray
                      ? '值为整个数组的输入参数名'
                      : '输入参数名 / opt:参数名'
                  }
                  allowClear
                />
              </Form.Item>
            </div>
          </>
        ) : null}
        <Button
          type="text"
          size="small"
          className={styles.mappingRowDelete}
          icon={<CloseOutlined />}
          onClick={onRemove}
        />
      </div>

      {/* object：子字段列表 +「添加子字段」（没有子字段时也展示按钮） */}
      {isObject ? (
        <Form.List name={[field.name, 'children']}>
          {(childFields, { add, remove }) => (
            <div className={styles.bodyFieldChildren}>
              {childFields.map((childField) => (
                <BodyFieldRow
                  key={childField.key}
                  form={form}
                  listPath={[...listPath, field.name, 'children']}
                  field={childField}
                  onRemove={() => remove(childField.name)}
                />
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                className={styles.bodyFieldAddChild}
                onClick={() => add({ type: 'string' })}
              >
                添加子字段
              </Button>
            </div>
          )}
        </Form.List>
      ) : null}

      {/* array：元素结构声明（元素也是 array 时逐层嵌套声明） */}
      {isArray ? (
        // 与 BodyFieldElementArea 相互递归（元素的 object 子字段又是完整字段行），
        // 无法避免前置引用
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        <BodyFieldElementArea
          form={form}
          namePrefix={[field.name, 'element']}
          watchPath={[...listPath, field.name, 'element']}
        />
      ) : null}
    </div>
  );
};

/**
 * array 的「元素结构」声明区（递归渲染，与设计稿一致逐层嵌套）
 *
 * 每层结构：说明条 + 「元素」标签 + 元素类型下拉（5 个类型选项）
 * - 元素 = object：展示子字段列表 +「+ 添加子字段」（完整字段行，可继续嵌套）
 * - 元素 = array：整块再嵌套一层「元素结构」（说明条 + 元素行），层级不限
 *
 * 嵌套坐标说明（与 BodyFieldRow 相同的双坐标系）：
 * - namePrefix：本层元素节点相对所属 Form.List 的 name 前缀
 *   （字段行下第一层为 [fieldIndex, 'element']，之后每层再拼一个 'element'）
 * - watchPath：本层元素节点的绝对 name 路径（useWatch 监听元素类型用）
 */
const BodyFieldElementArea: React.FC<{
  /** 表单实例（useWatch 监听元素类型用） */
  form: FormInstance;
  /** 本层元素节点的相对 name 前缀（相对所属 Form.List） */
  namePrefix: Array<string | number>;
  /** 本层元素节点的绝对 name 路径 */
  watchPath: Array<string | number>;
}> = ({ form, namePrefix, watchPath }) => {
  const elementType = Form.useWatch([...watchPath, 'type'], form);

  return (
    <div className={styles.bodyFieldElementWrap}>
      <div className={styles.bodyFieldElementBanner}>
        元素结构（对应输入参数 Arg，仅声明，不逐项取值）
      </div>
      <div className={styles.bodyFieldElementRow}>
        <span className={styles.bodyFieldElementTag}>元素</span>
        <div className={styles.bodyFieldElementType}>
          <Form.Item name={[...namePrefix, 'type']} noStyle>
            <Select options={BODY_FIELD_TYPE_OPTIONS} placeholder="string" />
          </Form.Item>
        </div>
      </div>

      {/* 元素 = object：元素的子字段（完整字段行，可继续嵌套） */}
      {elementType === 'object' ? (
        <Form.List name={[...namePrefix, 'children']}>
          {(childFields, { add, remove }) => (
            <div className={styles.bodyFieldChildren}>
              {childFields.map((childField) => (
                <BodyFieldRow
                  key={childField.key}
                  form={form}
                  listPath={[...watchPath, 'children']}
                  field={childField}
                  onRemove={() => remove(childField.name)}
                />
              ))}
              <Button
                type="dashed"
                size="small"
                icon={<PlusOutlined />}
                className={styles.bodyFieldAddChild}
                onClick={() => add({ type: 'string' })}
              >
                添加子字段
              </Button>
            </div>
          )}
        </Form.List>
      ) : null}

      {/* 元素 = array：嵌套下一层元素结构（如 string[][] 的二维数组） */}
      {elementType === 'array' ? (
        <BodyFieldElementArea
          form={form}
          namePrefix={[...namePrefix, 'element']}
          watchPath={[...watchPath, 'element']}
        />
      ) : null}
    </div>
  );
};

/**
 * 单条输入参数行（递归渲染，支持任意层级嵌套）
 *
 * 行本体：参数名 / 参数说明 / 类型 / 必填 / 删除
 * - 类型：String / Integer / Number / Boolean / Object + Array_* 数组类型
 * - type = Object / Array_Object：下方展示下级参数列表 +
 *   「+ 添加下级参数」按钮；子参数里再选这两个类型时同样递归处理
 *   （Array_Object 的下级参数描述数组元素 object 的字段结构）
 * - 删除按钮与项目 Form.List 惯例一致：text + CloseOutlined
 *
 * 嵌套坐标说明（与 BodyFieldRow 相同的双坐标系）：
 * - Form.Item / Form.List 用相对 name（借助 Form.List 的上下文前缀）
 * - Form.useWatch 需要绝对路径，由 listPath + field.name 拼出
 */
const ArgRow: React.FC<{
  /** 表单实例（useWatch 监听本行类型用） */
  form: FormInstance;
  /** 本行所属 Form.List 的绝对 name 路径 */
  listPath: Array<string | number>;
  /** 本行在所属 Form.List 中的 field */
  field: { name: number; key: number };
  /** 只读展示（绑定插件/工作流选中项回填时）：控件禁用，隐藏删除/添加下级参数按钮 */
  readOnly?: boolean;
  onRemove: () => void;
}> = ({ form, listPath, field, readOnly, onRemove }) => {
  const type = Form.useWatch([...listPath, field.name, 'type'], form);
  const hasChildren = type === 'Object' || type === 'Array_Object';

  return (
    <div className={styles.argItem}>
      <div className={styles.argRow}>
        <div className={styles.argRowName}>
          <Form.Item name={[field.name, 'name']} noStyle>
            <Input placeholder="参数名" allowClear disabled={readOnly} />
          </Form.Item>
        </div>
        <div className={styles.argRowDescription}>
          <Form.Item name={[field.name, 'description']} noStyle>
            <Input placeholder="参数说明" allowClear disabled={readOnly} />
          </Form.Item>
        </div>
        <div className={styles.argRowType}>
          <Form.Item name={[field.name, 'type']} noStyle>
            <Select options={ARG_TYPE_OPTIONS} disabled={readOnly} />
          </Form.Item>
        </div>
        <Form.Item
          name={[field.name, 'required']}
          noStyle
          valuePropName="checked"
        >
          <Checkbox className={styles.argRowRequired} disabled={readOnly}>
            必填
          </Checkbox>
        </Form.Item>
        {!readOnly ? (
          <Button
            type="text"
            size="small"
            className={styles.argRowDelete}
            icon={<CloseOutlined />}
            onClick={onRemove}
          />
        ) : null}
      </div>

      {/* Object / Array_Object：下级参数列表 +「添加下级参数」（只读态仅展示行，按钮隐藏） */}
      {hasChildren ? (
        <Form.List name={[field.name, 'children']}>
          {(childFields, { add, remove }) => (
            <div className={styles.argChildren}>
              {childFields.map((childField) => (
                <ArgRow
                  key={childField.key}
                  form={form}
                  listPath={[...listPath, field.name, 'children']}
                  field={childField}
                  readOnly={readOnly}
                  onRemove={() => remove(childField.name)}
                />
              ))}
              {!readOnly ? (
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  className={styles.argAddChild}
                  onClick={() => add({ type: 'String', required: false })}
                >
                  添加下级参数
                </Button>
              ) : null}
            </div>
          )}
        </Form.List>
      ) : null}
    </div>
  );
};

const ConnectorActionCreateModal: React.FC<ConnectorActionCreateModalProps> = ({
  open,
  record,
  editAction,
  onClose,
  onCreated,
  updateAction,
  createAction,
}) => {
  /** 编辑模式：传入了 editAction（工具卡片「编辑」进入），否则为新增模式 */
  const isEdit = Boolean(editAction);
  const [form] = Form.useForm();
  // 保存中：给「保存工具」按钮加 loading，防止重复提交
  const [submitting, setSubmitting] = useState<boolean>(false);
  /** 回填只读标记：选中绑定项时置 true，退出回填态（清空选择/切走类型）时置 false */
  const argsReadOnlyRef = useRef(false);

  /**
   * 执行类型：默认 HTTP 接口（initialValues）
   * 「HTTP 请求声明」区块仅在执行类型为 HTTP 接口时展示；
   * 绑定插件 / 绑定工作流时改展示绑定声明区（空间筛选 + 可绑定列表 + 刷新列表）
   */
  const executionType = Form.useWatch('executionType', form);
  /** 绑定插件 / 绑定工作流（null = HTTP 接口）：控制两个声明区互斥展示 */
  const boundExecType =
    executionType === 'PLUGIN' || executionType === 'WORKFLOW'
      ? (executionType as 'PLUGIN' | 'WORKFLOW')
      : null;

  /**
   * 打开弹窗时重置表单：
   * Modal 虽设了 destroyOnHidden（销毁 DOM），但同一个 form 实例的 store
   * 会保留上次填写的值，必须显式 resetFields 才能清空内容与校验红字，
   * 回到 initialValues（执行类型 HTTP 接口 / 方法 GET）
   */
  useEffect(() => {
    if (open) {
      form.resetFields();
      // 重置回填只读标记（上次会话选中过绑定项的情况）
      argsReadOnlyRef.current = false;
      // 编辑模式：回填详情接口返回的工具定义（新增模式保持空白）
      if (editAction) {
        form.setFieldsValue(toEditFormValues(editAction));
      }
    }
  }, [open, form, editAction]);

  // 空间列表（绑定插件/工作流筛选用；拉一次后复用）
  const [spaces, setSpaces] = useState<SpaceInfo[]>([]);
  const [spaceLoading, setSpaceLoading] = useState<boolean>(false);
  // 可绑定插件/工作流列表（随执行类型 / 空间变化重新拉取）
  const [bindables, setBindables] = useState<ConnectorBindableItem[]>([]);
  const [bindableLoading, setBindableLoading] = useState<boolean>(false);

  /**
   * 拉取可绑定插件/工作流列表
   * GET /api/connector/bindable?type=plugin|workflow&spaceId=xxx
   * 执行类型切到绑定插件/工作流、切换空间、点「刷新列表」时调用
   */
  const fetchBindables = useCallback(
    async (execType: 'PLUGIN' | 'WORKFLOW', spaceId?: number | string) => {
      try {
        setBindableLoading(true);
        const response = await apiConnectorBindable({
          type: execType === 'PLUGIN' ? 'plugin' : 'workflow',
          spaceId,
        });
        setBindables(
          response?.code === SUCCESS_CODE ? response.data ?? [] : [],
        );
      } catch {
        setBindables([]);
      } finally {
        setBindableLoading(false);
      }
    },
    [],
  );

  /**
   * 执行类型切到 绑定插件 / 绑定工作流 时：
   * 1. 空间列表未加载时先调 GET /api/space/list，并默认选中第一个空间
   * 2. 按当前执行类型 + 空间调 bindable 拉取可绑定列表（默认不选中任何项）
   */
  useEffect(() => {
    if (!open || !boundExecType) return;
    let cancelled = false;
    (async () => {
      let currentSpaces = spaces;
      if (!currentSpaces.length) {
        try {
          setSpaceLoading(true);
          const response = await apiSpaceList();
          currentSpaces =
            response?.code === SUCCESS_CODE ? response.data ?? [] : [];
          if (!cancelled) {
            setSpaces(currentSpaces);
          }
        } catch {
          currentSpaces = [];
        } finally {
          if (!cancelled) {
            setSpaceLoading(false);
          }
        }
      }
      if (cancelled) return;
      // 空间未选时默认第一个空间（覆盖弹窗重开后 bindSpaceId 被重置的情况）
      let spaceId = form.getFieldValue('bindSpaceId');
      if ((spaceId === undefined || spaceId === null) && currentSpaces.length) {
        spaceId = currentSpaces[0].id;
        form.setFieldValue('bindSpaceId', spaceId);
      }
      fetchBindables(boundExecType, spaceId);
    })();
    return () => {
      cancelled = true;
    };
    // spaces 只在本 effect 内写入，不作为依赖，避免列表到达后重复拉取
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, executionType]);

  // 当前选中的插件/工作流（按 id 匹配 bindable 列表；用于回填输入参数）
  const bindRef = Form.useWatch('bindRef', form);
  const selectedBindable = useMemo(() => {
    if (!boundExecType || bindRef === undefined || bindRef === null)
      return null;
    return (
      bindables.find((item) => String(item.id) === String(bindRef)) ?? null
    );
  }, [boundExecType, bindRef, bindables]);
  /** 输入参数声明是否处于只读回填态（隐藏增删按钮、控件禁用） */
  const argsReadOnly = Boolean(selectedBindable);

  /**
   * 绑定声明区选中插件/工作流后回填输入参数声明：
   * - 选中项 inputArgs 为空（或 null）→ 表单为空列表，卡片展示「暂无输入参数」
   * - 否则递归回填（只读展示，禁止用户增删改）
   * - 清空选择 / 切走执行类型（退出回填态）→ 恢复可编辑的空列表
   */
  useEffect(() => {
    if (!open) return;
    if (selectedBindable) {
      form.setFieldValue(
        'inputArgs',
        (selectedBindable.inputArgs ?? []).map(fromBindableArg),
      );
      argsReadOnlyRef.current = true;
    } else if (argsReadOnlyRef.current) {
      form.setFieldValue('inputArgs', []);
      argsReadOnlyRef.current = false;
    }
    // 仅在选中项变化时回填/恢复；form 为稳定实例
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBindable, open]);

  /**
   * 保存工具：
   * 1. 校验必填项 —— 失败时表单控件下方已有红字提示，静默返回
   * 2. POST /api/system/connector/providers/{service}/actions
   * 3. 成功后关闭弹窗并触发 onCreated
   */
  const handleSubmit = useCallback(async () => {
    let values: ConnectorActionFormValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }

    if (!record?.service) {
      message.error('缺少连接器 service，无法保存工具');
      return;
    }

    // 映射行数组 → 以名称为键的对象（query / headers 用，值来源原样透传）
    const rowsToRecord = (rows?: Array<{ name?: string; value?: string }>) => {
      const result: Record<string, string> = {};
      (rows ?? []).forEach((row) => {
        if (row?.name) {
          result[row.name] = row.value ?? '';
        }
      });
      return result;
    };

    // 路径占位符映射：从 path 里提取 {名称} 占位符，默认绑定同名输入参数（input.{名称}）
    const pathParams: Record<string, string> = {};
    (String(values.path ?? '').match(/\{([^}]+)\}/g) ?? []).forEach((token) => {
      const placeholder = token.slice(1, -1);
      pathParams[placeholder] = `input.${placeholder}`;
    });

    // QUERY / HEADER 映射行 → 以名称为键的对象
    const query = rowsToRecord(values.queryMappings);
    const headers = rowsToRecord(values.headerMappings);

    // BODY 字段行 → bodyFields 数组（递归嵌套：mapping / children / item），跳过完全没填的行
    const bodyFields: ConnectorActionBodyField[] = (values.bodyFields ?? [])
      .filter(hasBodyFieldContent)
      .map(toBodyFieldNode);

    // 输入参数行 → inputArgs 数组（递归：dataType / subArgs），跳过没填参数名的行
    const inputArgs: ConnectorActionInputArg[] = (values.inputArgs ?? [])
      .filter(hasInputArgContent)
      .map(toInputArgNode);

    const isDeclarative = values.executionType === 'HTTP';
    const isBoundExec =
      values.executionType === 'PLUGIN' || values.executionType === 'WORKFLOW';
    // 表单值 → 后端枚举：HTTP 接口对应 DECLARATIVE，绑定插件/工作流原样
    const execType =
      values.executionType === 'HTTP' ? 'DECLARATIVE' : values.executionType;

    // 绑定声明快照：把选中插件/工作流的信息写进 httpSpec
    // （icon 原样透传接口返回的 null / 空串，缺省补 null）
    let bindSpec: ConnectorActionBindSpec | undefined;
    if (isBoundExec) {
      if (selectedBindable) {
        bindSpec = {
          bindType: values.executionType as 'PLUGIN' | 'WORKFLOW',
          bindId: String(selectedBindable.id),
          name: selectedBindable.name,
          icon: selectedBindable.icon ?? null,
          description: selectedBindable.description,
          spaceId: values.bindSpaceId ?? '',
        };
      } else if (isEdit && editAction) {
        // 编辑时选中项已不在可绑定列表（如已下架）：沿用原快照兜底，
        // 避免仅改基础信息就把 httpSpec 清空；bindId / spaceId 以表单为准
        const stored = (editAction.httpSpec ?? undefined) as
          | ConnectorActionBindSpec
          | undefined;
        if (stored?.bindType) {
          bindSpec = {
            ...stored,
            bindType: values.executionType as 'PLUGIN' | 'WORKFLOW',
            bindId: values.bindRef ?? stored.bindId,
            spaceId: values.bindSpaceId ?? stored.spaceId,
          };
        }
      }
    }

    const payload: CreateConnectorActionParams = {
      actionKey: values.actionKey?.trim(),
      name: values.name?.trim(),
      description: values.description ?? '',
      // 标签：逗号分隔字符串 → 去空白后的数组
      tags: String(values.tags ?? '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      // 输入参数：没有添加参数时整个字段不传（undefined 键序列化时会被丢弃）
      inputArgs: inputArgs.length ? inputArgs : undefined,
      // 输出参数：当前表单不采集 → 不传该字段
      outputArgs: undefined,
      execType: execType,
      // 执行引用：仅绑定插件 / 绑定工作流时才传该字段，
      // 值为绑定声明区选中的插件/工作流 id（bindRef 必选校验保证非空）
      execRef: isBoundExec ? values.bindRef ?? '' : undefined,
      // httpSpec 按执行类型二选一：
      // - HTTP 接口（DECLARATIVE）→ 请求声明（内部映射键没内容时不传该键）
      // - 绑定插件/工作流 → 绑定声明快照（bindType / bindId / name / icon / description / spaceId）
      httpSpec: isDeclarative
        ? {
            method: values.method ?? 'GET',
            path: values.path ?? '',
            pathParams: Object.keys(pathParams).length ? pathParams : undefined,
            query: Object.keys(query).length ? query : undefined,
            headers: Object.keys(headers).length ? headers : undefined,
            bodyFields: bodyFields.length ? bodyFields : undefined,
            // 原样请求体：与 bodyFields 二选一，未填时不传该键
            bodyRaw: values.rawBodyParam?.trim() || undefined,
            timeoutMs: values.timeoutMs ?? undefined,
            // 响应提取路径：未填时不传该键（后端默认取响应整体）
            response: values.responsePath?.trim()
              ? { extract: values.responsePath.trim() }
              : undefined,
          }
        : bindSpec,
    };

    try {
      setSubmitting(true);
      // 新增：POST /api/system/connector/providers/{service}/actions
      // 编辑：PUT /api/system/connector/providers/{service}/actions/{actionKey}
      // （两者 body 一致；actionKey 表单必填校验已保证非空）
      const requestParams = { service: record.service, ...payload };
      // 编辑：更新接口可注入 —— 空间维度按工具 id 寻址
      // （POST /api/connector/actions/{id}），管理端按 service+actionKey 寻址；
      // 新增：创建接口可注入 —— 空间维度 POST /api/connector/providers/{service}/actions
      const response = isEdit
        ? updateAction
          ? await updateAction({
              id: (editAction?.id ?? '') as string | number,
              ...payload,
            })
          : await apiSystemConnectorActionUpdate(requestParams)
        : createAction
        ? await createAction(requestParams)
        : await apiSystemConnectorActionCreate(requestParams);
      if (response?.code !== SUCCESS_CODE) {
        throw new Error(response?.message || 'save action failed');
      }
      message.success(isEdit ? '工具更新成功' : '工具创建成功');
      onClose();
      onCreated?.();
    } catch {
      message.error(isEdit ? '更新工具失败' : '创建工具失败');
    } finally {
      setSubmitting(false);
    }
  }, [
    form,
    record?.service,
    onClose,
    onCreated,
    selectedBindable,
    editAction,
    updateAction,
    createAction,
  ]);

  return (
    <Modal
      className={styles.modal}
      title={isEdit ? '编辑工具' : '新增工具'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        className={styles.form}
        initialValues={{ executionType: 'HTTP', method: 'GET' }}
      >
        {/* ===== 基础信息 ===== */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="actionKey"
              label="ACTIONKEY（创建后不可改）"
              rules={[{ required: true, message: '请输入 actionKey' }]}
            >
              {/* 编辑模式禁改（后端唯一键），值原样提交 */}
              <Input placeholder="如 get_repo" allowClear disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="name"
              label="工具名称"
              rules={[{ required: true, message: '请输入工具名称' }]}
            >
              <Input placeholder="如 查询仓库" allowClear />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="工具说明（供 Agent 判断何时调用）">
          <Input.TextArea
            rows={3}
            placeholder="说明用途、关键入参约定与返回结构"
            maxLength={500}
            showCount
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="tags" label="标签（可选，逗号分隔）">
              <Input placeholder="如 演示" allowClear />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="executionType"
              label="执行类型"
              rules={[{ required: true, message: '请选择执行类型' }]}
            >
              <Select
                options={EXECUTION_TYPE_OPTIONS}
                onChange={(value) => {
                  // 切换执行类型：清空上一模式的表单项，避免草稿/选中残留
                  if (value !== 'HTTP') {
                    // 离开 HTTP：清空请求声明草稿（method 保留默认 GET）
                    form.setFieldsValue({
                      path: undefined,
                      timeoutMs: undefined,
                      responsePath: undefined,
                      rawBodyParam: undefined,
                      queryMappings: [],
                      headerMappings: [],
                      bodyFields: [],
                    });
                  }
                  // 清空绑定选择：PLUGIN ↔ WORKFLOW 列表不同，残留 id 会变成
                  // 无效选中并绕过必选校验；切回 HTTP 时绑定区本就隐藏
                  form.setFieldValue('bindRef', undefined);
                  // 输入参数恢复空列表（绑定选中项后会按其 inputArgs 回填）
                  form.setFieldValue('inputArgs', []);
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ===== HTTP 请求声明（仅执行类型 = HTTP 接口时展示）===== */}
        {executionType === 'HTTP' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionTitle}>HTTP 请求声明</span>
            </div>
            <div className={styles.sectionBody}>
              <Row gutter={16}>
                <Col span={6}>
                  <Form.Item name="method" label="方法">
                    <Select options={HTTP_METHOD_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col span={18}>
                  <Form.Item
                    name="path"
                    label="路径（{名称} 占位符取输入参数）"
                    rules={[{ required: true, message: '请输入请求路径' }]}
                  >
                    <Input placeholder="/repos/{owner}/{repo}" allowClear />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="timeoutMs" label="超时毫秒（可选）">
                    {/* 正整数步进选择器：min 1 + 整数精度，超时按毫秒习惯步进 1000 */}
                    <InputNumber
                      className={styles.timeoutInput}
                      min={1}
                      step={1000}
                      precision={0}
                      placeholder="缺省"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="responsePath" label="响应提取路径（可选）">
                    <Input
                      placeholder="如 $.data.list；缺省取响应整体"
                      allowClear
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="rawBodyParam"
                label="原样请求体（可选，与 BODY 映射二选一）"
              >
                <Input
                  placeholder="填输入参数名，其值原样作为请求体发送"
                  allowClear
                />
              </Form.Item>

              {/* QUERY 参数映射：参数名 — 映射值，行可增删 */}
              <Form.List name="queryMappings">
                {(fields, { add, remove }) => (
                  <MappingCard
                    title="QUERY 参数映射"
                    addText="添加"
                    emptyText="暂无 QUERY 参数映射"
                    isEmpty={fields.length === 0}
                    onAdd={() => add()}
                  >
                    {fields.map((field) => (
                      <MappingRow
                        key={field.key}
                        namePath={[field.name, 'name']}
                        valuePath={[field.name, 'value']}
                        namePlaceholder="参数名"
                        valuePlaceholder="输入参数名 / opt:参数名 / literal:值"
                        onRemove={() => remove(field.name)}
                      />
                    ))}
                  </MappingCard>
                )}
              </Form.List>

              {/* HEADER 映射：参数名 — 映射值，行可增删 */}
              <Form.List name="headerMappings">
                {(fields, { add, remove }) => (
                  <MappingCard
                    title="HEADER 映射"
                    addText="添加"
                    emptyText="暂无 HEADER 映射"
                    isEmpty={fields.length === 0}
                    onAdd={() => add()}
                  >
                    {fields.map((field) => (
                      <MappingRow
                        key={field.key}
                        namePath={[field.name, 'name']}
                        valuePath={[field.name, 'value']}
                        namePlaceholder="参数名"
                        valuePlaceholder="输入参数名 / opt:参数名 / literal:值"
                        onRemove={() => remove(field.name)}
                      />
                    ))}
                  </MappingCard>
                )}
              </Form.List>

              {/* BODY 字段：字段名 + 类型 +（object/array 各自的嵌套声明），行可增删；默认类型 string */}
              <Form.List name="bodyFields">
                {(fields, { add, remove }) => (
                  <MappingCard
                    title="BODY 字段（类型化·支持嵌套）"
                    addText="添加字段"
                    emptyText="暂无 BODY 字段"
                    isEmpty={fields.length === 0}
                    onAdd={() => add({ type: 'string' })}
                  >
                    {fields.map((field) => (
                      <BodyFieldRow
                        key={field.key}
                        form={form}
                        listPath={['bodyFields']}
                        field={field}
                        onRemove={() => remove(field.name)}
                      />
                    ))}
                  </MappingCard>
                )}
              </Form.List>

              <div className={styles.mappingTips}>
                <span>
                  映射值三种写法：输入参数名（缺失即报错）·
                  opt:参数名（可选，缺失则整个字段省略）· literal:固定值
                </span>
                <span>
                  字段类型：string / number / boolean / object / array。object
                  可加子字段；array
                  指向一个「值为整个数组」的输入参数，其元素结构可声明。
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ===== 绑定插件 / 绑定工作流（仅执行类型为二者时展示，HTTP 请求声明隐藏）===== */}
        {boundExecType ? (
          <div className={styles.bindSection}>
            <Form.Item name="bindSpaceId" label="空间">
              <Select
                loading={spaceLoading}
                options={spaces.map((space) => ({
                  label: space.name,
                  value: space.id,
                }))}
                onChange={(value) => {
                  // 切换空间后可绑定列表随空间变化，已选插件/工作流清空
                  form.setFieldValue('bindRef', undefined);
                  fetchBindables(boundExecType, value);
                }}
              />
            </Form.Item>
            <Form.Item
              name="bindRef"
              label={
                boundExecType === 'PLUGIN'
                  ? '绑定插件（仅已发布）'
                  : '绑定工作流（仅已发布）'
              }
              // 保存前强制校验：绑定插件/工作流必须选中一项
              rules={[
                {
                  required: true,
                  message:
                    boundExecType === 'PLUGIN' ? '请选择插件' : '请选择工作流',
                },
              ]}
            >
              <Select
                loading={bindableLoading}
                placeholder="— 请选择 —"
                allowClear
                options={bindables.map((item) => ({
                  label: item.name,
                  value: String(item.id),
                }))}
              />
            </Form.Item>
            {/* 重新拉取可绑定列表（GET /api/connector/bindable） */}
            <Button
              className={styles.bindRefreshButton}
              loading={bindableLoading}
              onClick={() =>
                fetchBindables(boundExecType, form.getFieldValue('bindSpaceId'))
              }
            >
              刷新列表
            </Button>
          </div>
        ) : null}

        {/* ===== 输入参数声明（类型化 Arg 树，行可增删）===== */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              输入参数声明（类型化 Arg 树）
            </span>
          </div>
          <div className={styles.sectionBody}>
            <Form.List name="inputArgs">
              {(fields, { add, remove }) => (
                <MappingCard
                  title="输入参数（名称 / 说明 / 类型 / 必填；OBJECT 与 OBJECT 数组可加下级参数）"
                  addText="添加"
                  emptyText="暂无输入参数"
                  isEmpty={fields.length === 0}
                  rowsClassName={styles.argRows}
                  readOnly={argsReadOnly}
                  onAdd={() => add({ type: 'String', required: false })}
                >
                  {fields.map((field) => (
                    <ArgRow
                      key={field.key}
                      form={form}
                      listPath={['inputArgs']}
                      field={field}
                      readOnly={argsReadOnly}
                      onRemove={() => remove(field.name)}
                    />
                  ))}
                </MappingCard>
              )}
            </Form.List>
          </div>
        </div>

        {/* ===== 底部保存 ===== */}
        <Button
          type="primary"
          block
          className={styles.submitButton}
          loading={submitting}
          onClick={handleSubmit}
        >
          保存工具
        </Button>
      </Form>
    </Modal>
  );
};

export default memo(ConnectorActionCreateModal);
