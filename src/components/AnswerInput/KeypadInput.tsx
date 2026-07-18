import { useState, useEffect } from 'react';
import { Button } from '../Button';
import type { AnswerInputProps } from './port';

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export const KeypadInput: React.FC<AnswerInputProps> = ({ onSubmit, disabled }) => {
  const [digits, setDigits] = useState('');
  const [isNegative, setIsNegative] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!disabled) {
      setDigits('');
      setIsNegative(false);
    }
  }, [disabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const appendDigit = (digit: string) => setDigits((prev) => prev + digit);
  const handleBackspace = () => setDigits((prev) => prev.slice(0, -1));

  const handleValidate = () => {
    if (digits.length === 0) return;
    const value = parseInt(digits, 10);
    onSubmit(isNegative ? -value : value);
  };

  const display = `${isNegative ? '−' : ''}${digits}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <p
          data-testid="current-answer"
          className="text-center text-3xl font-bold tracking-widest text-slate-800 min-h-[2.5rem]"
        >
          {display}
        </p>
        <Button
          variant="secondary"
          size="md"
          aria-label="Effacer"
          className="px-4"
          onClick={handleBackspace}
          disabled={disabled || digits.length === 0}
        >
          ⌫
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {DIGITS.map((digit) => (
          <Button
            key={digit}
            variant="secondary"
            size="lg"
            className="min-w-0 px-0"
            onClick={() => appendDigit(digit)}
            disabled={disabled}
          >
            {digit}
          </Button>
        ))}
        <Button
          variant="secondary"
          size="lg"
          aria-label="±"
          className="min-w-0 px-0"
          onClick={() => setIsNegative((s) => !s)}
          disabled={disabled}
        >
          ±
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="min-w-0 px-0"
          onClick={() => appendDigit('0')}
          disabled={disabled}
        >
          0
        </Button>
        <Button
          size="lg"
          className="min-w-0 px-0"
          onClick={handleValidate}
          disabled={disabled || digits.length === 0}
        >
          Valider
        </Button>
      </div>
    </div>
  );
};
