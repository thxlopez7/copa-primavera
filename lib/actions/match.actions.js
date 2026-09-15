"use server";

import { createClient } from "@/lib/supabase-server";
import { MatchEngine } from "@/lib/domain/MatchEngine";
import { revalidatePath } from "next/cache";

/**
 * Actualiza el resultado de un partido y propaga al ganador si existe un DAG (cuadro eliminatorio).
 * 
 * @param {string} matchId - UUID del partido a actualizar
 * @param {Object} resultJson - JSONB con el resultado (sets, is_walkover, etc)
 */
export async function updateMatchResult(matchId, resultJson) {
  try {
    const supabase = createClient();
    
    // 1. Verificación estricta de seguridad E2E con cookies
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      throw new Error("No autorizado");
    }

    // 2. Obtener el estado actual del partido
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new Error(`Error al obtener el partido: ${matchError?.message}`);
    }

    // 2. Determinar el ganador usando el Motor de Dominio
    const winnerId = MatchEngine.calculateWinner(resultJson, match.team1_id, match.team2_id);
    
    // Si la función retorna un ganador explícito, lo guardamos en el JSONB
    if (winnerId) {
      resultJson.winner_id = winnerId;
    } else {
      resultJson.winner_id = null;
    }

    // 3. Actualizar el partido actual
    const isCompleted = winnerId !== null || resultJson.is_walkover;
    const { error: updateError } = await supabase
      .from('matches')
      .update({
        status: isCompleted ? 'completed' : 'scheduled',
        result: resultJson
      })
      .eq('id', matchId);

    if (updateError) {
      throw new Error(`Error al actualizar el partido: ${updateError.message}`);
    }

    // 4. Propagación Automática (Si es Knockout y hay un ganador y hay próximo partido)
    if (isCompleted && winnerId && match.next_match_id) {
      // Obtener el próximo partido para ver qué slot está libre
      const { data: nextMatch } = await supabase
        .from('matches')
        .select('team1_id, team2_id')
        .eq('id', match.next_match_id)
        .single();

      if (nextMatch) {
        // Si el equipo 1 ya está ocupado por este mismo jugador, no hacemos nada.
        // Si el equipo 1 está vacío, lo asignamos ahí. Sino al equipo 2.
        let updateField = 'team2_id';
        if (!nextMatch.team1_id || nextMatch.team1_id === winnerId) {
          updateField = 'team1_id';
        }

        const { error: propagateError } = await supabase
          .from('matches')
          .update({ [updateField]: winnerId })
          .eq('id', match.next_match_id);

        if (propagateError) {
          throw new Error(`Error en la propagación al siguiente partido: ${propagateError.message}`);
        }
      }
    }

    revalidatePath('/admin/fixtures');
    revalidatePath('/admin');
    revalidatePath('/fixture');
    revalidatePath('/resultados');

    return { success: true };
  } catch (error) {
    console.error("[updateMatchResult] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza la programación (fecha, hora y cancha) de un partido.
 * 
 * @param {string} matchId - UUID del partido
 * @param {string} scheduledAt - Fecha y hora
 * @param {string} court - Cancha designada
 */
export async function updateMatchSchedule(matchId, scheduledAt, court) {
  try {
    const supabase = createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      throw new Error("No autorizado");
    }
    const { error } = await supabase
      .from('matches')
      .update({ scheduled_at: scheduledAt, court })
      .eq('id', matchId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/fixtures');
    revalidatePath('/admin');
    revalidatePath('/programacion');
    
    return { success: true };
  } catch (error) {
    console.error("[updateMatchSchedule] Error:", error);
    return { success: false, error: error.message };
  }
}
