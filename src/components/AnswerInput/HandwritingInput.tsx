import React from 'react';
import { Button } from '../Button';
import type { AnswerInputProps } from './port';
import { digitRecognitionPort } from '../../services/digit-recognition';

const RECOGNIZE_DELAY_MS = 700;

const fillWhite = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export const HandwritingInput: React.FC<AnswerInputProps> = ({ onSubmit, disabled }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recognized, setRecognized] = React.useState<number | null>(null);
  const [isNegative, setIsNegative] = React.useState(false);
  const [isRecognizing, setIsRecognizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (canvasRef.current) fillWhite(canvasRef.current);
  }, []);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    if (debounce.current) clearTimeout(debounce.current);
    drawing.current = true;
    setError(null);
    const ctx = canvasRef.current!.getContext('2d')!;
    const pt = point(e);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const pt = point(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const recognizeCurrent = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsRecognizing(true);
    try {
      const value = await digitRecognitionPort.recognizeNumber(canvas);
      if (value === null) {
        setError('Impossible de lire, réessaie');
        return;
      }
      setRecognized(value);
    } catch {
      setError('Erreur de reconnaissance, réessaie');
    } finally {
      setIsRecognizing(false);
    }
  };

  const handlePointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void recognizeCurrent(), RECOGNIZE_DELAY_MS);
  };

  const handleClear = () => {
    if (debounce.current) clearTimeout(debounce.current);
    setError(null);
    setRecognized(null);
    if (canvasRef.current) fillWhite(canvasRef.current);
  };

  const handleValidate = () => {
    if (recognized === null) return;
    onSubmit(isNegative ? -recognized : recognized);
  };

  const display = `${isNegative ? '−' : ''}${recognized ?? ''}`;

  return (
    <div className="space-y-4">
      <p
        data-testid="current-answer"
        className="text-center text-3xl font-bold tracking-widest text-slate-800 min-h-[2.5rem]"
      >
        {display}
      </p>
      <canvas
        ref={canvasRef}
        width={400}
        height={200}
        className="w-full rounded-xl border-2 border-slate-200 bg-white touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 min-w-0 px-0"
          onClick={() => setIsNegative((s) => !s)}
          disabled={disabled}
        >
          ±
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1 min-w-0 px-0"
          onClick={handleClear}
          disabled={disabled || (recognized === null && !error)}
        >
          Effacer
        </Button>
        <Button
          size="lg"
          className="flex-1 min-w-0 px-0"
          onClick={handleValidate}
          disabled={disabled || isRecognizing || recognized === null}
        >
          {isRecognizing ? '...' : 'Valider'}
        </Button>
      </div>
    </div>
  );
};
