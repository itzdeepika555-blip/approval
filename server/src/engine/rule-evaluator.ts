/**
 * SIH26130 - Industrial Approval Rule & Matching Engine
 * 
 * Evaluates business profile data against statutory approval rules.
 * Does NOT rely on generative AI for deterministic legal approvals.
 * Generative AI is used ONLY as a downstream assistant for natural language
 * explanation enhancement, document verification, and guidance.
 */

export type ComparisonOperator = 
  | '==' 
  | '!=' 
  | '>' 
  | '>=' 
  | '<' 
  | '<=' 
  | 'in' 
  | 'not_in' 
  | 'contains';

export interface FieldCondition {
  field: string;
  operator: ComparisonOperator;
  value: any;
}

export interface CompoundCondition {
  and?: ConditionNode[];
  or?: ConditionNode[];
  not?: ConditionNode;
}

export type ConditionNode = FieldCondition | CompoundCondition;

export interface RuleEvaluationContext {
  [key: string]: any;
}

export interface RuleEvaluationResult {
  ruleCode: string;
  approvalCode: string;
  isTriggered: boolean;
  priority: number;
  reason: string;
}

/**
 * Checks if a condition node is a compound condition (and / or / not)
 */
function isCompoundCondition(node: ConditionNode): node is CompoundCondition {
  return 'and' in node || 'or' in node || 'not' in node;
}

/**
 * Evaluates a single comparison between business profile value and target rule value
 */
function evaluateFieldComparison(actual: any, operator: ComparisonOperator, expected: any): boolean {
  if (actual === undefined || actual === null) {
    if (operator === '==' && expected === null) return true;
    if (operator === '!=' && expected !== null) return true;
    return false;
  }

  // Handle number/decimal comparisons
  const actualNum = typeof actual === 'number' ? actual : parseFloat(actual);
  const expectedNum = typeof expected === 'number' ? expected : parseFloat(expected);
  const isNumeric = !isNaN(actualNum) && !isNaN(expectedNum) && typeof expected !== 'boolean';

  switch (operator) {
    case '==':
      return String(actual).toLowerCase() === String(expected).toLowerCase();
    case '!=':
      return String(actual).toLowerCase() !== String(expected).toLowerCase();
    case '>':
      return isNumeric ? actualNum > expectedNum : actual > expected;
    case '>=':
      return isNumeric ? actualNum >= expectedNum : actual >= expected;
    case '<':
      return isNumeric ? actualNum < expectedNum : actual < expected;
    case '<=':
      return isNumeric ? actualNum <= expectedNum : actual <= expected;
    case 'in':
      if (Array.isArray(expected)) {
        return expected.map(v => String(v).toLowerCase()).includes(String(actual).toLowerCase());
      }
      return false;
    case 'not_in':
      if (Array.isArray(expected)) {
        return !expected.map(v => String(v).toLowerCase()).includes(String(actual).toLowerCase());
      }
      return true;
    case 'contains':
      return String(actual).toLowerCase().includes(String(expected).toLowerCase());
    default:
      return false;
  }
}

/**
 * Evaluates a tree of condition nodes recursively against the profile context
 */
export function evaluateCondition(condition: ConditionNode, context: RuleEvaluationContext): boolean {
  if (isCompoundCondition(condition)) {
    if (condition.and && condition.and.length > 0) {
      return condition.and.every(child => evaluateCondition(child, context));
    }
    if (condition.or && condition.or.length > 0) {
      return condition.or.some(child => evaluateCondition(child, context));
    }
    if (condition.not) {
      return !evaluateCondition(condition.not, context);
    }
    return false;
  }

  // Leaf condition: field comparison
  const actualValue = context[condition.field];
  return evaluateFieldComparison(actualValue, condition.operator, condition.value);
}

/**
 * Populates placeholder variables in the rule explanation template
 * e.g. "Your enterprise employs {employeeCount} workers" -> "Your enterprise employs 25 workers"
 */
export function interpolateExplanation(template: string, context: RuleEvaluationContext): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] !== undefined && context[key] !== null ? String(context[key]) : match;
  });
}

/**
 * Evaluates a set of approval rules against a business profile
 */
export function evaluateApprovalRules(
  rules: Array<{
    ruleCode: string;
    approvalCode: string;
    priority: number;
    conditionsJson: any;
    explanationTpl: string;
  }>,
  businessProfile: RuleEvaluationContext
): RuleEvaluationResult[] {
  const results: RuleEvaluationResult[] = [];

  for (const rule of rules) {
    try {
      const condition = typeof rule.conditionsJson === 'string' 
        ? JSON.parse(rule.conditionsJson) 
        : rule.conditionsJson;

      const isTriggered = evaluateCondition(condition, businessProfile);
      if (isTriggered) {
        results.push({
          ruleCode: rule.ruleCode,
          approvalCode: rule.approvalCode,
          isTriggered: true,
          priority: rule.priority,
          reason: interpolateExplanation(rule.explanationTpl, businessProfile),
        });
      }
    } catch (err) {
      console.error(`Error evaluating rule ${rule.ruleCode}:`, err);
    }
  }

  // Return highest priority triggers first
  return results.sort((a, b) => a.priority - b.priority);
}
