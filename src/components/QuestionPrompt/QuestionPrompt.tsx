import React from 'react';
import type { QuestionPrompt as Prompt } from '../../types';
import { cn } from '../../lib/utils';
import {
  AdditionPromptView,
  ComplementPromptView,
  DifferenceOfSquaresPromptView,
  DivisionPromptView,
  DivisionTablePromptView,
  DoublePromptView,
  EuclideanDivisionPromptView,
  FractionOfQuantityPromptView,
  FunctionAntecedentPromptView,
  FunctionImagePromptView,
  GcdPromptView,
  HalfPromptView,
  LinearEquationPromptView,
  MissingFactorPromptView,
  MultiplicationByPowerOf10PromptView,
  MultiplicationPromptView,
  MultiplicationTablePromptView,
  OperationPriorityPromptView,
  PercentageOfQuantityPromptView,
  PowerPromptView,
  RelativeAdditionPromptView,
  RelativeDivisionPromptView,
  RelativeMultiplicationPromptView,
  RelativeOperationPriorityPromptView,
  RelativeSubtractionPromptView,
  SquarePromptView,
  SquareRootPromptView,
  SubtractionPromptView,
} from './prompts';

interface QuestionPromptProps {
  prompt: Prompt;
  className?: string;
}

const PromptBody = ({ prompt }: { prompt: Prompt }): React.ReactElement => {
  switch (prompt.type) {
    case 'addition':
      return <AdditionPromptView prompt={prompt} />;
    case 'subtraction':
      return <SubtractionPromptView prompt={prompt} />;
    case 'multiplication_table':
      return <MultiplicationTablePromptView prompt={prompt} />;
    case 'division_table':
      return <DivisionTablePromptView prompt={prompt} />;
    case 'multiplication':
      return <MultiplicationPromptView prompt={prompt} />;
    case 'difference_of_squares':
      return <DifferenceOfSquaresPromptView prompt={prompt} />;
    case 'division':
      return <DivisionPromptView prompt={prompt} />;
    case 'complement':
      return <ComplementPromptView prompt={prompt} />;
    case 'double':
      return <DoublePromptView prompt={prompt} />;
    case 'half':
      return <HalfPromptView prompt={prompt} />;
    case 'multiplication_by_power_of_10':
      return <MultiplicationByPowerOf10PromptView prompt={prompt} />;
    case 'operation_priority':
      return <OperationPriorityPromptView prompt={prompt} />;
    case 'relative_addition':
      return <RelativeAdditionPromptView prompt={prompt} />;
    case 'relative_subtraction':
      return <RelativeSubtractionPromptView prompt={prompt} />;
    case 'relative_multiplication':
      return <RelativeMultiplicationPromptView prompt={prompt} />;
    case 'relative_division':
      return <RelativeDivisionPromptView prompt={prompt} />;
    case 'relative_operation_priority':
      return <RelativeOperationPriorityPromptView prompt={prompt} />;
    case 'missing_factor':
      return <MissingFactorPromptView prompt={prompt} />;
    case 'linear_equation':
      return <LinearEquationPromptView prompt={prompt} />;
    case 'fraction_of_quantity':
      return <FractionOfQuantityPromptView prompt={prompt} />;
    case 'percentage_of_quantity':
      return <PercentageOfQuantityPromptView prompt={prompt} />;
    case 'square':
      return <SquarePromptView prompt={prompt} />;
    case 'power':
      return <PowerPromptView prompt={prompt} />;
    case 'square_root':
      return <SquareRootPromptView prompt={prompt} />;
    case 'euclidean_division':
      return <EuclideanDivisionPromptView prompt={prompt} />;
    case 'gcd':
      return <GcdPromptView prompt={prompt} />;
    case 'function_image':
      return <FunctionImagePromptView prompt={prompt} />;
    case 'function_antecedent':
      return <FunctionAntecedentPromptView prompt={prompt} />;
  }
};

export const QuestionPrompt: React.FC<QuestionPromptProps> = ({ prompt, className }) => (
  <div
    data-testid="question-prompt"
    className={cn('font-black text-slate-800 leading-tight tabular-nums', className)}
  >
    <PromptBody prompt={prompt} />
  </div>
);
