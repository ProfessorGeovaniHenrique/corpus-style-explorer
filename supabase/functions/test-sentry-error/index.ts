import { createEdgeLogger } from "../_shared/unified-logger.ts";
import { captureException } from "../_shared/sentry.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  const log = createEdgeLogger('test-sentry-error', requestId);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log.info('Sentry smoke test initiated');
    
    // Force an error
    const testError = new Error('🧪 Sentry Backend Smoke Test - This is a deliberate error');
    
    // Log it and send to Sentry
    log.error('Test error captured', testError, { 
      test_type: 'smoke_test',
      severity: 'high' 
    });
    
    await captureException(testError, {
      functionName: 'test-sentry-error',
      requestId,
      extra: {
        test: true,
        timestamp: new Date().toISOString()
      }
    });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Test error sent to Sentry',
        message: 'Check Sentry dashboard for this error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );

  } catch (error: any) {
    log.fatal('Unexpected error in test function', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
