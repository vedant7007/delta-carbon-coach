import { NextResponse } from 'next/server';
import { ZodError, type z, type ZodTypeAny } from 'zod';

/**
 * Structured error shape returned by every route: `{ error: { code, message } }`.
 * Internal details are never leaked to the client.
 */
export type ApiErrorCode =
  | 'unauthorized'
  | 'bad_request'
  | 'not_found'
  | 'forbidden'
  | 'rate_limited'
  | 'ai_unavailable'
  | 'internal';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    /** Field-level validation issues, safe to show the user. */
    fields?: Record<string, string>;
  };
}

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  bad_request: 400,
  not_found: 404,
  forbidden: 403,
  rate_limited: 429,
  ai_unavailable: 503,
  internal: 500,
};

/** A throwable error that carries an HTTP-mappable code. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly fields?: Record<string, string>;

  constructor(code: ApiErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.fields = fields;
  }
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
): NextResponse<ApiErrorBody> {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status: STATUS[code] },
  );
}

/** Parses a request body against a schema, throwing a 400 ApiError on failure. */
export async function parseJson<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError('bad_request', 'Request body must be valid JSON');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError('bad_request', 'Validation failed', flattenZod(result.error));
  }
  return result.data;
}

function flattenZod(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = issue.message;
  }
  return fields;
}

export interface RouteContext {
  params: Promise<Record<string, string>>;
}

/**
 * Runs a route body and maps any throw to a structured response: ApiError to
 * its status, ZodError to 400, anything else to a generic 500 — no stack traces
 * ever reach the client. Routes keep their native Next.js signatures.
 */
export async function runGuarded(
  body: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await body();
  } catch (err) {
    if (err instanceof ApiError) {
      return errorResponse(err.code, err.message, err.fields);
    }
    if (err instanceof ZodError) {
      return errorResponse('bad_request', 'Validation failed', flattenZod(err));
    }
    // Log server-side only; never echo the message to the client.
    console.error('Unhandled route error:', err);
    return errorResponse('internal', 'Something went wrong. Please try again.');
  }
}
