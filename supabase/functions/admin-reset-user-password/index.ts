import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient } from "../_shared/supabase.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }

    const supabase = createSupabaseClient();
    
    // Verificar autenticação
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Verificar se é admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { userId, newPassword }: ResetPasswordRequest = await req.json();

    if (!userId || !newPassword) {
      throw new Error('userId and newPassword are required');
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    // Resetar senha usando Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    console.log(`[Admin] Password reset successful for user ${userId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Password reset successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('[Admin Reset Password Error]', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Unauthorized' || error.message === 'Admin access required' ? 403 : 500,
      }
    );
  }
});
