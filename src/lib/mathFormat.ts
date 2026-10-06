import i18n from '../i18n';
import type { AffineExpression, ArithmeticOperator, ExpressionNode } from '../types';

const MINUS = '−';
const NO_BREAK = ' ';
const NARROW_NO_BREAK = ' ';

export const formatInteger = (value: number): string =>
  new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 0 })
    .format(value)
    .replace('-', MINUS);

const formatOperand = (value: number, leading: boolean): string =>
  value < 0 && !leading ? `(${formatInteger(value)})` : formatInteger(value);

export const formatPercent = (rate: number): string => `${formatInteger(rate)}${NARROW_NO_BREAK}%`;

export const OPERATOR_SYMBOLS: Record<ArithmeticOperator, string> = {
  add: '+',
  subtract: MINUS,
  multiply: '×',
  divide: '÷',
};

const PRECEDENCE: Record<ArithmeticOperator, number> = {
  add: 1,
  subtract: 1,
  multiply: 2,
  divide: 2,
};

const isNonAssociativeRightOperand = (operator: ArithmeticOperator): boolean =>
  operator === 'subtract' || operator === 'divide';

const needsParentheses = (
  child: ExpressionNode,
  parent: ArithmeticOperator,
  side: 'left' | 'right'
): boolean => {
  if (child.kind === 'number') return false;
  const childPrecedence = PRECEDENCE[child.operator];
  const parentPrecedence = PRECEDENCE[parent];
  if (childPrecedence < parentPrecedence) return true;
  return (
    side === 'right' && childPrecedence === parentPrecedence && isNonAssociativeRightOperand(parent)
  );
};

const renderNode = (node: ExpressionNode, leading: boolean): string => {
  if (node.kind === 'number') return formatOperand(node.value, leading);
  const left = renderChild(node.left, node.operator, 'left', leading);
  const right = renderChild(node.right, node.operator, 'right', false);
  return `${left}${NO_BREAK}${OPERATOR_SYMBOLS[node.operator]} ${right}`;
};

const renderChild = (
  child: ExpressionNode,
  parent: ArithmeticOperator,
  side: 'left' | 'right',
  leading: boolean
): string =>
  needsParentheses(child, parent, side)
    ? `(${renderNode(child, true)})`
    : renderNode(child, leading);

export const formatExpression = (node: ExpressionNode): string => renderNode(node, true);

export const formatBinary = (operator: ArithmeticOperator, left: number, right: number): string =>
  formatExpression({
    kind: 'operation',
    operator,
    left: { kind: 'number', value: left },
    right: { kind: 'number', value: right },
  });

const formatLinearTerm = (coefficient: number): string => {
  if (coefficient === 1) return 'x';
  if (coefficient === -1) return `${MINUS}x`;
  return `${formatInteger(coefficient)}x`;
};

export const formatAffine = ({ coefficient, constant }: AffineExpression): string => {
  if (coefficient === 0) return formatInteger(constant);
  const term = formatLinearTerm(coefficient);
  if (constant === 0) return term;
  const sign = constant < 0 ? MINUS : '+';
  return `${term}${NO_BREAK}${sign} ${formatInteger(Math.abs(constant))}`;
};
