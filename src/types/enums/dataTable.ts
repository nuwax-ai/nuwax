// 字段类型：1:String(VARCHAR(255));2:Integer(INT);3:Number(DECIMAL(20,6));4:Boolean(TINYINT(1));5:Date(DATETIME);6:PrimaryKey(BIGINT);7:MEDIUMTEXT(MEDIUMTEXT)
export enum TableFieldTypeEnum {
  String = 1,
  Integer = 2,
  Number = 3,
  Boolean = 4,
  Date = 5,
  PrimaryKey = 6,
  MEDIUMTEXT = 7,
}

// 数据表tabs枚举
export enum TableTabsEnum {
  // 表结构
  Structure = 'Structure',
  // 表数据
  Data = 'Data',
}
