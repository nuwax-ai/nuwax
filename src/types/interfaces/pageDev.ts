import { DataTypeEnum } from '../enums/common';
import { PageDevelopCreateTypeEnum } from '../enums/pageDev';
import { CustomPopoverItem } from './common';

// 自定义页面项目信息
export interface CustomPageDto {
  // 项目ID
  projectId: number;
  // 调试关联智能体ID
  devAgentId?: number;
  // 项目名称
  name: string;
  // 项目描述
  description: string;
  // 项目图标
  icon: string;
  // 项目基础路径
  basePath: string;
  // 发布状态,1:已发布;-1:未发布
  buildRunning: number;
  // 项目类型,可用值:REVERSE_PROXY,ONLINE_DEPLOY
  projectType: PageDevelopCreateTypeEnum;
  // 代理配置
  proxyConfigs: {
    // 可用值:dev,prod
    env: string;
    path: string;
    backends: {
      backend: string;
      weight: number;
    }[];
    healthCheckPath: string;
    requireAuth: boolean;
  };
  // 页面参数配置
  pageArgConfigs: {
    pageUri: string;
    name: string;
    description: string;
    args: {
      key: string;
      name: string;
      description: string;
      // 可用值:String,Integer,Number,Boolean,Object,Array_String,Array_Integer,Array_Number,Array_Boolean,Array_Object
      dataType: DataTypeEnum;
      require: boolean;
    }[];
  };
  // 扩展字段
  ext: any;
  // 用户ID
  userId: number;
  // 租户ID
  tenantId: number;
  // 空间ID
  spaceId: number;
  // 创建时间
  created: string;
}

// 上传前端项目压缩包并启动开发服务器参数
export interface PageUploadAndStartParams {
  // 项目名称
  projectName: string;
  // 项目描述
  projectDesc: string;
  // 项目基础路径
  basePath: string;
  // 项目压缩包文件
  file: any;
  // 空间ID
  spaceId: number;
  // 项目图标
  icon: string;
}

// 在线创建用户前端页面项目参数
export type CustomPageCreateParams = PageUploadAndStartParams;

// 上传前端项目压缩包并启动开发服务器返回值
export interface CreateCustomPageInfo {
  // 项目ID
  projectId: number;
  // 开发服务器URL
  devServerUrl: string;
}

// 单个页面开发组件
export interface PageDevelopCardItemProps {
  componentInfo: CustomPageDto | any;
  onClick: () => void;
  onClickMore: (item: CustomPopoverItem) => void;
}
