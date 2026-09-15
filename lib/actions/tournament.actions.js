"use server";

import { supabase } from "@/lib/supabase";
import { KnockoutStageService } from "@/lib/domain/KnockoutStageService";
import { GroupStageService } from "@/lib/domain/GroupStageService";
import { revalidatePath } from "next/cache";

/**
 * Genera e inserta en base de datos la fase eliminatoria completa.
 * Dado que el dominio genera un DAG (Grafo Acíclico Dirigido) en memoria con IDs temporales,
 * esta función resuelve topológicamente la inserción para asegurar integridad referencial.
 * 
 * @param {string} categoryId - UUID de la categoría
 * @param {Array} pairs - Array de parejas (u objetos con ID) a sembrar en el cuadro.
 * @param {number} forcedSize - (Opcional) Tamaño base forzado del cuadro
 */
export async function generateKnockoutPhase(categoryId, pairs, forcedSize = null) {
  try {
    // 1. Obtener el Grafo en memoria desde la Capa de Dominio Pura
    const bracketMatches = KnockoutStageService.generateBracket(pairs, categoryId, forcedSize);

    // 2. Preparar el mapeo de IDs Temporales (del frontend/dominio) a IDs Reales (de la DB)
    const idMap = new Map();

    // 3. Resolución Topológica:
    // El dominio genera el array desde la ronda inicial (Ej: QF) hacia la Final (último elemento).
    // Para respetar foreign keys de `next_match_id`, insertamos de atrás hacia adelante (Final -> Semis -> Cuartos).
    const topolocicalOrder = [...bracketMatches].reverse();

    // Nota: Se insertan secuencialmente para capturar el ID real y mapear a los hijos.
    // Si la DB estuviese muy cargada, se podría optimizar agrupando por "rondas", 
    // pero para brackets de pádel (max ~64), una iteración secuencial es segura y sencilla.
    for (const match of topolocicalOrder) {
      const tempId = match.id;
      
      // Armamos el payload descartando el tempId original
      const payload = {
        category_id: match.category_id,
        team1_id: match.team1_id,
        team2_id: match.team2_id,
        match_type: match.phase,
        status: match.status,
        round_name: match.round_name,
        result: match.result,
        scheduled_at: match.scheduled_at,
        court: match.court,
        // Si el partido apuntaba a un next_match temporal, buscamos su ID real ya insertado
        next_match_id: match.next_match_id ? idMap.get(match.next_match_id) : null
      };

      const { data: insertedMatch, error: insertError } = await supabase
        .from('matches')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) {
        throw new Error(`Error al insertar partido ${match.round}: ${insertError.message}`);
      }

      // Guardamos en el diccionario el ID real para que las rondas previas puedan apuntarle
      idMap.set(tempId, insertedMatch.id);
    }

    return { success: true, message: "Bracket eliminatorio generado y mapeado exitosamente." };
  } catch (error) {
    console.error("[generateKnockoutPhase] Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Orquestador principal del Wizard. Genera y publica las fases solicitadas.
 * 
 * @param {Object} config - { categoryId, pairs (array de ids/objs), format ('groups', 'knockout', 'both'), settings }
 */
export async function publishTournamentPhase(config) {
  try {
    const { categoryId, pairs, format, settings } = config;
    if (!categoryId || !pairs || pairs.length === 0) {
      throw new Error("Faltan datos requeridos (categoría o parejas).");
    }

    let results = { groupsCreated: 0, bracketCreated: false };

    // 1. Si incluye fase de grupos
    if (format === 'groups' || format === 'both') {
      const groupsCount = parseInt(settings.groupsCount) || 1;
      
      // Lógica simplificada: chunking lineal
      // En un torneo real, se usaría un algoritmo de Seeding.
      const chunkSize = Math.ceil(pairs.length / groupsCount);
      let groupMatchesToInsert = [];
      
      for (let i = 0; i < groupsCount; i++) {
        const groupPairs = pairs.slice(i * chunkSize, (i + 1) * chunkSize);
        if (groupPairs.length > 1) {
          const groupLetter = String.fromCharCode(65 + i); // A, B, C...
          const rawMatches = GroupStageService.generateRoundRobin(groupPairs, categoryId, groupLetter);
          
          // Mapeo seguro al schema real de DB
          const dbMatches = rawMatches.map(m => ({
            category_id: m.category_id,
            team1_id: m.team1_id,
            team2_id: m.team2_id,
            match_type: m.phase,
            status: m.status,
            round_name: m.round_name,
            result: m.result,
            scheduled_at: m.scheduled_at,
            court: m.court
          }));
          groupMatchesToInsert = groupMatchesToInsert.concat(dbMatches);
        }
      }

      if (groupMatchesToInsert.length > 0) {
        const { error: insertError } = await supabase.from('matches').insert(groupMatchesToInsert);
        if (insertError) throw new Error(`Error insertando grupos: ${insertError.message}`);
        results.groupsCreated = groupMatchesToInsert.length;
      }
    }

    // 2. Si incluye eliminación directa
    if (format === 'knockout' || format === 'both') {
      const qualifiedCount = parseInt(settings.qualifiedCount) || pairs.length;
      const bracketRes = await generateKnockoutPhase(categoryId, pairs, qualifiedCount);
      if (!bracketRes.success) {
        throw new Error(`Error en bracket: ${bracketRes.error}`);
      }
      results.bracketCreated = true;
    }

    revalidatePath('/fixture');
    revalidatePath('/admin/torneo');

    return { success: true, data: results };
  } catch (error) {
    console.error("[publishTournamentPhase] Error:", error);
    return { success: false, error: error.message };
  }
}
