import React from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import type { AnswerInputProps } from './port';

export const KeyboardInput: React.FC<AnswerInputProps> = ({ onSubmit, disabled }) => {
  const [answer, setAnswer] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!disabled) {
      setAnswer('');
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer || disabled) return;
    onSubmit(parseInt(answer, 10));
  };

  return (
    <form onSubmit={handleSubmit} aria-label="form" className="space-y-6">
      <Input
        ref={inputRef}
        type="number"
        placeholder="?"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={disabled}
        autoFocus
        className="text-4xl font-bold py-6"
      />
      <Button type="submit" size="lg" className="w-full" disabled={disabled || !answer}>
        {disabled ? 'Réponse envoyée...' : 'Valider'}
      </Button>
    </form>
  );
};
