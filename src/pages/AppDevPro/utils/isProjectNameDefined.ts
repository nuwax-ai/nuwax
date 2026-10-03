/**
 * 项目名称是否已被用户定义。
 * 兼容 boolean 与 0/1（后端 topicUpdated 同类形态），只有明确为真才视为已定义。
 */
export function isProjectNameDefined(nameDefined: unknown): boolean {
  return nameDefined === true || nameDefined === 1;
}
