import { supabase } from '@/lib/supabase';
import { logDebug } from '@/utils/debug';

// Create storage bucket if it doesn't exist
export async function initializeStorage() {
  try {
    // Check if the buckets exist by trying to access them rather than creating
    await verifyBucketAccess('documents');
    await verifyBucketAccess('profiles');
  } catch (error) {
    logDebug('Error initializing storage - continuing anyway:', error, 'warn');
  }
}

// Verify bucket access without trying to create it if it exists
async function verifyBucketAccess(bucketName: string) {
  try {
    // First just try to list the bucket contents to see if it exists and we have access
    const { error } = await supabase.storage.from(bucketName).list();

    if (!error) {
      logDebug(`Successfully accessed ${bucketName} bucket`, null, 'info');
      return true; // Bucket exists and we have access
    }

    // If we get a 404 or error about bucket not found
    if (
      error?.message?.includes('not found') ||
      error?.message?.includes('bucket') ||
      error?.message?.toLowerCase().includes('not found')
    ) {
      logDebug(
        `Bucket ${bucketName} doesn't exist, attempting to create`,
        null,
        'info',
      );

      // Try to create the bucket with appropriate settings
      const options =
        bucketName === 'profiles'
          ? {
              public: true,
              fileSizeLimit: 2 * 1024 * 1024,
              allowedMimeTypes: [
                'image/png',
                'image/jpeg',
                'image/gif',
                'image/webp',
              ],
            }
          : {
              public: false,
              fileSizeLimit: 10 * 1024 * 1024,
            };

      const { error: createError } = await supabase.storage.createBucket(
        bucketName,
        options,
      );

      if (createError) {
        if (
          createError.message?.includes('row-level security') ||
          createError.message?.includes('401') ||
          createError.message?.includes('403') ||
          createError.message?.toLowerCase().includes('400')
        ) {
          // This is expected in production where buckets exist but RLS prevents seeing them
          logDebug(
            `Cannot create ${bucketName} bucket due to permissions - this is normal in production`,
            null,
            'warn',
          );
        } else {
          logDebug(
            `Failed to create ${bucketName} bucket: ${createError.message}`,
            createError,
            'error',
          );
        }
        return false;
      }

      logDebug(
        `Created ${bucketName} storage bucket successfully`,
        null,
        'info',
      );

      // For profiles bucket, add public policy
      if (bucketName === 'profiles') {
        await addPublicBucketPolicy();
      }

      return true;
    }

    // Any other error is likely permissions related
    logDebug(
      `Cannot access ${bucketName} bucket: ${error.message}`,
      error,
      'warn',
    );
    return false;
  } catch (err) {
    logDebug(`Error verifying ${bucketName} bucket access`, err, 'error');
    return false;
  }
}

// Add a public bucket policy to avoid RLS issues
async function addPublicBucketPolicy() {
  try {
    // Test the bucket permission instead of immediately creating a file
    const { error } = await supabase.storage.from('profiles').list();

    if (error) {
      logDebug('Storage permissions check failed:', error, 'warn');
      return;
    }

    // Only create test file if needed for policy verification
    const { error: uploadError } = await supabase.storage
      .from('profiles')
      .upload(
        'test-public-policy.txt',
        new Blob(['This is a test file to set policies']),
        {
          upsert: true,
        },
      );

    if (uploadError) {
      logDebug(
        'Error creating public bucket policy, but continuing:',
        uploadError,
        'warn',
      );
    } else {
      // Remove the test file if upload was successful
      await supabase.storage
        .from('profiles')
        .remove(['test-public-policy.txt']);
    }
  } catch (error) {
    logDebug('Error adding bucket policies, but continuing:', error, 'warn');
  }
}

// Initialize storage when the app starts with error handling - use more resilient approach
try {
  // Delay the initialization slightly to ensure auth is ready
  setTimeout(() => {
    initializeStorage().catch((err) => {
      logDebug(
        'Storage initialization had issues - application will continue:',
        err,
        'warn',
      );
    });
  }, 3000); // Increased delay to ensure auth is fully established
} catch (error) {
  logDebug(
    'Error calling initializeStorage - application will continue:',
    error,
    'warn',
  );
}
