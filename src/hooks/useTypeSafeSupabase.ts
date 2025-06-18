'use client';
import { supabase } from '@/lib/supabase';
import { handleError } from '@/utils/debug';
import { Database } from '@/lib/database.types';
import { ErrorType, AnyObject } from '@/types/common';

// Get the available tables from our database schema
export type Tables = keyof Database['public']['Tables'];

export interface SupabaseQueryOptions {
  column?: string;
  value?: any;
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
}

export function useTypeSafeSupabase<T = unknown>() {
  /**
   * Safe select operation with error handling
   */
  const safeSelect = async <T extends Tables>(
    table: T,
    columns: string = '*',
    options?: SupabaseQueryOptions,
  ) => {
    try {
      let query = supabase.from(table).select(columns);

      if (options?.column && options?.value !== undefined) {
        query = query.eq(options.column, options.value);
      }

      if (options?.order) {
        const { column, ascending = true } = options.order;
        query = query.order(column, { ascending });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      handleError(error);
      return { data: null, error };
    }
  };

  /**
   * Safe insert operation with error handling
   */
  const safeInsert = async <T extends Tables>(
    table: T,
    values: Database['public']['Tables'][T]['Insert'],
  ) => {
    try {
      // Type assertion needed here because TypeScript can't infer the exact table type
      const { data, error } = await supabase
        .from(table)
        .insert(values as any)
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      handleError(error);
      return { data: null, error };
    }
  };

  /**
   * Safe update operation with error handling
   */
  const safeUpdate = async <T extends Tables>(
    table: T,
    values: Database['public']['Tables'][T]['Update'],
    filter: { column: string; value: any },
  ) => {
    try {
      // Type assertion needed here similar to safeInsert
      const { data, error } = await supabase
        .from(table)
        .update(values as any)
        .eq(filter.column, filter.value)
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      handleError(error);
      return { data: null, error };
    }
  };

  /**
   * Safe delete operation with error handling
   */
  const safeDelete = async <T extends Tables>(
    table: T,
    filter: { column: string; value: any },
  ) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq(filter.column, filter.value);

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      handleError(error);
      return { data: null, error };
    }
  };

  const handleError = (error: ErrorType) => {
    // ...existing error handling code...
  };

  const query = async (table: string, options?: AnyObject) => {
    // ...existing query code...
  };

  return {
    supabase,
    safeSelect,
    safeInsert,
    safeUpdate,
    safeDelete,
  };
}

export default useTypeSafeSupabase;
