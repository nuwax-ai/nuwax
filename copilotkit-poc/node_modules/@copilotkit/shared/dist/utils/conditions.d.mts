//#region src/utils/conditions.d.ts
type ComparisonRule = "EQUALS" | "NOT_EQUALS" | "GREATER_THAN" | "LESS_THAN" | "CONTAINS" | "NOT_CONTAINS" | "MATCHES" | "STARTS_WITH" | "ENDS_WITH";
type LogicalRule = "AND" | "OR" | "NOT";
type ExistenceRule = "EXISTS" | "NOT_EXISTS";
type Rule = ComparisonRule | LogicalRule | ExistenceRule;
interface BaseCondition {
  rule: Rule;
  path?: string;
}
interface ComparisonCondition extends BaseCondition {
  rule: ComparisonRule;
  value: any;
}
interface LogicalCondition extends BaseCondition {
  rule: LogicalRule;
  conditions: Condition[];
}
interface ExistenceCondition extends BaseCondition {
  rule: ExistenceRule;
}
type Condition = ComparisonCondition | LogicalCondition | ExistenceCondition;
declare function executeConditions({
  conditions,
  value
}: {
  conditions?: Condition[];
  value: any;
}): boolean;
//#endregion
export { BaseCondition, ComparisonCondition, ComparisonRule, Condition, ExistenceCondition, ExistenceRule, LogicalCondition, LogicalRule, Rule, executeConditions };
//# sourceMappingURL=conditions.d.mts.map