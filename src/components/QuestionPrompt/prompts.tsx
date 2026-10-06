import React from 'react';
import { useTranslation } from 'react-i18next';
import type { AffineExpression, QuestionPrompt } from '../../types';
import {
  formatAffine,
  formatBinary,
  formatExpression,
  formatInteger,
  formatPercent,
  OPERATOR_SYMBOLS,
} from '../../lib/mathFormat';

type PromptOf<T extends QuestionPrompt['type']> = Extract<QuestionPrompt, { type: T }>;

interface PromptProps<T extends QuestionPrompt['type']> {
  prompt: PromptOf<T>;
}

const Var: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <var className="pr-[0.1em]">{children}</var>
);

const NoWrap: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block whitespace-nowrap text-[0.8em]">{children}</span>
);

const MathText: React.FC<{ text: string }> = ({ text }) => (
  <>
    {text
      .split(/([a-z])/)
      .map((part, index) =>
        index % 2 === 1 ? (
          <Var key={index}>{part}</Var>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        )
      )}
  </>
);

const Blank: React.FC = () => (
  <span className="inline-block min-w-[1.1em] px-[0.12em] rounded-[0.2em] border-[0.06em] border-dashed border-primary text-primary text-center leading-[1.1]">
    ?
  </span>
);

const Caption: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block text-[0.4em] font-bold text-slate-500 mb-[0.15em]">{children}</span>
);

const Hint: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block text-[0.5em] font-bold text-slate-500 my-[0.2em]">{children}</span>
);

const Small: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="block text-[0.75em]">{children}</span>
);

const Spoken: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => (
  <>
    <span className="sr-only">{text}</span>
    <span aria-hidden className="inline-flex items-center">
      {children}
    </span>
  </>
);

const Word: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mx-[0.2em] text-[0.6em] font-bold text-slate-500"> {children} </span>
);

export const AdditionPromptView: React.FC<PromptProps<'addition'>> = ({ prompt }) => (
  <>{formatBinary('add', prompt.left, prompt.right)}</>
);

export const SubtractionPromptView: React.FC<PromptProps<'subtraction'>> = ({ prompt }) => (
  <>{formatBinary('subtract', prompt.left, prompt.right)}</>
);

const TableNumber: React.FC<{ value: number }> = ({ value }) => (
  <span className="text-primary">{formatInteger(value)}</span>
);

export const MultiplicationTablePromptView: React.FC<PromptProps<'multiplication_table'>> = ({
  prompt,
}) => (
  <>
    <TableNumber value={prompt.table} />
    &nbsp;{OPERATOR_SYMBOLS.multiply} {formatInteger(prompt.factor)}
  </>
);

export const DivisionTablePromptView: React.FC<PromptProps<'division_table'>> = ({ prompt }) => (
  <>
    {formatInteger(prompt.dividend)}&nbsp;{OPERATOR_SYMBOLS.divide}{' '}
    <TableNumber value={prompt.divisor} />
  </>
);

export const MultiplicationPromptView: React.FC<PromptProps<'multiplication'>> = ({ prompt }) => (
  <>{formatBinary('multiply', prompt.left, prompt.right)}</>
);

export const DifferenceOfSquaresPromptView: React.FC<PromptProps<'difference_of_squares'>> = ({
  prompt,
}) => <>{formatBinary('multiply', prompt.center + prompt.offset, prompt.center - prompt.offset)}</>;

export const DivisionPromptView: React.FC<PromptProps<'division'>> = ({ prompt }) => (
  <>{formatBinary('divide', prompt.dividend, prompt.divisor)}</>
);

export const ComplementPromptView: React.FC<PromptProps<'complement'>> = ({ prompt }) => (
  <NoWrap>
    {formatInteger(prompt.value)} {OPERATOR_SYMBOLS.add} <Blank /> ={' '}
    <span className="text-primary">{formatInteger(prompt.target)}</span>
  </NoWrap>
);

export const DoublePromptView: React.FC<PromptProps<'double'>> = ({ prompt }) => {
  const { t } = useTranslation();
  return (
    <>
      <Caption>{t('prompts.doubleOf')}</Caption>
      {formatInteger(prompt.value)}
    </>
  );
};

export const HalfPromptView: React.FC<PromptProps<'half'>> = ({ prompt }) => {
  const { t } = useTranslation();
  return (
    <>
      <Caption>{t('prompts.halfOf')}</Caption>
      {formatInteger(prompt.value)}
    </>
  );
};

export const MultiplicationByPowerOf10PromptView: React.FC<
  PromptProps<'multiplication_by_power_of_10'>
> = ({ prompt }) => (
  <>
    {formatInteger(prompt.factor)}&nbsp;{OPERATOR_SYMBOLS.multiply}{' '}
    <span className="text-primary">{formatInteger(10 ** prompt.exponent)}</span>
  </>
);

export const OperationPriorityPromptView: React.FC<PromptProps<'operation_priority'>> = ({
  prompt,
}) => <Small>{formatExpression(prompt.expression)}</Small>;

export const RelativeAdditionPromptView: React.FC<PromptProps<'relative_addition'>> = ({
  prompt,
}) => <>{formatBinary('add', prompt.left, prompt.right)}</>;

export const RelativeSubtractionPromptView: React.FC<PromptProps<'relative_subtraction'>> = ({
  prompt,
}) => <>{formatBinary('subtract', prompt.left, prompt.right)}</>;

export const RelativeMultiplicationPromptView: React.FC<PromptProps<'relative_multiplication'>> = ({
  prompt,
}) => <>{formatBinary('multiply', prompt.left, prompt.right)}</>;

export const RelativeDivisionPromptView: React.FC<PromptProps<'relative_division'>> = ({
  prompt,
}) => <>{formatBinary('divide', prompt.dividend, prompt.divisor)}</>;

export const RelativeOperationPriorityPromptView: React.FC<
  PromptProps<'relative_operation_priority'>
> = ({ prompt }) => <Small>{formatExpression(prompt.expression)}</Small>;

export const MissingFactorPromptView: React.FC<PromptProps<'missing_factor'>> = ({ prompt }) => (
  <NoWrap>
    {formatInteger(prompt.factor)} {OPERATOR_SYMBOLS.multiply} <Blank /> ={' '}
    {formatInteger(prompt.product)}
  </NoWrap>
);

export const EuclideanDivisionPromptView: React.FC<PromptProps<'euclidean_division'>> = ({
  prompt,
}) => {
  const { t } = useTranslation();
  const dividend = formatInteger(prompt.dividend);
  const divisor = formatInteger(prompt.divisor);
  const slot = (part: PromptOf<'euclidean_division'>['asked']) =>
    prompt.asked === part ? <Blank /> : <span className="invisible">0</span>;

  return (
    <>
      <Caption>{t(`prompts.euclideanQuestion.${prompt.asked}`)}</Caption>
      <Spoken text={t(`prompts.euclideanSpoken.${prompt.asked}`, { dividend, divisor })}>
        <span className="inline-grid grid-cols-[auto_auto] text-left">
          <span className="border-r-[0.06em] border-slate-800 pr-[0.25em] text-right">
            {dividend}
          </span>
          <span className="border-b-[0.06em] border-slate-800 pl-[0.25em] pr-[0.1em]">
            {divisor}
          </span>
          <span className="border-r-[0.06em] border-slate-800 pr-[0.25em] pt-[0.1em] text-right">
            {slot('remainder')}
          </span>
          <span className="pl-[0.25em] pt-[0.1em]">{slot('quotient')}</span>
        </span>
      </Spoken>
    </>
  );
};

const Fraction: React.FC<{ numerator: number; denominator: number }> = ({
  numerator,
  denominator,
}) => (
  <Spoken text={`${formatInteger(numerator)}/${formatInteger(denominator)}`}>
    <span className="inline-flex flex-col items-center text-[0.7em] leading-none mx-[0.1em]">
      <span className="px-[0.15em] pb-[0.08em]">{formatInteger(numerator)}</span>
      <span className="self-stretch border-t-[0.08em] border-slate-800" />
      <span className="px-[0.15em] pt-[0.08em]">{formatInteger(denominator)}</span>
    </span>
  </Spoken>
);

export const FractionOfQuantityPromptView: React.FC<PromptProps<'fraction_of_quantity'>> = ({
  prompt,
}) => {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center justify-center">
      <Fraction numerator={prompt.numerator} denominator={prompt.denominator} />
      <Word>{t('prompts.of')}</Word>
      {formatInteger(prompt.quantity)}
    </span>
  );
};

export const PercentageOfQuantityPromptView: React.FC<PromptProps<'percentage_of_quantity'>> = ({
  prompt,
}) => {
  const { t } = useTranslation();
  return (
    <>
      {formatPercent(prompt.rate)}
      <Word>{t('prompts.of')}</Word>
      {formatInteger(prompt.quantity)}
    </>
  );
};

const Exponentiation: React.FC<{ base: number; exponent: number }> = ({ base, exponent }) => {
  const { t } = useTranslation();
  const formattedBase = base < 0 ? `(${formatInteger(base)})` : formatInteger(base);
  const formattedExponent = formatInteger(exponent);
  return (
    <Spoken text={t('prompts.power', { base: formattedBase, exponent: formattedExponent })}>
      {formattedBase}
      <sup className="self-start top-0 mt-[0.1em] ml-[0.05em] text-[0.55em] leading-none">
        {formattedExponent}
      </sup>
    </Spoken>
  );
};

export const SquarePromptView: React.FC<PromptProps<'square'>> = ({ prompt }) => (
  <Exponentiation base={prompt.base} exponent={2} />
);

export const PowerPromptView: React.FC<PromptProps<'power'>> = ({ prompt }) => (
  <Exponentiation base={prompt.base} exponent={prompt.exponent} />
);

export const SquareRootPromptView: React.FC<PromptProps<'square_root'>> = ({ prompt }) => {
  const { t } = useTranslation();
  const radicand = formatInteger(prompt.radicand);
  return (
    <Spoken text={t('prompts.squareRoot', { radicand })}>
      <span className="text-[1.15em] font-normal -mr-[0.05em]">√</span>
      <span className="border-t-[0.07em] border-slate-800 pt-[0.05em] pr-[0.1em] leading-none">
        {radicand}
      </span>
    </Spoken>
  );
};

export const GcdPromptView: React.FC<PromptProps<'gcd'>> = ({ prompt }) => {
  const { t } = useTranslation();
  return (
    <Small>
      {t('prompts.gcd')}({formatInteger(prompt.left)}&nbsp;; {formatInteger(prompt.right)})
    </Small>
  );
};

export const LinearEquationPromptView: React.FC<PromptProps<'linear_equation'>> = ({ prompt }) => (
  <>
    <Small>
      <MathText text={`${formatAffine(prompt.left)} = ${formatAffine(prompt.right)}`} />
    </Small>
    <Hint>
      <Var>x</Var> = <Blank />
    </Hint>
  </>
);

const FunctionDefinition: React.FC<{ fn: AffineExpression }> = ({ fn }) => (
  <Hint>
    <MathText text={`f(x) = ${formatAffine(fn)}`} />
  </Hint>
);

export const FunctionImagePromptView: React.FC<PromptProps<'function_image'>> = ({ prompt }) => (
  <>
    <FunctionDefinition fn={prompt.function} />
    <Small>
      <Var>f</Var>({formatInteger(prompt.x)}) = <Blank />
    </Small>
  </>
);

export const FunctionAntecedentPromptView: React.FC<PromptProps<'function_antecedent'>> = ({
  prompt,
}) => (
  <>
    <FunctionDefinition fn={prompt.function} />
    <Small>
      <Var>f</Var>(<Blank />) = {formatInteger(prompt.image)}
    </Small>
  </>
);
