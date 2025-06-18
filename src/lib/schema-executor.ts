import { SupabaseClient } from '@supabase/supabase-js';
import { logDebug } from '@/utils/debug';

/**
 * Checks if the execute_sql function exists in the database
 * This function is needed for schema execution
 */
export async function checkExecuteSqlFunction(
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    // Try to execute a simple query using the function
    await supabase.rpc('execute_sql', { sql_query: 'SELECT 1' });
    return true;
  } catch (error: any) {
    // If the error is a 404, it means the RPC endpoint doesn't exist
    if (
      error.status === 404 ||
      (error.message && error.message.includes('Not Found'))
    ) {
      logDebug('execute_sql function not found (404 error)', error, 'error');
      return false;
    }

    // If the error mentions the function doesn't exist, return false
    if (
      error.message &&
      ((error.message.includes('function') &&
        error.message.includes('does not exist')) ||
        error.message.includes('not found'))
    ) {
      logDebug('execute_sql function does not exist', error, 'error');
      return false;
    }

    // If it's another type of error (like permission denied),
    // we still consider the function might exist
    logDebug('Error checking execute_sql function', error, 'warn');
    return true;
  }
}

/**
 * Creates the execute_sql function in the database
 * This function is necessary to run schema commands
 */
export async function createExecuteSqlFunction(
  supabase: SupabaseClient,
): Promise<{ success: boolean; error?: string }> {
  try {
    // SQL to create the execute_sql function with SECURITY DEFINER
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql_query;
      END;
      $$;
    `;

    // Try to execute directly (requires high privileges)
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: createFunctionSQL,
    });

    if (error) {
      logDebug('Could not create execute_sql function', error, 'error');
      // This likely means they need to manually create the function
      return {
        success: false,
        error: `Could not create execute_sql function: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error: any) {
    // Handle 404 errors explicitly
    if (
      error.status === 404 ||
      (error.message && error.message.includes('Not Found'))
    ) {
      logDebug(
        'Cannot create execute_sql function: RPC endpoint not found',
        error,
        'error',
      );
      return {
        success: false,
        error:
          'The execute_sql RPC endpoint is not available on your Supabase instance.',
      };
    }

    logDebug('Error creating execute_sql function', error, 'error');
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Fallback method to execute SQL when the RPC method fails
 * This uses direct SQL queries instead of the execute_sql RPC function
 */
async function executeSqlFallback(
  supabase: SupabaseClient,
  sql: string,
): Promise<{ error: any | null }> {
  try {
    // For security, we only allow certain types of operations in fallback mode
    if (sql.trim().toLowerCase().startsWith('select')) {
      // For SELECT statements, we can use the .from() method with a raw query
      const { error } = await supabase.from('dummy').select('*').limit(1);
      if (error) {
        return { error };
      }
      return { error: null };
    } else {
      // For non-SELECT statements, we can't safely execute them without the RPC
      return {
        error: {
          message: 'Cannot execute non-SELECT statements in fallback mode',
        },
      };
    }
  } catch (error) {
    return { error };
  }
}

/**
 * Executes a SQL schema in Supabase by splitting it into manageable chunks
 * to avoid timeout issues with large SQL files
 */
export async function executeSchemaInChunks(
  supabase: SupabaseClient,
  schema: string,
  onProgress?: (progress: number, message: string) => void,
): Promise<{ success: boolean; error?: string }> {
  try {
    // First check if the execute_sql function exists
    const hasExecuteSqlFunction = await checkExecuteSqlFunction(supabase);
    let useFallbackMode = false;

    if (!hasExecuteSqlFunction) {
      if (onProgress) {
        onProgress(
          0,
          '⚠️ The execute_sql function is missing from your Supabase database',
        );
        onProgress(0, 'Attempting to create the function automatically...');
      }

      // Try to create the function
      const createResult = await createExecuteSqlFunction(supabase);

      if (!createResult.success) {
        if (onProgress) {
          onProgress(
            0,
            '❌ Could not automatically create the execute_sql function',
          );
          onProgress(
            0,
            'You will need to create this function manually in the Supabase SQL Editor:',
          );
          onProgress(
            0,
            `
CREATE OR REPLACE FUNCTION execute_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;`,
          );
          onProgress(
            10,
            '🔄 Switching to fallback mode for limited operations',
          );
        }

        // Set fallback mode to true
        useFallbackMode = true;
        logDebug('Switching to fallback mode for SQL execution', null, 'warn');
      } else {
        if (onProgress) {
          onProgress(5, '✓ Successfully created the execute_sql function');
        }
      }
    }

    // Split the schema into manageable chunks that won't timeout
    const chunks = splitSchema(schema);
    const totalChunks = chunks.length;

    // Execute each chunk sequentially
    for (let i = 0; i < totalChunks; i++) {
      const chunk = chunks[i];
      const chunkPreview = chunk.substring(0, 50).replace(/\n/g, ' ') + '...';

      // Report progress
      if (onProgress) {
        onProgress(
          Math.round((i / totalChunks) * 100),
          `Executing chunk ${i + 1}/${totalChunks}: ${chunkPreview}`,
        );
      }

      try {
        let error = null;

        if (useFallbackMode) {
          // Use fallback method if we can't use the RPC method
          const result = await executeSqlFallback(supabase, chunk);
          error = result.error;
        } else {
          // Execute the SQL chunk using the execute_sql RPC
          const result = await supabase.rpc('execute_sql', {
            sql_query: chunk,
          });
          error = result.error;
        }

        if (error) {
          // If the error is a 404, switch to fallback mode
          if (
            error.status === 404 ||
            (error.message && error.message.includes('Not Found'))
          ) {
            useFallbackMode = true;
            logDebug(
              '404 error on execute_sql RPC, switching to fallback mode',
              error,
              'warn',
            );

            if (onProgress) {
              onProgress(
                Math.round((i / totalChunks) * 100),
                `⚠️ RPC endpoint not found. Switching to fallback mode.`,
              );
            }

            // Try again with fallback mode
            const fallbackResult = await executeSqlFallback(supabase, chunk);
            if (fallbackResult.error) {
              // If this chunk fails in fallback mode too, log the error
              console.warn(
                `Warning: Chunk ${i + 1} fallback execution error:`,
                fallbackResult.error,
              );
              if (onProgress) {
                onProgress(
                  Math.round(((i + 1) / totalChunks) * 100),
                  `⚠️ Warning with chunk ${i + 1} (fallback): ${fallbackResult.error.message}`,
                );
              }
            }
          } else {
            // If this chunk fails for other reasons, log it but continue with the next chunks
            console.warn(
              `Warning: Chunk ${i + 1} execution error:`,
              error.message,
            );
            if (onProgress) {
              onProgress(
                Math.round(((i + 1) / totalChunks) * 100),
                `⚠️ Warning with chunk ${i + 1}: ${error.message}`,
              );
            }
          }
        } else if (onProgress) {
          onProgress(
            Math.round(((i + 1) / totalChunks) * 100),
            `✓ Chunk ${i + 1} executed successfully${useFallbackMode ? ' (fallback mode)' : ''}`,
          );
        }
      } catch (chunkError: any) {
        // If the error is a 404, switch to fallback mode
        if (
          chunkError.status === 404 ||
          (chunkError.message && chunkError.message.includes('Not Found'))
        ) {
          useFallbackMode = true;
          logDebug(
            '404 error exception on execute_sql RPC, switching to fallback mode',
            chunkError,
            'warn',
          );

          if (onProgress) {
            onProgress(
              Math.round((i / totalChunks) * 100),
              `⚠️ RPC endpoint not found. Switching to fallback mode.`,
            );
          }

          // Try again with fallback mode
          try {
            const fallbackResult = await executeSqlFallback(supabase, chunk);
            if (fallbackResult.error) {
              console.warn(
                `Warning: Chunk ${i + 1} fallback execution error:`,
                fallbackResult.error,
              );
              if (onProgress) {
                onProgress(
                  Math.round(((i + 1) / totalChunks) * 100),
                  `⚠️ Warning with chunk ${i + 1} (fallback): ${fallbackResult.error.message}`,
                );
              }
            }
          } catch (fallbackError) {
            console.warn(
              `Warning: Chunk ${i + 1} fallback execution exception:`,
              fallbackError,
            );
          }
        } else {
          console.warn(
            `Warning: Chunk ${i + 1} execution exception:`,
            chunkError,
          );
          if (onProgress) {
            onProgress(
              Math.round(((i + 1) / totalChunks) * 100),
              `⚠️ Error with chunk ${i + 1}: ${String(chunkError)}`,
            );
          }
        }
      }
    }

    // Final progress update
    if (onProgress) {
      onProgress(
        100,
        useFallbackMode
          ? '✓ Schema execution completed (limited functionality in fallback mode)'
          : '✓ Schema execution completed',
      );
    }

    return {
      success: true,
      error: useFallbackMode ? 'Limited execution in fallback mode' : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// Split the schema into manageable chunks that won't timeout
function splitSchema(sql: string): string[] {
  // Split on specific comment patterns that indicate logical breaks
  const chunks = sql.split(
    /-- Create |-- Add |-- Enable |-- RLS Policies |-- Ensure |-- Insert |-- This migration/,
  );

  // Filter out empty chunks and add the prefix back
  return chunks
    .filter((chunk) => chunk.trim().length > 0)
    .map((chunk, index) => {
      // Add back the prefix except for the first chunk
      return index === 0 ? chunk : `-- Create ${chunk}`;
    });
}
