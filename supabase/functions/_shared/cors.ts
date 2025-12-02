/**
 * Shared CORS headers and utilities for Edge Functions
 * 
 * Usage:
 * import { corsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
 * 
 * // In your handler:
 * const corsResponse = handleCorsPreflightRequest(req);
 * if (corsResponse) return corsResponse;
 * 
 * // In your response:
 * return new Response(JSON.stringify(data), {
 *   headers: { ...corsHeaders, 'Content-Type': 'application/json' }
 * });
 */

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Handle CORS preflight OPTIONS request
 * Returns a Response if it's a preflight request, null otherwise
 */
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

/**
 * Create a JSON response with CORS headers
 */
export function createCorsResponse(
  data: unknown,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Create an error response with CORS headers
 */
export function createErrorResponse(
  error: string | Error,
  status: number = 500
): Response {
  const message = error instanceof Error ? error.message : error;
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
