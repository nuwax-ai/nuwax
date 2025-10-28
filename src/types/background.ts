/**
 * 背景图片类型定义
 * 避免循环依赖，独立定义类型
 */
export interface BackgroundImage {
  /** 背景图片唯一标识 */
  id: string;
  /** 背景图片显示名称 */
  name: string;
  /** 背景图片文件路径 */
  path: string;
  /** 背景图片预览路径 */
  preview: string;
  /** 背景图片描述（可选） */
  description?: string;
}
