import { z } from 'zod';

export type AuthorizedFetch = (input: string, init?: RequestInit) => Promise<Response>;

const API_ERROR_CODES = [
  'INVALID_TOKEN',
  'ACCOUNT_NOT_FOUND',
  'INVALID_LEVEL',
  'TITLE_NOT_UNLOCKED',
  'ICON_NOT_UNLOCKED',
  'PROMOTION_NOT_ALLOWED',
  'DEMOTION_NOT_ALLOWED',
  'AUTH_ACCOUNT_DELETION_FAILED',
  'SUBSCRIPTION_REQUIRED',
  'INVALID_REDEEM_CODE',
  'INVALID_WEBHOOK_SIGNATURE',
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

const apiErrorBodySchema = z.object({ detail: z.enum(API_ERROR_CODES) });

export class ApiError extends Error {
  status: number;
  code: ApiErrorCode | null;

  constructor(status: number, message: string, code: ApiErrorCode | null = null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const readErrorCode = async (response: Response): Promise<ApiErrorCode | null> => {
  try {
    const parsed = apiErrorBodySchema.safeParse(await response.json());
    return parsed.success ? parsed.data.detail : null;
  } catch {
    return null;
  }
};

export const apiErrorFrom = async (response: Response, context: string): Promise<ApiError> => {
  const code = await readErrorCode(response);
  return new ApiError(response.status, `${context} (${code ?? response.status})`, code);
};
