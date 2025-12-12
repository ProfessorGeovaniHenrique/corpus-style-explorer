/**
 * Verifica se o kill flag de emergência está ativo via Redis
 * Usado por todas as edge functions de processamento para parar imediatamente
 */

export async function isEmergencyKillActive(): Promise<boolean> {
  const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!redisUrl || !redisToken) {
    return false;
  }

  try {
    const response = await fetch(redisUrl, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${redisToken}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(["GET", "emergency:kill_flag"]),
    });

    const data = await response.json();
    return data?.result === "true";
  } catch (err) {
    console.warn("[EMERGENCY-CHECK] Falha ao verificar kill flag:", err.message);
    return false;
  }
}

export async function clearEmergencyKillFlag(): Promise<boolean> {
  const redisUrl = Deno.env.get("UPSTASH_REDIS_REST_URL");
  const redisToken = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

  if (!redisUrl || !redisToken) {
    return false;
  }

  try {
    await fetch(redisUrl, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${redisToken}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(["DEL", "emergency:kill_flag"]),
    });
    
    await fetch(redisUrl, {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${redisToken}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(["DEL", "backpressure:cooldown_until"]),
    });
    
    return true;
  } catch (err) {
    console.warn("[EMERGENCY-CHECK] Falha ao limpar kill flag:", err.message);
    return false;
  }
}
