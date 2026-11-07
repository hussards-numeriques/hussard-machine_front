import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import type { AnswerInputProps } from './port';
import { digitRecognitionPort } from '../../services/digit-recognition';
import { useAuth } from '../../contexts/useAuth';

const RECOGNIZE_DELAY_MS = 700;

const fillWhite = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};

export const HandwritingInput: React.FC<AnswerInputProps> = ({ onSubmit, disabled }) => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const debounce = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recognized, setRecognized] = React.useState<number | null>(null);
  const [isNegative, setIsNegative] = React.useState(false);
  const [hasPendingInk, setHasPendingInk] = React.useState(false);
  const [isAwaitingAnswer, setIsAwaitingAnswer] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const recognition = React.useRef<Promise<number | null> | null>(null);
  const latestRequest = React.useRef(0);
  const isSubmitting = React.useRef(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    if (canvasRef.current) fillWhite(canvasRef.current);
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, []);

  const cancelPendingRecognition = () => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = null;
    recognition.current = null;
    latestRequest.current += 1;
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // Le backing store (canvas.width/height) est fixe (400x200) alors que la
    // taille affichee (rect) varie avec le layout (w-full). Sans ce facteur
    // d'echelle, le trait est decale par rapport au doigt vers les bords.
    const scaleX = rect.width ? canvas.width / rect.width : 1;
    const scaleY = rect.height ? canvas.height / rect.height : 1;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    cancelPendingRecognition();
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

  const recognizeCurrent = async (): Promise<number | null> => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const request = latestRequest.current;
    try {
      const value = await digitRecognitionPort.recognizeNumber(canvas);
      if (request !== latestRequest.current) return null;
      setRecognized(value);
      if (value === null) setError(t('answerInput.unreadable'));
      return value;
    } catch {
      if (request !== latestRequest.current) return null;
      setRecognized(null);
      setError(t('answerInput.recognitionError'));
      return null;
    } finally {
      if (request === latestRequest.current) setHasPendingInk(false);
    }
  };

  const startRecognition = () => {
    debounce.current = null;
    recognition.current = recognizeCurrent();
    return recognition.current;
  };

  const handlePointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    setHasPendingInk(true);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => void startRecognition(), RECOGNIZE_DELAY_MS);
  };

  const handleClear = () => {
    cancelPendingRecognition();
    setHasPendingInk(false);
    setError(null);
    setRecognized(null);
    if (canvasRef.current) fillWhite(canvasRef.current);
  };

  const submit = (value: number) => onSubmit(isNegative ? -value : value);

  const submitLatestDrawing = async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    if (debounce.current) clearTimeout(debounce.current);
    setIsAwaitingAnswer(true);
    const pending = debounce.current ? startRecognition() : recognition.current;
    const request = latestRequest.current;
    const value = await pending;
    isSubmitting.current = false;
    setIsAwaitingAnswer(false);
    if (value !== null && isMounted.current && request === latestRequest.current) {
      submit(value);
    }
  };

  const handleValidate = () => {
    if (hasPendingInk) {
      void submitLatestDrawing();
      return;
    }
    if (recognized !== null) submit(recognized);
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
      <div className="relative">
        <span
          data-testid="handwriting-beta-badge"
          className="pointer-events-none absolute -top-2.5 right-3 z-10 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700"
        >
          {t(isAuthenticated ? 'answerInput.betaBadgeAccount' : 'answerInput.betaBadge')}
        </span>
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
      </div>
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
          disabled={disabled || (recognized === null && !error && !hasPendingInk)}
        >
          {t('answerInput.clear')}
        </Button>
        <Button
          size="lg"
          className="flex-1 min-w-0 px-0"
          onClick={handleValidate}
          aria-label={t('answerInput.submit')}
          disabled={disabled || (recognized === null && !hasPendingInk)}
        >
          {isAwaitingAnswer ? '...' : t('answerInput.submit')}
        </Button>
      </div>
    </div>
  );
};
