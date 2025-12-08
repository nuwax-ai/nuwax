// 字段类型：1:String(VARCHAR(255));2:Integer(INT);3:Number(DECIMAL(20,6));4:Boolean(TINYINT(1));5:Date(DATETIME);6:PrimaryKey(BIGINT);7:MEDIUMTEXT(MEDIUMTEXT)
export enum TableFieldTypeEnum {
  // 短文本
  String = 1,
  // 整数
  Integer = 2,
  // 数字
  Number = 3,
  // 布尔
  Boolean = 4,
  // 日期
  Date = 5,
  // 主键
  PrimaryKey = 6,
  // 长文本,对应数据库类型: MEDIUMTEXT
  MEDIUMTEXT = 7,
}

// 数据表tabs枚举
export enum TableTabsEnum {
  // 表结构
  Structure = 'Structure',
  // 表数据
  Data = 'Data',
}
