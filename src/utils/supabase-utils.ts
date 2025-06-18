import { PostgrestError, PostgrestSingleResponse } from '@supabase/supabase-js';
import { handleError } from '@/utils/debug';

/**
 * Type-safe helper for handling Supabase query responses
 * @param response The response from a Supabase query
 * @returns A tuple with data (or null) and error (or null)
 */
export function handleQueryResponse<T>(
  response: PostgrestSingleResponse<T>,
): [T | null, PostgrestError | null] {
  if (response.error) {
    handleError(response.error, 'handleQueryResponse');
    return [null, response.error];
  }

  return [response.data, null];
}

/**
 * Type-safe function to handle database row values
 * Safely extracts row data or returns a default value
 */
export function extractRowData<T, K extends keyof T>(
  data: T | null,
  key: K,
  defaultValue: T[K],
): T[K] {
  if (!data) return defaultValue;
  return data[key] || defaultValue;
}

/**
 * Type-safe wrapper for database insert operations
 */
export async function insertRow(supabaseQuery: any, row: Record<string, any>) {
  try {
    const { data, error } = await supabaseQuery.insert(row).select().single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    handleError(error, 'insertRow');
    return { data: null, error };
  }
}

/**
 * Type-safe wrapper for database update operations
 */
export async function updateRow(
  supabaseQuery: any,
  row: Record<string, any>,
  condition: any,
) {
  try {
    const { data, error } = await supabaseQuery
      .update(row)
      .match(condition)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    handleError(error, 'updateRow');
    return { data: null, error };
  }
}

/**
 * Safely convert query result to typed array with error handling
 */
export function safelyConvertQueryResult<T>(
  queryResult: any,
  defaultArray: T[] = [],
): T[] {
  if (!queryResult || queryResult.error) {
    return defaultArray;
  }

  // Handle potential error types
  if (typeof queryResult === 'string') {
    return defaultArray;
  }

  // Try to convert the result to the expected type
  try {
    return queryResult as T[];
  } catch (e) {
    handleError(e, 'safelyConvertQueryResult');
    return defaultArray;
  }
}

/**
 * Type-safe getter for database table fields with null checking
 */
export function getDbField<T>(obj: any, field: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object' || obj.error === true) {
    return defaultValue;
  }

  return (obj[field] as T) ?? defaultValue;
}

/**
 * Safe type assertion for Supabase queries
 */
export function typeSafeAs<T>(data: unknown): T {
  return data as T;
}
