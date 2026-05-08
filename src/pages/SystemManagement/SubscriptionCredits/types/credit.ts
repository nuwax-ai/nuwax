// 积分套餐状态：0-禁用，1-启用
export enum CreditPackageStatusEnum {
  Disabled = 0,
  Enabled = 1,
}

// 积分套餐信息
export interface CreditPackageInfo {
  /*套餐ID */
  id?: number;

  /*套餐名称 */
  packageName?: string;

  /*积分数量 */
  creditAmount?: number;

  /*价格 */
  price?: number;

  /*排序 */
  sort?: number;

  /*状态：0-禁用，1-启用 */
  status?: CreditPackageStatusEnum;

  /*创建时间 */
  created?: Record<string, unknown>;

  /*有效期（月） */
  period?: number;

  /*更新时间 */
  modified?: Record<string, unknown>;

  /*备注 */
  remark?: string;
}

/**
 * 积分套餐排序信息
 */
export interface CreditPackageSortItem {
  id: number;
  sort: number;
}
