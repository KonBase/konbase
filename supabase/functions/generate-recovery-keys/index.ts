import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

// Function to generate a random recovery key
function generateRandomKey(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Function to format a recovery key with hyphens
function formatKey(key: string) {
  return key.match(/.{1,4}/g)?.join('-') || key;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Default to 8 keys if not specified
    const body = await req.json().catch(() => ({}));
    const count = body?.count || 8;

    // Generate the requested number of recovery keys
    const keys = Array.from({ length: count }, () => {
      const rawKey = generateRandomKey(10);
      return formatKey(rawKey);
    });

    console.log(`Generated ${count} recovery keys`);

    return new Response(
      JSON.stringify({
        keys,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error generating recovery keys:', error.message);

    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});
