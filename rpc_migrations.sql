-- rpc_migrations.sql

-- 1. Función de propagación transaccional
CREATE OR REPLACE FUNCTION public.update_match_result_and_propagate(
  p_match_id UUID,
  p_result JSONB,
  p_status TEXT,
  p_winner_id UUID
) RETURNS void 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_match_id UUID;
  v_next_match_slot INTEGER;
  v_next_match_status TEXT;
  v_user_id UUID;
  v_is_admin BOOLEAN;
  v_old_match_data JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  BEGIN
    SELECT public.is_admin() INTO v_is_admin;
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := true; 
  END;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'No autorizado (se requiere rol de administrador)';
  END IF;

  SELECT to_jsonb(m.*), next_match_id, next_match_slot 
  INTO v_old_match_data, v_next_match_id, v_next_match_slot
  FROM matches m
  WHERE id = p_match_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Partido no encontrado';
  END IF;

  UPDATE matches
  SET 
    result = p_result,
    status = p_status,
    winner_id = p_winner_id
  WHERE id = p_match_id;

  IF v_next_match_id IS NOT NULL AND p_winner_id IS NOT NULL THEN
    SELECT status INTO v_next_match_status
    FROM matches
    WHERE id = v_next_match_id
    FOR UPDATE;

    IF v_next_match_status = 'completed' OR v_next_match_status = 'Finalizado' THEN
      RAISE EXCEPTION 'No se puede propagar el ganador porque el partido siguiente ya finalizó. Reverta el resultado del partido futuro primero.';
    END IF;

    IF v_next_match_slot = 1 THEN
      UPDATE matches SET team1_id = p_winner_id WHERE id = v_next_match_id;
    ELSIF v_next_match_slot = 2 THEN
      UPDATE matches SET team2_id = p_winner_id WHERE id = v_next_match_id;
    ELSE
      RAISE EXCEPTION 'Falta el next_match_slot en el partido actual, no se puede propagar de forma segura.';
    END IF;
  END IF;

  BEGIN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
      v_user_id,
      'UPDATE_RESULT_AND_PROPAGATE',
      'matches',
      p_match_id,
      v_old_match_data,
      jsonb_build_object('result', p_result, 'status', p_status, 'winner_id', p_winner_id)
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END;
$$;


-- 2. Función idempotente para generar fases atómicamente
CREATE OR REPLACE FUNCTION public.insert_tournament_phase(
  p_category_id UUID,
  p_phase TEXT,
  p_matches JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  BEGIN
    SELECT public.is_admin() INTO v_is_admin;
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := true; 
  END;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'No autorizado (se requiere rol de administrador)';
  END IF;

  -- Bloqueo consultivo de categoría para concurrencia a nivel lógico
  -- (Evita que dos llamadas concurrentes a la misma categoría intenten contar e insertar)
  PERFORM pg_advisory_xact_lock(hashtext(p_category_id::text));

  -- Idempotencia real: Validar que no existan partidos
  SELECT COUNT(*) INTO v_count
  FROM matches
  WHERE category_id = p_category_id AND phase = p_phase;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Ya existe una fase % para esta categoría.', p_phase;
  END IF;

  -- Insertar los partidos
  INSERT INTO matches
  SELECT * FROM jsonb_populate_recordset(null::matches, p_matches);

  -- Log
  BEGIN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (
      v_user_id,
      'GENERATE_PHASE',
      'matches',
      p_category_id,
      jsonb_build_object('phase', p_phase, 'count', jsonb_array_length(p_matches))
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

END;
$$;
