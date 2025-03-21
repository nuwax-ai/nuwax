import { UserRoleEnum, UserStatusEnum } from '@/types/enums/systemManage';

// 查询用户列表输入参数
export interface SystemUserListParams {
  pageNo: number;
  pageSize: number;
  queryFilter: {
    role?: string;
    userName?: string;
  };
}

// 查询用户列表返回数据
export interface SystemUserListInfo {
  // 主键id
  id: number;
  // 昵称
  nickName: string;
  // 用户名
  userName: string;
  // 手机号码
  phone: string;
  // 邮箱
  email: string;
  // 角色
  role: UserRoleEnum;
  // 状态
  status: UserStatusEnum;
  // 加入时间
  created: string;
}
export interface SystemUserConfig {
  /** 租户ID */
  tenantId: number;
  /** 配置项名称 */
  name: string;
  /** 配置项值 */
  value: string | string[];
  /** 配置项描述 */
  description: string;
  /** 配置项分类，可用值: BaseConfig, ModelSetting, AgentSetting, DomainBind */
  category: 'BaseConfig' | 'ModelSetting' | 'AgentSetting' | 'DomainBind';
  /** 配置项输入类型，可用值: Input, MultiInput, Select, MultiSelect, Textarea, File */
  inputType:
    | 'Input'
    | 'MultiInput'
    | 'Select'
    | 'MultiSelect'
    | 'Textarea'
    | 'File';
  /** 配置项数据类型，可用值: String, Number, Array */
  dataType: 'String' | 'Number' | 'Array';
  /** 配置项提示 */
  notice: string;
  /** 配置项占位符 */
  placeholder: string;
  /** 配置项最小高度 */
  minHeight: number;
  /** 是否必填 */
  required: boolean;
  sort: number;
}
