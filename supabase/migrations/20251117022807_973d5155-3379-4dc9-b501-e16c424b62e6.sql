-- Corrigir search_path da função update_ai_suggestion_updated_at
-- Security Fix: 0011_function_search_path_mutable

CREATE OR REPLACE FUNCTION update_ai_suggestion_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;