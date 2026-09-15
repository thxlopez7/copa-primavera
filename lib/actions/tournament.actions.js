"use server";

import { createClient } from "@/lib/supabase-server";
import { KnockoutStageService } from "@/lib/domain/KnockoutStageService";
import { GroupStageService } from "@/lib/domain/GroupStageService";
import { revalidatePath } from "next/cache";

/**
 * Genera e inserta en base de datos la fase eliminatoria completa.
 * Operación Atómica gracias al Batch Insert de Supabase (PostgreSQL).
 * 
 * @param {string} categoryId - UUID de la categoría
 * @param {Array} pairs - Array de parejas (u objetos con ID) a sembrar en el cuadro.
 */
export async function generateKnockoutPhase(categoryId, pairs) {
  try {
    const supabase = await createClient();

    // 1. Obtener el Grafo en memoria desde la Capa de Dominio Pura (con IDs y slots)
    const bracketMatches = KnockoutStageService.generateBracket(pairs, categoryId);

    // 2. Inserción Transaccional Idempotente (RPC)
    const { error: insertError } = await supabase.rpc('insert_tournament_phase', {
      p_category_id: categoryId,
      p_phase: 'knockout',
      p_matches: bracketMatches
    });

    if (insertError) {
      throw new Error(`Error al insertar bracket: ${insertError.message}`);
    }

    return { success: true, message: "Bracket eliminatorio generado exitosamente." };
  } catch (error) {
    console.error("[generateKnockoutPhase] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Orquestador principal del Wizard. Genera y publica las fases solicitadas.
 * 
 * @param {Object} config - { categoryId, pairs, format ('groups', 'knockout', 'both'), settings }
 */
export async function publishTournamentPhase(config) {
  try {
    const supabase = await createClient();
    const { categoryId, pairs, format } = config;
    if (!categoryId || !pairs || pairs.length === 0) {
      throw new Error("Faltan datos requeridos (categoría o parejas).");
    }

    let results = { groupsCreated: 0, bracketCreated: false };

    // 1. Fase de Grupos
    if (format === 'groups' || format === 'both') {
      // Idempotencia resuelta transaccionalmente vía RPC (solo validamos para no hacer cálculos innecesarios en Node)
      const { count } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('phase', 'group_stage');
      
      if (count > 0) {
        throw new Error("No se pudo generar porque ya existe una fase de grupos para esta categoría.");
      }

      // Barajar (shuffle) las parejas aleatoriamente para distribuirlas.
      // OJO: El sorteo es aleatorio, pero el resultado se persiste permanentemente.
      const shuffledPairs = [...pairs].sort(() => Math.random() - 0.5);
      
      const groupsCount = Math.max(1, Math.ceil(shuffledPairs.length / 4));
      const groups = Array.from({ length: groupsCount }, () => []);
      shuffledPairs.forEach((pair, idx) => {
        groups[idx % groupsCount].push(pair);
      });

      let groupMatchesToInsert = [];
      
      groups.forEach((groupPairs, idx) => {
        if (groupPairs.length > 1) {
          const groupLetter = String.fromCharCode(65 + idx); // A, B, C...
          const rawMatches = GroupStageService.generateRoundRobin(groupPairs, categoryId, groupLetter);
          groupMatchesToInsert = groupMatchesToInsert.concat(rawMatches);
        }
      });

      if (groupMatchesToInsert.length > 0) {
        // Inserción Transaccional Idempotente (RPC)
        const { error: insertError } = await supabase.rpc('insert_tournament_phase', {
          p_category_id: categoryId,
          p_phase: 'group_stage',
          p_matches: groupMatchesToInsert
        });
        if (insertError) throw new Error(`Error insertando grupos: ${insertError.message}`);
        results.groupsCreated = groupMatchesToInsert.length;
      }
    }

    // 2. Fase Eliminatoria Directa
    if (format === 'knockout' || format === 'both') {
      // Para "both" generalmente el knockout se genera DESPUÉS de terminada la fase de grupos.
      // Si el usuario elige "ambos" en el wizard inicial, generaremos el bracket con las parejas iniciales?
      // Lo ideal es que para "both" el knockout espere a los clasificados.
      // Si format es "knockout" exclusivo, sembramos a todos.
      if (format === 'knockout') {
        const bracketRes = await generateKnockoutPhase(categoryId, pairs);
        if (!bracketRes.success) {
          throw new Error(`Error en bracket: ${bracketRes.error}`);
        }
        results.bracketCreated = true;
      }
    }

    revalidatePath('/fixture');
    revalidatePath('/admin/torneo');

    return { success: true, data: results };
  } catch (error) {
    console.error("[publishTournamentPhase] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene todos los partidos generados de una categoría,
 * cruzando los datos con los equipos para mostrar el Bracket o Grupos.
 */
export async function fetchCategoryMatches(categoryId) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        team1:team1_id(id, player1:player1_id(last_name, first_name), player2:player2_id(last_name, first_name)),
        team2:team2_id(id, player1:player1_id(last_name, first_name), player2:player2_id(last_name, first_name))
      `)
      .eq('category_id', categoryId)
      .order('id');

    if (error) throw new Error(error.message);

    return { success: true, data };
  } catch (error) {
    console.error("[fetchCategoryMatches] Error:", error);
    return { success: false, error: error.message };
  }
}
