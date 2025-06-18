// Common error type
export type ErrorType = Error | { message: string } | unknown;

// Common data types
export type AnyObject = Record<string, unknown>;
export type AnyFunction = (...args: unknown[]) => unknown;

// Supabase types
export type SupabaseError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

// Form types
export type FormData = Record<string, unknown>;

// API Response types
export type ApiResponse<T = unknown> = {
  data?: T;
  error?: SupabaseError;
};
