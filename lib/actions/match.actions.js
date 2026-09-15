"use server";

import { createClient } from "@/lib/supabase-server";
import { MatchEngine } from "@/lib/domain/MatchEngine";
import { revalidatePath } from "next/cache";

/**
 * Actualiza el resultado de un partido y propaga al ganador si existe un DAG (cuadro eliminatorio).
 * Utiliza una RPC (Transacción PostgreSQL) para evitar Race Conditions y corrupciones en el Bracket.
 * 
 * @param {string} matchId - UUID del partido a actualizar
 * @param {Object} resultJson - JSONB con el resultado (sets, is_walkover, etc)
 */
export async function updateMatchResult(matchId, resultJson) {
  try {
    const supabase = await createClient();
    
    // 1. Obtener el estado actual del partido
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('team1_id, team2_id')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      throw new Error(`Error al obtener el partido: ${matchError?.message}`);
    }

    // 2. Determinar el ganador usando el Motor de Dominio Puro
    MatchEngine.validateResult(resultJson, match.team1_id, match.team2_id);
    const winnerId = MatchEngine.calculateWinner(resultJson, match.team1_id, match.team2_id);
    
    if (winnerId) {
      resultJson.winner_id = winnerId;
    } else {
      resultJson.winner_id = null;
    }

    const isCompleted = winnerId !== null || resultJson.is_walkover;
    const newStatus = isCompleted ? 'completed' : 'scheduled';

    // 3. Ejecutar la Transacción Atómica en Supabase
    // Si next_match_id no es nulo, la base de datos se encargará de propagar `winnerId` al slot correcto.
    const { error: rpcError } = await supabase.rpc('update_match_result_and_propagate', {
      p_match_id: matchId,
      p_result: resultJson,
      p_status: newStatus,
      p_winner_id: winnerId
    });

    if (rpcError) {
      // Manejar el caso donde la DB rechaza la propagación por partido futuro finalizado u otro error.
      throw new Error(rpcError.message);
    }

    revalidatePath('/admin/fixtures');
    revalidatePath('/admin');
    revalidatePath('/fixture');
    revalidatePath('/fixture/[category]', 'page');
    revalidatePath('/fixture/[slug]', 'page');
    revalidatePath('/');
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
    const supabase = await createClient();
    const { error } = await supabase
      .from('matches')
      .update({ scheduled_at: scheduledAt, court })
      .eq('id', matchId);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/fixtures');
    revalidatePath('/admin');
    revalidatePath('/programacion');
    revalidatePath('/fixture');
    revalidatePath('/fixture/[category]', 'page');
    revalidatePath('/fixture/[slug]', 'page');
    revalidatePath('/');
    
    return { success: true };
  } catch (error) {
    console.error("[updateMatchSchedule] Error:", error);
    return { success: false, error: error.message };
  }
}
