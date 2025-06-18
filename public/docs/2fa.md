---
title: Two-Factor Authentication (2FA) Setup Guide
description: This guide explains how to manually set up Two-Factor Authentication (2FA) using the pre-built Supabase Edge Functions available in the `supabase/functions` directory of this project.
date: 2025-04-03
keywords: konbase, convention, event, inventory, staff, scheduling, association
implementation_status: planned
author: Artur Sendyka
last_updated: 2025-04-24
---

## Prerequisites

1.  **Supabase Project**: You need an active Supabase project.
2.  **Supabase CLI**: Ensure you have the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and configured for your project. Log in using `supabase login` and link your project using `supabase link --project-ref <your-project-ref>`.
3.  **Environment Variables**: Make sure your Supabase project has the necessary environment variables set, especially `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which are used by the Edge Functions. You might need to set these locally for the CLI using `supabase secrets set`.

## 1. Database Setup

You need to create a table to store 2FA information for users and add a flag to your user profiles table to indicate if 2FA is enabled.

**a. Create `user_2fa` Table:**

Execute the following SQL in your Supabase SQL Editor or via a migration file:

```sql
CREATE TABLE public.user_2fa (
    user_id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    totp_secret text NOT NULL,
    recovery_keys text[] NOT NULL,
    used_recovery_keys text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

-- Policies (Adjust based on your security requirements)
-- Allow users to view and manage their own 2FA settings
CREATE POLICY "Allow individual user access"
ON public.user_2fa
FOR ALL
USING (auth.uid() = user_id);

-- Optional: Allow service roles to bypass RLS (used by Edge Functions)
-- Note: Edge functions using the service_role key bypass RLS by default.
```

**b. Add `two_factor_enabled` Column to `profiles` Table:**

Assuming you have a `profiles` table linked to `auth.users` via a `user_id` or `id` column:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS two_factor_enabled boolean DEFAULT false NOT NULL;
```

_(Adjust the table name (`profiles`) and linking column (`id`) if yours are different)._

## 2. Deploy Edge Functions

Deploy the prepared Edge Functions using the Supabase CLI. Navigate to the root directory of your project in your terminal and run:

```powershell
# Deploy all functions in the supabase/functions directory
supabase functions deploy --project-ref <your-project-ref>

# Or deploy specific functions individually:
# supabase functions deploy complete-2fa-setup --project-ref <your-project-ref>
# supabase functions deploy disable-2fa --project-ref <your-project-ref>
# supabase functions deploy generate-recovery-keys --project-ref <your-project-ref>
# supabase functions deploy generate-totp-secret --project-ref <your-project-ref>
# supabase functions deploy verify-totp --project-ref <your-project-ref>
# supabase functions deploy elevate-to-super-admin --project-ref <your-project-ref> # If needed

# Note: If functions require bypassing JWT verification (e.g., for service role operations),
# you might need the --no-verify-jwt flag, but use with caution:
# supabase functions deploy --project-ref <your-project-ref> --no-verify-jwt
```

Replace `<your-project-ref>` with your actual Supabase project reference.

## 3. Frontend Integration Steps

Here's a high-level overview of how your frontend application should interact with these Edge Functions:

**a. Setting Up 2FA:**

1.  **Generate Secret**: When a user wants to enable 2FA, call the `generate-totp-secret` function. This returns a `secret` (Base32 encoded) and a `keyUri` (otpauth:// URI).
    ```javascript
    // Example frontend call
    const { data, error } = await supabase.functions.invoke(
      'generate-totp-secret',
    );
    if (error) throw error;
    const { secret, keyUri } = data;
    // Store the secret temporarily client-side
    ```
2.  **Display QR Code**: Use a library (like `qrcode.react` or `qrcode`) to convert the `keyUri` into a QR code and display it to the user. The user scans this with their authenticator app (e.g., Google Authenticator, Authy).
3.  **Generate Recovery Keys**: Call the `generate-recovery-keys` function to get a list of backup recovery keys.
    ```javascript
    // Example frontend call
    const { data: recoveryData, error: recoveryError } =
      await supabase.functions.invoke('generate-recovery-keys', {
        body: { count: 10 }, // Optional: specify number of keys
      });
    if (recoveryError) throw recoveryError;
    const { keys: recoveryKeys } = recoveryData;
    // Display these keys to the user and instruct them to save securely.
    ```
4.  **Verify Initial TOTP**: Ask the user to enter the code displayed in their authenticator app. Call the `verify-totp` function _with the secret obtained in step 1_ to confirm the user has correctly added the secret to their app.
    ```javascript
    // Example frontend call
    const userEnteredToken = '123456'; // Get from user input
    const { data: verifyData, error: verifyError } =
      await supabase.functions.invoke('verify-totp', {
        body: { secret: secret, token: userEnteredToken },
      });
    if (verifyError || !verifyData.verified) {
      // Handle verification failure
      console.error('Initial TOTP verification failed');
      return;
    }
    ```
5.  **Complete Setup**: If the initial TOTP is verified, call the `complete-2fa-setup` function, passing the `secret` and the generated `recoveryKeys`. This function saves the data securely in the `user_2fa` table and updates the user's profile (`two_factor_enabled = true`).
    ```javascript
    // Example frontend call (requires user to be authenticated)
    const { data: completeData, error: completeError } =
      await supabase.functions.invoke('complete-2fa-setup', {
        body: { secret: secret, recoveryKeys: recoveryKeys },
      });
    if (completeError) throw completeError;
    // 2FA is now enabled!
    ```

**b. Logging In with 2FA:**

1.  **Standard Login**: User logs in with email/password or other primary method.
2.  **Check 2FA Status**: After successful primary authentication, check the user's profile (e.g., `supabase.auth.user().user_metadata.two_factor_enabled` or fetch from your `profiles` table).
3.  **Prompt for TOTP**: If 2FA is enabled, prompt the user for their TOTP code.
4.  **Verify Login TOTP**: Call a **modified** or **new** Edge Function to verify the TOTP.
    - **Important**: The current `verify-totp` function requires the `secret` to be passed in the body. For login, the secret should **not** come from the client. You need a function that:
      - Accepts the user's `token`.
      - Uses the authenticated user's JWT (passed automatically in the `Authorization` header) to get the `user_id`.
      - Retrieves the user's `totp_secret` from the `user_2fa` table using the `user_id` (using the admin client).
      - Performs the TOTP verification using the retrieved secret and the provided token.
      - Returns whether the verification was successful.
    - You will need to create this secure login verification function.

**c. Disabling 2FA:**

1.  **Verification (Optional but Recommended)**: Verify the user's identity again (e.g., password confirmation or TOTP verification).
2.  **Call Disable Function**: Invoke the `disable-2fa` function. This function uses the user's JWT to identify them, deletes their entry from `user_2fa`, and sets `two_factor_enabled = false` in their profile.
    ```javascript
    // Example frontend call (requires user to be authenticated)
    const { data, error } = await supabase.functions.invoke('disable-2fa');
    if (error) throw error;
    // 2FA is now disabled
    ```

## 4. Security Considerations

- **Function Security**: Ensure your Edge Functions handle authentication and authorization correctly. The provided functions use the JWT from the `Authorization` header to identify the user and use the `SERVICE_ROLE_KEY` for admin operations. Review policies on the `user_2fa` table.
- **Recovery Keys**: Instruct users to store recovery keys securely. Implement logic to handle used recovery keys if you add that feature.
- **Rate Limiting**: Consider adding rate limiting to functions like `verify-totp` to prevent brute-force attacks.
- **Login TOTP Verification**: As mentioned, create a secure Edge Function for verifying TOTP during login that retrieves the secret server-side. Never trust a secret sent from the client during login verification.
