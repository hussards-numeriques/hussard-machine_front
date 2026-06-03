import React from 'react';
import { Button } from '../Button';
import type { AnswerInputProps } from './port';
import { digitRecognitionPort } from '../../services/digit-recognition';
import type { Stroke, Point } from '../../services/digit-recognition/port';

export const HandwritingInput: React.FC<AnswerInputProps> = ({ onSubmit, disabled }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = React.useState<Stroke[]>([]);
  const currentStroke = React.useRef<Point[]>([]);
  const [isRecognizing, setIsRecognizing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const pt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentStroke.current = [pt];
    setError(null);

    const ctx = getCtx()!;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled || currentStroke.current.length === 0) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const pt: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    currentStroke.current.push(pt);

    const ctx = getCtx()!;
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    if (currentStroke.current.length === 0) return;
    setStrokes((prev) => [...prev, { points: [...currentStroke.current] }]);
    currentStroke.current = [];
  };

  const handleClear = () => {
    setStrokes([]);
    setError(null);
    currentStroke.current = [];
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleValidate = async () => {
    if (!canvasRef.current || isRecognizing) return;
    setIsRecognizing(true);
    setError(null);

    const result = await digitRecognitionPort.recognize(canvasRef.current, strokes);
    setIsRecognizing(false);

    if (result === null) {
      setError('Impossible de lire, réessaie');
      return;
    }

    onSubmit(result);
  };

  return (
    <div className="space-y-4">
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
      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={handleClear}
          disabled={disabled}
        >
          Effacer
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={handleValidate}
          disabled={disabled || isRecognizing}
        >
          {isRecognizing ? '...' : 'Valider'}
        </Button>
      </div>
    </div>
  );
};
