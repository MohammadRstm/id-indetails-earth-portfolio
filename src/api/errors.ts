/** Any failed call to the website API: a reply with an error, or no usable reply at all. */
export class ApiError extends Error {
  /** HTTP status; 0 when the server could not be reached or the reply was not usable. */
  readonly status: number;
  /** The API's machine-readable code (`ApiErrorResponse.code`), or a local one for client-side failures. */
  readonly code: string;
  /** Field messages for validation errors, keyed by camelCase field name. */
  readonly fieldErrors: Record<string, string[]>;
  readonly traceId: string | null;

  constructor(status: number, code: string, message: string, fieldErrors: Record<string, string[]> = {}, traceId: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.traceId = traceId;
  }

  get isValidation(): boolean {
    return this.status === 400 && Object.keys(this.fieldErrors).length > 0;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Turns an error reply into an ApiError, reading the API's ApiErrorResponse shape when it is there. */
export function apiErrorFrom(status: number, body: unknown): ApiError {
  if (!isRecord(body)) return new ApiError(status, 'http_error', `The server answered ${status}.`);
  const fieldErrors: Record<string, string[]> = {};
  if (isRecord(body.errors)) {
    for (const [field, messages] of Object.entries(body.errors)) {
      if (Array.isArray(messages)) fieldErrors[field] = messages.filter((message): message is string => typeof message === 'string');
    }
  }
  return new ApiError(
    status,
    typeof body.code === 'string' && body.code ? body.code : 'http_error',
    typeof body.message === 'string' && body.message ? body.message : `The server answered ${status}.`,
    fieldErrors,
    typeof body.traceId === 'string' ? body.traceId : null,
  );
}
