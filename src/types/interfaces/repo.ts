/**
 * 资料库（空间文档仓库 Repo）类型定义
 * @description 对齐后端 Repo Page 模块（GET /api/repo/spaces/{spaceId}/tree，
 * OpenAPI operationId=getSpaceTree）的响应结构，仅声明前端消费的字段。
 */

/** 仓库页面信息（树节点自身） */
export interface RepoPageInfo {
  /** 页面主键 */
  id: number;
  /** 所属空间 ID */
  spaceId?: number;
  /** 父页面 ID */
  parentId?: number;
  /** 页面标题（资料库卡片名称） */
  title?: string;
  /** 对外短链标识（会话 selectedDocs 寻址用） */
  slugId?: string;
  /** 排序位 */
  position?: string;
  /** 页面类型 */
  pageType?: string;
  /** 源文件扩展名（推导资料格式用，如 md / pdf） */
  sourceExt?: string;
  /** 源文件对象存储 key */
  originalFileKey?: string;
  /** 内容大小 */
  contentSize?: number;
  /** 附件大小 */
  attachmentSize?: number;
  /** 是否启用 ACL */
  aclEnabled?: number;
  /** 创建人 ID */
  creatorId?: number;
  /** 创建人昵称（能力弹窗资料卡创建人显示） */
  creatorName?: string;
  /** 创建人头像地址（空/加载失败由卡片回退默认头像） */
  creatorAvatar?: string;
  /** 创建时间 */
  created?: string;
  /** 修改时间 */
  modified?: string;
}

/** 仓库页面树节点（children 递归） */
export interface RepoPageTreeNode {
  /** 节点自身页面信息 */
  page?: RepoPageInfo;
  /** 子节点 */
  children?: RepoPageTreeNode[];
}

/** 会话选中的资料库文档（selectedDocs 元素，传给 /api/agent/conversation/chat） */
export interface SelectedDocInfo {
  /** 选择的资料库文档 ID（页面短链标识） */
  slugId: string;
  /** 选择的资料库文档名称 */
  title: string;
  /** 选择的资料库文档类型 */
  pageType?: string;
}
