import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useAuth } from '../contexts/useAuth';
import { AuthError } from '../services/AuthClient';
import { Button } from './Button';
import { Input } from './Input';

const USERNAME_MIN = 3;
const USERNAME_MAX = 50;
const PASSWORD_MIN = 8;

const createLoginSchema = (t: TFunction) =>
  z.object({
    username: z.string().min(1, t('auth.validation.usernameRequired')),
    password: z.string().min(1, t('auth.validation.passwordRequired')),
  });

const createRegisterSchema = (t: TFunction) => {
  const usernameLength = t('auth.validation.usernameLength', {
    min: USERNAME_MIN,
    max: USERNAME_MAX,
  });
  return z.object({
    email: z.string().email(t('auth.validation.invalidEmail')),
    username: z.string().min(USERNAME_MIN, usernameLength).max(USERNAME_MAX, usernameLength),
    password: z
      .string()
      .min(PASSWORD_MIN, t('auth.validation.passwordLength', { min: PASSWORD_MIN })),
  });
};

type Mode = 'LOGIN' | 'REGISTER';

interface AuthModalProps {
  onClose: () => void;
}

const FieldError = ({ errors }: { errors: unknown[] }) => {
  const message = errors.find(Boolean);
  if (!message) return null;
  return <p className="text-rose-600 text-sm ml-2 font-bold">{String(message)}</p>;
};

const ServerError = ({ message }: { message: string | null }) => {
  if (!message) return null;
  return (
    <div className="p-3 bg-rose-100 text-rose-700 rounded-xl text-center font-bold">{message}</div>
  );
};

const LoginForm = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { username: '', password: '' },
    validators: { onSubmit: createLoginSchema(t) },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await login(value);
        onClose();
      } catch (err) {
        setServerError(err instanceof AuthError ? err.message : t('auth.genericError'));
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="username"
        children={(field) => (
          <div className="space-y-2">
            <label className="font-bold text-slate-600 ml-2">{t('auth.username')}</label>
            <Input
              placeholder={t('auth.usernamePlaceholder')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="username"
            />
            {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
          </div>
        )}
      />

      <form.Field
        name="password"
        children={(field) => (
          <div className="space-y-2">
            <label className="font-bold text-slate-600 ml-2">{t('auth.password')}</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="current-password"
            />
            {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
          </div>
        )}
      />

      <ServerError message={serverError} />

      <form.Subscribe
        selector={(state) => state.isSubmitting}
        children={(isSubmitting) => (
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('auth.submitting') : t('auth.login')}
          </Button>
        )}
      />
    </form>
  );
};

const RegisterForm = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: '', username: '', password: '' },
    validators: { onSubmit: createRegisterSchema(t) },
    onSubmit: async ({ value }) => {
      setServerError(null);
      try {
        await register(value);
        onClose();
      } catch (err) {
        setServerError(err instanceof AuthError ? err.message : t('auth.genericError'));
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field
        name="email"
        children={(field) => (
          <div className="space-y-2">
            <label className="font-bold text-slate-600 ml-2">{t('auth.email')}</label>
            <Input
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="email"
            />
            {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
          </div>
        )}
      />

      <form.Field
        name="username"
        children={(field) => (
          <div className="space-y-2">
            <label className="font-bold text-slate-600 ml-2">{t('auth.username')}</label>
            <Input
              placeholder={t('auth.usernamePlaceholder')}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="new-username"
              minLength={USERNAME_MIN}
              maxLength={USERNAME_MAX}
            />
            {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
          </div>
        )}
      />

      <form.Field
        name="password"
        children={(field) => (
          <div className="space-y-2">
            <label className="font-bold text-slate-600 ml-2">{t('auth.password')}</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              autoComplete="new-password"
              minLength={PASSWORD_MIN}
            />
            {field.state.meta.isTouched && <FieldError errors={field.state.meta.errors} />}
          </div>
        )}
      />

      <ServerError message={serverError} />

      <form.Subscribe
        selector={(state) => state.isSubmitting}
        children={(isSubmitting) => (
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('auth.submitting') : t('auth.register')}
          </Button>
        )}
      />
    </form>
  );
};

const GoogleButton = () => {
  const { t } = useTranslation();
  const { client } = useAuth();
  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => void client.loginWithGoogle()}
      >
        {t('auth.google')}
      </Button>
      <div className="flex items-center gap-3 text-slate-400 text-sm font-bold">
        <span className="h-px flex-1 bg-slate-200" />
        {t('auth.or')}
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('LOGIN');

  const flip = () => setMode((prev) => (prev === 'LOGIN' ? 'REGISTER' : 'LOGIN'));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-100 p-8 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-primary-dark">
            {mode === 'LOGIN' ? t('auth.loginTitle') : t('auth.registerTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl font-bold"
            aria-label={t('common.close')}
          >
            ×
          </button>
        </div>

        <GoogleButton />

        {mode === 'LOGIN' ? <LoginForm onClose={onClose} /> : <RegisterForm onClose={onClose} />}

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={flip}
            className="text-primary font-bold hover:underline text-sm"
          >
            {mode === 'LOGIN' ? t('auth.noAccount') : t('auth.haveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};
